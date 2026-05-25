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

  // 환율 프록시: GET /.netlify/functions/butler?type=currency
  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.searchParams.get('type') === 'currency') {
      try {
        const r = await fetch('https://api.frankfurter.app/latest?from=GBP&to=KRW');
        const d = await r.json();
        return new Response(JSON.stringify(d), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: '환율 정보를 불러올 수 없습니다.' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
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
활동이 없거나 정보가 부족해도 반드시 위 JSON 형식을 유지하세요.`;

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

  const tools = useWebSearch ? [{
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 3
  }] : [];

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
        max_tokens: taskType === 'route_optimization' ? 1500 : 2000,
        system: taskType === 'route_optimization' ? routeSystemPrompt : systemPrompt,
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

    // JSON 파싱 시도
    let parsed;
    try {
      // 마크다운 코드블록 제거
      let cleanText = rawText
        .replace(/^```json\s*/m, '')
        .replace(/^```\s*/m, '')
        .replace(/```\s*$/m, '')
        .trim();

      // JSON 객체 추출 (가장 바깥 {} 매칭)
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        cleanText = cleanText.slice(start, end + 1);
      }

      parsed = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('JSON parse failed. rawText:', rawText.slice(0, 500));
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

// 기본 경로: /.netlify/functions/butler
