// Travel Butler — Netlify Function (Claude API 프록시)
// POST /.netlify/functions/butler
// Body: { query, context, taskType, useWebSearch }

export default async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API 키가 설정되지 않았습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: '요청 형식이 올바르지 않습니다.' }), { status: 400 });
  }

  const { query, context = {}, taskType = 'general', useWebSearch = false } = body;

  if (!query) {
    return new Response(JSON.stringify({ error: '질문을 입력해 주세요.' }), { status: 400 });
  }

  // 모델 선택 (PRD §3.3)
  function selectModel() {
    if (taskType === 'route_optimization') return 'claude-sonnet-4-6';
    if (taskType === 'trip_advice') return 'claude-sonnet-4-6';  // 일반 프롬프트(answer 반환)지만 품질 위해 Sonnet
    if (taskType === 'itinerary') return 'claude-sonnet-4-6';     // 전세계 일정 생성 (Trip Butler 프로토타입)
    if (useWebSearch) return 'claude-sonnet-4-6';
    return 'claude-haiku-4-5';
  }

  // 경로 최적화 전용 프롬프트
  const routeSystemPrompt = `당신은 황씨 가족의 런던 여행 동선 최적화 전문가입니다.

가족 프로필:
- 아빠 (에드워드): 분석·데이터 성향, 가성비 + 가족 컨디션 균형
- 엄마 (유효정): 안전·편안함 중시, 무리한 이동 싫어함
- 자녀 (만 12세): 활동적, 도시 화려함 좋아함

최적화 원칙:
1. 지리적으로 가까운 장소 묶기 (구역별 이동 최소화)
2. 오전: 혼잡한 명소 → 오후: 여유로운 쇼핑/카페
3. 식사 시간 (점심 12-13시, 저녁 18-19시) 반드시 포함
4. 이동 수단: 도보 > 튜브 > 버스 순 우선
5. 확정 예약(confirmed bookings)은 시간 고정, 나머지 배치
6. 총 이동 시간 하루 2시간 이내 목표
7. 가족 컨디션 고려 — 중간 휴식 30분 이상 확보

반드시 아래 JSON 형식으로만 응답하세요:
{
  "type": "route",
  "intro": "한 줄 요약 (40자 이내)",
  "timeline": [
    {
      "time": "09:30",
      "emoji": "🏛️",
      "activity": "장소 이름 (한국어)",
      "duration": "2시간",
      "transport": "이전 장소에서 이동 방법 (첫 번째는 '호텔 출발')",
      "tip": "현장 꿀팁 한 줄 (선택)",
      "type": "attraction|restaurant|shop|pub|rest|hotel"
    }
  ],
  "totalTime": "총 8시간",
  "tubeLines": ["Central", "Jubilee"],
  "advice": "오늘 전체 동선 핵심 조언 2-3문장"
}

절대 마크다운 코드블록(\`\`\`json)으로 감싸지 마세요. JSON 객체만 반환하세요.
활동이 없거나 정보가 부족해도 반드시 위 JSON 형식을 유지하세요.
출력은 최대한 간결하게: 활동(timeline)은 최대 8개, tip은 30자 이내, advice는 2문장 이내. 불필요한 공백·줄바꿈 없이 압축된 JSON으로 응답하세요.`;

  // 일반 시스템 프롬프트
  const systemPrompt = `당신은 황씨 가족의 런던 여행 집사 (Travel Butler) 입니다. 이름은 "버틀러"예요.

가족 프로필:
- 아빠 (에드워드): 분석·데이터 성향, 가성비 + 가족 컨디션 균형, P 성향
- 엄마 (유효정): 안전·편안함 중시
- 자녀 (만 12세): 국제학교, 영어 능숙, BP 디베이트 대회 참가, 도시 화려함 좋아함

여행 정보:
- 기간: 2026년 6월 15일(월) ~ 6월 22일(월), 7박 8일
- 호텔: Citadines Holborn-Covent Garden (Day 1-3) → The Royal Horseguards Hotel (Day 4-7, 조식 포함)
- 항공: 출국 KE907 ICN 10:55 → LHR 17:20 / 귀국 KE908 LHR 19:35 → ICN+1 16:15
- 확정 예약: Wimbledon Tour + Museum (Day 2, 6/16 화 14:30)

현재 컨텍스트:
${JSON.stringify(context, null, 2)}

응답 규칙:
1. 반드시 아래 JSON 형식으로만 응답하세요. 순수 텍스트 금지.
2. 카드가 필요 없는 간단한 답변은 cards를 빈 배열로, answer 필드에 답변 작성.
3. 추천·비교는 반드시 카드 형식.
4. 한국어로 답변.
5. 간결하고 실용적으로. 가족 컨디션 우선.

응답 JSON 형식:
{
  "type": "recommendation" | "answer" | "comparison" | "insight",
  "intro": "한 줄 요약 (40자 이내)",
  "answer": "카드 없는 직접 답변 (type이 answer일 때)",
  "cards": [
    {
      "id": "고유_id",
      "name": "영문 이름",
      "nameKo": "한국어 이름",
      "emoji": "이모지",
      "rating": 4.5,
      "price": "£10-20/인",
      "duration": "1-2h",
      "distance": "도보 5분",
      "address": "주소",
      "nearestTube": "가장 가까운 지하철역",
      "tags": ["태그1", "태그2"],
      "kidsFriendly": 4,
      "reason": "이 가족에게 추천하는 이유 (한 줄)",
      "tip": "현장 팁 (한 줄, 선택)",
      "actions": [
        { "type": "map", "label": "지도 보기", "lat": 51.5, "lng": -0.1 }
      ]
    }
  ]
}`;

  // 전세계 일정 생성 프롬프트 (Trip Butler 프로토타입 — 도시 무관)
  const itinerarySystemPrompt = `당신은 전세계 여행을 설계하는 AI 여행 플래너 "Trip Butler"입니다.
사용자가 준 도시·기간·동행·관심사에 맞춰 현실적이고 실용적인 여행 일정을 설계합니다.

설계 원칙:
1. 실제로 존재하는 장소만 사용 (가상의 장소·이름 절대 금지)
2. 지리적으로 가까운 장소를 같은 날에 묶어 이동 동선 최소화
3. 하루 3~5개 활동, 식사(점심·저녁)를 자연스럽게 포함, 무리하지 않게
4. 동행 구성 반영 (가족·아이 → 안전·체험 / 커플 → 분위기 / 친구 → 활동 / 혼자 → 자유도)
5. 관심사를 우선 반영하되 그 도시의 대표 명소도 균형 있게
6. lat·lng는 실제 위치에 최대한 정확하게 (소수점 4자리)
7. 모든 한국어 텍스트는 자연스럽고 간결하게

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록(\`\`\`)·설명·인사말 절대 금지. JSON 객체만 반환:
{
  "type": "itinerary",
  "destination": {
    "city": "영문 도시명", "cityKo": "한국어 도시명",
    "country": "영문 국가명", "countryKo": "한국어 국가명",
    "lat": 0.0, "lng": 0.0,
    "currency": "ISO 통화코드 (예: JPY, EUR, USD)", "currencySymbol": "통화기호",
    "language": "주요 언어", "summary": "도시 한 줄 소개 (40자 이내)",
    "highlights": ["대표 키워드", "3개"]
  },
  "days": [
    {
      "day": 1,
      "concept": "그날의 테마 (한국어, 20자 이내)",
      "activities": [
        {
          "name": "영문 장소명", "nameKo": "한국어 장소명",
          "type": "attraction|restaurant|cafe|shop|park|nightlife|experience",
          "emoji": "이모지", "lat": 0.0, "lng": 0.0,
          "duration": "예: 1-2h",
          "why": "이 동행에게 추천하는 이유 (한 줄)",
          "tip": "현장 팁 (선택, 한 줄)"
        }
      ]
    }
  ],
  "tips": ["여행 실용 팁 (2~3개, 한국어)"]
}

요청한 일수만큼 days를 채우세요. 활동(activities)은 하루 3~5개. 출력은 압축된 JSON으로 간결하게.`;

  const tools = useWebSearch ? [{
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 3
  }] : [];

  // 시스템 프롬프트 선택
  const sysPrompt =
    taskType === 'route_optimization' ? routeSystemPrompt :
    taskType === 'itinerary'          ? itinerarySystemPrompt :
    systemPrompt;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: selectModel(),
        max_tokens: taskType === 'itinerary' ? 8000 : (taskType === 'route_optimization' ? 2500 : 2000),
        system: sysPrompt,
        tools: tools.length ? tools : undefined,
        messages: [{ role: 'user', content: query }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return new Response(JSON.stringify({ error: 'AI 응답 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await response.json();

    // 텍스트 블록 추출 (web_search tool_result 포함 대응)
    let rawText = '';
    for (const block of data.content || []) {
      if (block.type === 'text') rawText += block.text;
    }

    // JSON 파싱 (코드펜스/프로즈/후행콤마/절단 모두 견디는 강건 파서)
    let parsed;
    try {
      parsed = parseAiJson(rawText);
    } catch (parseErr) {
      console.error('JSON parse failed. rawText:', rawText.slice(0, 800));
      // route_optimization 실패 시 명확한 에러 타입 반환
      if (taskType === 'route_optimization') {
        parsed = { type: 'error', error: '동선 응답 파싱 오류. 다시 시도해 주세요.' };
      } else {
        parsed = { type: 'answer', intro: '버틀러 응답', answer: rawText, cards: [] };
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error('Butler function error:', err);
    return new Response(JSON.stringify({ error: '네트워크 오류가 발생했어요.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// ─── 강건한 JSON 파서 (모델 응답용) ───
// 코드펜스 제거 → 첫 '{'부터 절단 → (a)마지막 '}'까지 (b)전체 순으로
// 후행 콤마 제거 + 절단(truncation) 복구를 모두 시도.
export function parseAiJson(rawText) {
  let t = (rawText || '').trim();
  // 1) 마크다운 코드펜스 제거 (위치 무관)
  t = t.replace(/```json/gi, '').replace(/```/g, '').trim();
  // 2) 첫 '{' 이전의 프로즈 제거
  const start = t.indexOf('{');
  if (start === -1) throw new Error('JSON 객체를 찾을 수 없음');
  t = t.slice(start);

  const candidates = [];
  const lastClose = t.lastIndexOf('}');
  if (lastClose !== -1) candidates.push(t.slice(0, lastClose + 1)); // 후행 프로즈 제거본
  candidates.push(t); // 절단 복구용 전체

  for (const cand of candidates) {
    // (a) 후행 콤마 제거 후 직접 파싱
    const noTrailingComma = cand.replace(/,(\s*[}\]])/g, '$1');
    try { return JSON.parse(noTrailingComma); } catch (_) { /* 계속 */ }
    // (b) 절단 복구 후 파싱
    try {
      const repaired = repairTruncatedJson(cand).replace(/,(\s*[}\]])/g, '$1');
      return JSON.parse(repaired);
    } catch (_) { /* 계속 */ }
  }
  throw new Error('JSON 파싱 실패');
}

// 중간에 잘린 JSON을 닫아 유효하게 복구 (열린 문자열/배열/객체 정리)
export function repairTruncatedJson(s) {
  const stack = [];
  let inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === '{') stack.push('}');
      else if (ch === '[') stack.push(']');
      else if (ch === '}' || ch === ']') stack.pop();
    }
  }
  let out = s;
  if (inStr) out += '"';                       // 열린 문자열 닫기
  out = out.replace(/[:,]\s*$/, '');           // 끝의 콜론/콤마(미완성 키·값) 제거
  while (stack.length) out += stack.pop();     // 열린 괄호 닫기
  return out;
}

// 기본 경로: /.netlify/functions/butler
