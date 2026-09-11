# BE API 계약 (2026-09-11 기준, `newspin-be`)

전체 스펙은 [`openapi.json`](openapi.json)(BE `/v3/api-docs` 원본 export, 갱신 시 재-export) 또는
BE 실행 중 `http://localhost:8080/swagger-ui/index.html` 참고. 이 문서는 FE 작업 시 놓치기 쉬운
계약 포인트만 정리한다.

## 공통 응답 포맷

모든 응답은 다음 껍질로 온다(`src/api/types.ts`의 `ApiResponse<T>`):

```json
{ "status": "success" | "error", "code": "200" | "C001" | "S008" | ..., "message": "...", "data": T | null }
```

- 성공: `status: "success"`, `data`에 실제 값.
- 실패: `status: "error"`, `data`는 보통 `null` (단, validation 에러는 예외 — 아래 참고).
- **예외**: access token 만료/위조는 `JwtAuthenticationFilter`가 필터 단계에서 바로 raw `401`을
  내려보낸다. 이 경우 응답 바디가 아예 없다(`ApiResponse` 형태가 아님) — 반드시 **HTTP 상태 코드
  401**만 보고 판단해야 한다. `src/api/client.ts`의 인터셉터가 이미 이렇게 처리해뒀다.
- validation 실패(`@Valid`)는 `data`에 `{ "필드명": "메시지" }` 맵이 들어온다(예: `{"email": "이메일 형식이 올바르지 않습니다."}`).

## 목록 API — 페이지네이션 (I-10)

`GET /simulation/sessions`, `GET /simulation/sessions/{id}/trades` 는 배열이 아니라:

```ts
{ content: T[], page: number, size: number, totalElements: number, totalPages: number, hasNext: boolean }
```

- 쿼리 파라미터: `page`(0-base, 기본 0), `size`(기본 20, **서버가 최대 100으로 캡** — 100 넘게
  보내도 100으로 잘림), `sort`(예: `sort=createdAt,desc`).
- `src/hooks/useSessionList.ts`, `useTradeHistory.ts` 에 사용 예시.

## 투자 리포트 — 비동기 생성 (I-11)

`GET /simulation/sessions/{id}/report` 는 **폴링 계약**이다. 한 번에 완성된 응답이 오지 않는다.

1. 첫 호출: 규칙 기반 요약(자산/수익률/거래수)은 즉시 채워지고, `status: "GENERATING"` + AI 분석
   4개 필드는 전부 `null`. **HTTP 202.**
2. 클라이언트가 같은 엔드포인트를 주기적으로(권장 2~3초) 다시 호출.
3. 완료되면 `status: "READY"` + 4개 필드 전부 채워짐. **HTTP 200.**
4. 실패하면 `status: "FAILED"`(HTTP 202) — 그래도 계속 폴링하면 된다. 서버가 다음 조회 시 자동
   재시도한다.
5. 이미 `READY`인 세션을 다시 조회하면 저장된 결과를 즉시 반환(재생성 없음, 무료).

`src/hooks/useInvestmentReport.ts` 가 이 폴링을 감싸서, 화면 쪽에서는 `report.status` 값만 보고
분기하면 되게 해뒀다(`refetchInterval`을 상태에 따라 켜고 끔).

## 거래 체결가 검증 (C-3)

`POST /simulation/sessions/{id}/trades` 의 `price` 는 클라이언트가 "이 가격에 사고 싶다"고
제안하는 값이 아니라, **서버가 검증용으로 대조하는 값**이다. 서버가 계산한 세션 현재일 종가와
±1% 이상 차이나면 `409 (PRICE_MISMATCH, S008)`로 거절된다. 실제 체결가는 항상 서버 시세로
확정되고, 클라이언트가 보낸 `price`는 반영되지 않는다. 정상 흐름에서는 방금 시세 조회 API로 받은
종가를 그대로 보내면 된다.

## 시세 조회 — lookahead 차단 (C-5)

`GET /stocks/{code}/price-range?date=...` 는 `date` **이하**의 시세만 반환한다(최대 11거래일치,
차트 포인트 채우기용). `date` 는 항상 세션의 `currentSimulationDate`(서버가 계산한 현재
시뮬레이션 날짜)를 넘겨야 한다 — 사용자가 아직 보지 않은 미래 시세를 절대 노출하지 않는 게
이 서비스의 핵심 전제다. FE 가 임의의 미래 날짜를 넘긴다고 미래 시세가 나오지는 않지만, 애초에
그런 날짜를 만들어 보내지 않는 게 맞다.

## 인증

- `Authorization: Bearer <accessToken>` 헤더. access token 24h, refresh token 3d.
- `POST /user/refresh` 는 **토큰 회전**이다 — 요청에 쓴 refresh token 은 그 즉시 폐기되고 새
  access/refresh 쌍이 나온다. 같은 refresh token 을 두 번 쓰면 두 번째는 `400 (INVALID_REFRESHTOKEN, C005)`.
- 여러 기기에서 동시 로그인 가능(기기별 독립 세션) — 한 기기 로그인이 다른 기기 세션을 끊지 않는다.
- `POST /user/sign-up`, `/user/sign-in`, `/user/refresh`, `/user/email/*`, `/user/password/*` 만
  인증 없이 호출 가능. 나머지는 전부 `Authorization` 헤더 필요.

## 이번 라운드에서 바뀐 것 (기존 FE 코드가 있다면 반영 필요)

| 변경 | 영향 |
| --- | --- |
| I-10 페이지네이션 | `/simulation/sessions`, `/trades` 응답이 배열 → `PageResponse` 객체로 변경 |
| I-11 리포트 비동기 | `/report` 응답에 `status` 필드 추가, 최초 호출이 `202`일 수 있음(폴링 필요) |
| C-3 가격 검증 | 거래 요청 시 서버 시세와 크게 다른 `price`를 보내면 `409` (기존엔 검증 자체가 꺼져 있었음) |
| C-5 lookahead 차단 | 시세 조회가 기준일 이후 데이터를 더 이상 반환하지 않음 |

`newspin-be` 저장소의 `docs/00-baseline/04-final-summary.md`에 전체 변경 이력이 있다.
