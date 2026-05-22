# 시드 데이터 검증 (PRD §6.3, §7 대조)

> 생성: 2026-05-21 · 대상: `/data/*.json`

## 1. 파일 존재 + 항목 수

| 파일 | 존재 | 항목 수 | JSON 유효성 |
|---|---|---|---|
| days.json | ✅ | 8 (Day 1–8) | ✅ |
| zones.json | ✅ | 6 (Zone A–F) | ✅ |
| confirmed.json | ✅ | flights 2 / hotels 2 / bookings 1 | ✅ |
| attractions.json | ✅ | 13 | ✅ |
| restaurants.json | ✅ | 8 | ✅ |
| shops.json | ✅ | 6 | ✅ |
| pubs.json | ✅ | 4 | ✅ |
| checklist.json | ✅ | 4 카테고리 (17 항목) | ✅ |
| emergency.json | ✅ | 응급3 / 대사관1 / 호텔2 / 표현5 | ✅ |
| **etiquette.json** | ❌ **없음** | — | 인라인 내장으로 대체 |

> 9개 JSON 모두 파싱 성공 (node JSON.parse).

## 2. PRD §7 콘텐츠 목표 대비 (⚠️ 최대 갭)

PRD §7은 "80+ 아이템"을 목표로 Zone별 개수를 명시. 현재 **총 31개 = 약 37%**.

| Zone | PRD 목표 | 현재 | 달성률 | 부족분 |
|---|---|---|---|---|
| A (Holborn/Covent/Soho) | 25 | 13 | 52% | -12 |
| B (Westminster/강변) | 15 | 6 | 40% | -9 |
| C (Tower/Borough) | 12 | 5 | 42% | -7 |
| D (Notting Hill) | 8 | 3 | 38% | -5 |
| E (Knightsbridge) | 5 | 3 | 60% | -2 |
| F (Oxford) | 10 | 1 | 10% | -9 |
| 펍 (전 Zone) | 8 | 4 | 50% | -4 |
| **합계** | **~83** | **31** | **37%** | **-52** |

타입별: 명소 13 / 식당 8 / 매장 6 / 펍 4.

**평가**: MVP 시연·동작에는 충분하나, "풍부한 자유도(§1.3 ⭐⭐⭐⭐⭐)"와 PRD §7 목표에는 크게 미달. 특히 **Zone F(옥스퍼드, 자녀 디베이트 핵심 가치)가 1개**로 가장 취약.

## 3. 필수 필드 검증 (PRD §6.3 활동 카드 모델 기준)

검사 필드: `id, type, zone, name, address, hours, rating, kidsFriendly, etiquette, coordinates`

**결과: ✅ 31개 전 항목 모두 필수 필드 충족 (누락 0건)**

- 추가 보유 필드: `nameKo, emoji, nearestTube, reviewCount, price, duration, parentFriendly, tags, curated, curatedReason, bestTimeOfDay, suggestedQuestions`
- ⚠️ PRD §6.3 모델과의 구조 차이:
  - PRD는 `basic: { name, address, coordinates, hours{mon~sun}, ... }` **중첩 구조** + `hours`가 요일별 객체.
  - 현재는 **평면 구조** + `hours`가 단일 문자열("10:00-18:00"). → 요일별 휴무(예: Borough Market 월·일 휴무) 자동 판별 불가. Phase 2 "오늘 운영 정상" 인사이트 구현 시 보완 필요.
  - PRD `image` 필드 → 현재 미사용(이모지 대체).

## 4. etiquette 카테고리 검증 (PRD §8.4 F27)

PRD 요구 카테고리: `pub, michelin, market, museum, debate, royal, theater`

- ❌ **별도 etiquette.json 없음** → 카테고리 분류 체계 부재.
- 현재: 각 활동에 자유 텍스트 배열로 매너 내장 (예: 교통박물관 → ["체험 전시 줄 서기","사진 OK","기념품샵 인기"]).
- **영향**: 동작은 하지만(카드 상세 → 매너 바텀시트 정상), 카테고리 기반 재사용·AI 매너 가이드(Phase 2)에는 구조 보강 필요.

## 5. confirmed.json 정확성 (특별 확인 요청)

| 항목 | 기대값 | 실제값 | 판정 |
|---|---|---|---|
| Wimbledon 날짜 | 6/16 | `2026-06-16` (day 2) | ✅ |
| Wimbledon 시간 | 14:30 | `14:30` | ✅ |
| Wimbledon 예약 | 완료 | `booked: true` | ✅ |
| 출국편 | KE907 6/15 | `KE907 ICN 10:55→LHR 17:20` | ✅ |
| 귀국편 | KE908 6/22 | `KE908 LHR 19:35→ICN+1 16:15` | ✅ |
| 호텔1 | Citadines 3박 | `2026-06-15~18` | ✅ |
| 호텔2 | Royal Horseguards 4박 | `2026-06-18~22, 조식 포함` | ✅ |

**확정 정보 100% 정확** ✅

## 판정
- 데이터 품질(스키마·필드): ✅ 우수
- 확정 정보 정확도: ✅ 100%
- 콘텐츠 볼륨: ❌ 37% (최우선 보완 대상)
- etiquette.json 구조: ⚠️ 카테고리화 필요
