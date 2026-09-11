# NewsPin Frontend (newspin-web)

뉴스를 읽고 호재/악재를 판단하는 학습 기능과, 그 판단을 모의투자로 이어보는 시뮬레이션의
프론트엔드. 백엔드는 [`newspin-be`](https://github.com/Investing-Trade/newspin-be)(Spring Boot).

## 스택

| 영역 | 구성 |
| --- | --- |
| 빌드/런타임 | Vite 8, React 19, TypeScript |
| 라우팅 | react-router-dom |
| 서버 상태 | @tanstack/react-query (캐싱, 페이지네이션, 폴링) |
| HTTP | axios (인터셉터로 JWT 첨부 + access token 만료 시 자동 refresh) |
| 스타일 | Tailwind CSS 4 (`@tailwindcss/vite`) |

## 시작하기

```bash
npm install
cp .env.example .env.local   # VITE_API_BASE_URL 등 (.env.local 은 gitignore 처리됨)
npm run dev                  # http://localhost:5173
```

로컬 BE는 `newspin-be` 저장소의 `docker compose up -d` + `./gradlew bootRun
--args='--spring.profiles.active=dev'`로 `http://localhost:8080`에 띄운다(CORS 기본 허용 origin이
`localhost:5173`).

```bash
npm run build     # tsc -b && vite build
npm run lint       # oxlint
```

## API 계약

**[docs/api-contract.md](docs/api-contract.md)를 코드 작성 전에 반드시 읽을 것** — 응답 공통
포맷, 목록 API 페이지네이션(I-10), 투자 리포트 비동기 폴링(I-11), 거래 가격 검증(C-3), 시세
lookahead 차단(C-5) 등 BE 쪽에서 최근 바뀐 계약이 정리돼 있다. 전체 스펙은
[docs/openapi.json](docs/openapi.json)(BE `/v3/api-docs` export, BE 변경 시 재-export 필요) 또는
BE 실행 중 `http://localhost:8080/swagger-ui/index.html`.

## 프로젝트 구조

```
src/
├── api/           BE 엔드포인트별 typed 클라이언트 (auth, news, stock, simulation, report)
│   ├── client.ts       axios 인스턴스 — JWT 첨부, 401 시 자동 refresh
│   ├── tokenStorage.ts localStorage 기반 토큰 저장
│   ├── types.ts        ApiResponse<T>, PageResponse<T> 공통 타입
│   └── domain.ts        BE enum 대응 타입
├── context/       AuthContext (로그인 상태, 토큰 관리)
├── hooks/         useSessionList/useTradeHistory(페이지네이션), useInvestmentReport(폴링)
├── pages/         화면 단위 컴포넌트
├── routes/        라우팅, 인증 가드(ProtectedRoute)
└── lib/           QueryClient 등 인프라 설정
```

`src/pages/*`는 각 API 패턴(페이지네이션, 비동기 폴링, mutation)을 보여주는 최소 예시다 — 실제
화면 디자인/기능은 이 위에 이어서 작업한다.

## 참고

- 이전 프론트엔드 시도(`newspin-fe`, JS 기반)가 있으나 이 저장소는 TypeScript + TanStack Query로
  새로 시작한다. 기존 화면 로직·API 사용 패턴은 참고 가능하나 그대로 옮기지 않는다.
- 백엔드 작업 기록: [`newspin-be/docs/`](https://github.com/Investing-Trade/newspin-be/tree/develop/docs)
