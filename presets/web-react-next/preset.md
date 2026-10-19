# 프리셋: 웹 (React / Next.js / Vite)

## 감지 조건

`package.json`에 `react-dom`이 있고 `react-native`가 없다.

| 의존성 | 판단 |
|---|---|
| `next` | Next.js. `app/` 디렉터리면 App Router, `pages/`면 Pages Router |
| `vite` | Vite SPA |
| `@tanstack/react-query` | `shared/stack/react-query.md` 적용 |
| `typescript` | `shared/stack/typescript.md` 적용 |

## 복사할 파일

| 원본 | 대상 | 조건 |
|---|---|---|
| `stack/react.md` | `.claude/skills/code-review-rules/stack/` | 항상 |
| `stack/nextjs.md` | 〃 | `next`가 있을 때 |
| `../shared/stack/*.md` | 〃 | 위 감지 조건 |
| `method.md` | `.claude/skills/ui-verify/method.md` | 항상 |

## 테스트 조합

| 층 | 도구 | 비고 |
|---|---|---|
| UI 상태 | Storybook + `msw-storybook-addon` | 스토리가 `ui-verify` 1순위 |
| 통합·단위 | Next면 Jest(`next/jest`), Vite면 Vitest + Testing Library | 통합 중심 (`test-strategy`) |
| E2E | Playwright | CI에서 공식 Docker 이미지로 |
| 모킹 | MSW (`msw/browser`, `msw/node`) | 개발 서버·Storybook·테스트 공용 handler |

모킹 스위치 환경변수: Next `NEXT_PUBLIC_API_MOCKING`, Vite `VITE_API_MOCKING`.

## scaffold (새 프로젝트에만, 승인 후)

| 파일 | 내용 |
|---|---|
| `scaffold/.github/workflows/ci.yml` | check(타입·린트·테스트) / storybook 빌드 / e2e. 모두 고정 Docker 이미지 |
| `scaffold/docker-compose.yml` | 의존 서비스만. 앱은 로컬 실행 |
| `../shared/scaffold/mocks/` | MSW handler·browser·server |
| `.nvmrc` | Node 버전 고정 (CI 이미지 태그와 같게) |

테스트 러너·Storybook·Playwright 설치와 초기 설정 파일은 각 도구의 공식 init 명령(`npx storybook@latest init`, `npm init playwright@latest`)으로 만든다. 직접 작성하지 않는다. 버전이 바뀌면 설정 형식이 달라진다.
