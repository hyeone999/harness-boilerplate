# 프리셋: React Native (Expo)

## 감지 조건

`package.json`에 `react-native`가 있다.

| 의존성 | 판단 |
|---|---|
| `expo` + `expo-dev-client` | Expo dev client. `method.md` 그대로 사용 |
| `expo-router` | 파일 기반 라우팅. `stack/navigation.md`의 Expo Router 항목 적용 |
| `@react-navigation/*` | React Navigation. `stack/navigation.md`의 React Navigation 항목 적용 |
| `@tanstack/react-query` | `shared/stack/react-query.md` 적용 |
| `typescript` | `shared/stack/typescript.md` 적용 |

Expo Go만 쓰거나 bare RN이면 `method.md`의 앱 실행 부분을 프로젝트에 맞게 고치도록 개발자에게 알린다.

## 복사할 파일

| 원본 | 대상 | 조건 |
|---|---|---|
| `stack/react-native.md` | `.claude/skills/code-review-rules/stack/` | 항상 |
| `stack/navigation.md` | 〃 | 라우팅 라이브러리가 있을 때 |
| `../shared/stack/*.md` | 〃 | 위 감지 조건 |
| `method.md` | `.claude/skills/ui-verify/method.md` | 항상 |

## 테스트 조합

| 층 | 도구 | 비고 |
|---|---|---|
| UI 상태 | (선택) Storybook React Native | 없으면 `ui-verify`는 시뮬레이터 캡처 |
| 통합·단위 | Jest(`jest-expo`) + React Native Testing Library | 통합 중심 (`test-strategy`) |
| E2E | Maestro | Docker로는 iOS 시뮬레이터 불가. 로컬·macOS 러너·Maestro Cloud |
| 모킹 | MSW (`msw/native`) | 테스트·개발 빌드 공용 handler |

모킹 스위치 환경변수: `EXPO_PUBLIC_API_MOCKING`.

## scaffold (새 프로젝트에만, 승인 후)

| 파일 | 내용 |
|---|---|
| `scaffold/.github/workflows/ci.yml` | check(타입·린트·Jest)만. 고정 Docker 이미지 |
| `../shared/scaffold/mocks/` | MSW handler·server (`msw/native`) |
| `.nvmrc` | Node 버전 고정 |

로컬 의존 서비스가 필요하면 웹 프리셋의 `docker-compose.yml`을 참고해 만든다.
