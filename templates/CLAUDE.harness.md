## 하네스 설정

> `/setup-harness`가 채운다. 스킬·커맨드는 `{설정:항목}` 표기로 이 값을 참조한다. 값이 바뀌면 여기만 고친다.

### 원칙

- **의사결정은 혼자 하지 않는다.** 명세·시안에 없는 동작, 기존 화면 변경, 새 에셋·컴포넌트·라이브러리 추가, 범위 밖 수정, 서버 값 추정이 필요하면 멈추고 개발자에게 묻는다. 기준은 `.claude/commands/feature.md`의 "의사결정" 절
- **지시가 충돌하면** 사용자 지시 > 팀 룰(이 문서·하네스) > 플러그인·외부 스킬 > 기본 동작. 어느 쪽을 따랐는지 밝힌다
- 300줄 넘는 파일은 범위 없이 읽지 않는다 (hook이 막는다). `grep -n`으로 위치를 찾고 offset/limit으로 읽는다
- 새 기능은 `/feature`로 진행한다

### 저장소

| 항목 | 값 |
|---|---|
| 기본 브랜치 | {{BASE_BRANCH}} |
| 커밋 형식 | {{COMMIT_FORMAT}} |
| 문체 | {{WRITING_STYLE}} |
| 리뷰어 | {{REVIEWER}} |

### 명령

| 항목 | 값 |
|---|---|
| 패키지 매니저 | {{PM}} |
| 타입체크 | `{{TYPECHECK_CMD}}` (에러 수: `{{TYPECHECK_COUNT}}`) |
| 린트 | `{{LINT_CMD}}` |
| 테스트 | `{{TEST_CMD}}` |
| 소스 확장자 | `{{SOURCE_EXT_REGEX}}` |
| 개발 서버 포트 | {{DEV_PORT}} |
| 앱 ID / 스킴 | {{APP_ID}} / {{APP_SCHEME}} |

### 아키텍처

이 프로젝트에서 각 역할을 하는 위치. 리뷰·분석은 여기를 기준으로 찾는다.

| 역할 | 위치 |
|---|---|
| 화면·라우트 | {{ROUTES_DIR}} |
| 기능 모듈 | {{FEATURES_DIR}} |
| API 호출 | {{API_DIR}} |
| 전역 상태 | {{STATE_DIR}} |
| 공용 컴포넌트 | {{COMPONENTS_DIR}} |
| 아이콘 | {{ICONS_DIR}} |
| mocks (MSW) | {{MOCKS_DIR}} |
| 스타일·테마 | {{THEME_DIR}} |

### 외부 소스

| 항목 | 값 |
|---|---|
| API 스키마 | {{API_SCHEMA}} |
| 모킹 스위치 | `{{MOCK_SWITCH}}` |
| 디자인 소스 | {{DESIGN_SOURCE}} |
| 테스트 | {{TEST_STACK}} |

### 문서 동기화

함께 바꿔야 하는 짝. 리뷰가 확인한다.

{{DOC_SYNC_RULES}}

### 고유 규칙

이 프로젝트에서 실제로 사고가 났던 항목. 사고가 나면 여기에 한 줄씩 추가한다.

{{PROJECT_RULES}}
