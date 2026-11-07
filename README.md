# harness-boilerplate

[![CI](https://github.com/hyeone999/harness-boilerplate/actions/workflows/ci.yml/badge.svg)](https://github.com/hyeone999/harness-boilerplate/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Claude Code로 프론트엔드 기능을 **명세 → 이슈 → 구현 → 테스트·검증 → 리뷰 → PR**까지 진행하는 작업 하네스와, 그 하네스를 설치·검사하는 CLI예요.

실제 서비스(React Native 앱)를 운영하면서 사고가 날 때마다 규칙을 추가해 다듬은 하네스를, 어떤 프로젝트에도 적용할 수 있게 스택과 프로젝트 값을 분리했어요.

## 무엇을 해결하나

| 문제 | 하네스의 대응 |
|---|---|
| 명세에 있는데 코드에 없는 항목을 사람이 일일이 대조 | `spec-crosscheck` — 항목마다 코드·배선·데이터 3단계 확인 |
| AI가 애매한 지점을 혼자 정해 버림 | **의사결정 규칙** — 멈추고 선택지를 제시해 물어봐요 |
| 같은 리뷰 지적이 반복됨 | `code-review-rules` — 실제 사고 사례 기반 체크리스트 |
| 긴 세션에서 앞의 결정을 잃음 | 작업 상태를 GitHub 이슈 체크박스에 외부화 |
| 큰 파일을 통째로 읽어 컨텍스트 낭비 | 300줄 넘는 파일 범위 없이 Read하면 hook이 차단 |
| "돌려봤다"로 검증을 끝냄 | `verify` — 위험도별 레벨, 항목마다 증거, 실패·불안정·검증 불가 판정 |
| PR 리뷰어가 앱을 띄워야 결과를 봄 | `github-pr` — 캡처를 전용 브랜치에 올려 PR에 첨부 |
| **하네스 문서가 깨져도 아무도 모름** | **`harness lint`·`doctor` — 설정 참조·frontmatter·hook 배선을 정적으로 검사** |

## 빠른 시작

```bash
# 1. 보일러플레이트 받기 (npm ci가 CLI를 빌드해요)
git clone https://github.com/hyeone999/harness-boilerplate.git ~/harness-boilerplate
cd ~/harness-boilerplate && npm ci && npm link

# 2. 대상 프로젝트에 설치
cd <프로젝트 루트>
harness init --dry-run   # 바뀔 파일 미리 보기
harness init
```

Claude Code에서 프로젝트 값을 채워요.

```
/setup-harness  (보일러플레이트 경로: ~/harness-boilerplate)
```

설정이 맞물리는지 확인하고, 기능 작업을 시작해요.

```bash
harness doctor
```

```
/feature  <기능명세서>  <디자인 링크>
```

## CLI

| 명령 | 하는 일 |
|---|---|
| `harness init [dir]` | `.claude/` 하네스를 복사하고 `settings.json`을 **덮어쓰지 않고 합쳐요**. 내용이 다른 기존 파일이 있으면 아무것도 쓰지 않고 멈춰요 (`--force`, `--dry-run`) |
| `harness doctor [dir]` | 적용한 프로젝트 검사 — 채우지 않은 `{{...}}`, 설정에 없는 `{설정:...}` 참조, 중복 키, 깨진 frontmatter, hook 스크립트 누락·실행 권한 |
| `harness lint [dir]` | 보일러플레이트 원본 검사 — 스킬 참조가 템플릿과 맞는지, 프리셋이 가리키는 파일이 있는지. 이 저장소 CI가 실행해요 |

`--json`으로 기계가 읽을 수 있는 결과를, `--strict`로 경고도 실패로 처리해요. 종료 코드는 0 통과, 1 실패, 2 사용법 오류예요.

설정 절에서 `리뷰어` 행을 지우고 `{{DEV_PORT}}`를 채우지 않은 채 프리셋도 적용하지 않은 프로젝트예요.

```
$ harness doctor
.claude/skills/code-review-rules/stack  warning  스택 규칙이 없다. 리뷰가 스택별 체크를 건너뛴다  [stack-rules]
.claude/skills/github-pr/SKILL.md:90  error    {설정:리뷰어}를 찾을 수 없다 (CLAUDE.md: 키·소절 [리뷰어] 없음)  [setting-ref]
.claude/skills/github-pr/SKILL.md:96  error    {설정:리뷰어}를 찾을 수 없다 (CLAUDE.md: 키·소절 [리뷰어] 없음)  [setting-ref]
.claude/skills/ui-verify/method.md  warning  UI 검증 방법이 없다. /setup-harness가 프리셋의 method.md를 복사한다  [ui-verify-method]
CLAUDE.md:31  error    {{DEV_PORT}}가 채워지지 않았다. /setup-harness를 다시 실행하거나 값을 직접 적는다  [placeholder]
3 error(s), 2 warning(s)
```

검사 목록과 각 검사가 **무엇을 잡고, 왜 문제이고, 어떻게 고치는지**는 [CLI 레퍼런스](docs/cli.md)에 있어요.

### 왜 하네스에 검사기가 필요한가

하네스는 LLM이 읽는 마크다운 지시문이라 깨져도 에러가 나지 않아요. 스킬이 존재하지 않는 설정 키를 참조하면 LLM은 **조용히 값을 추측해요.**

`harness lint`를 처음 이 저장소에 돌렸을 때 실제로 이런 결함 3개가 나왔어요.

| 위치 | 결함 | 결과 |
|---|---|---|
| RN 프리셋 `method.md` | `{설정:앱 ID}`·`{설정:앱 스킴}`을 참조하는데 템플릿에는 `앱 ID / 스킴` 한 행뿐 | 시뮬레이터 재실행 명령의 앱 ID를 추측 |
| `test-strategy` | `{설정:아키텍처 → mocks 위치}`인데 템플릿 행은 `mocks (MSW)` | MSW handler 위치를 추측 |
| 템플릿 | `테스트` 키가 `명령`·`외부 소스` 두 소절에 모두 있음 | `verify`는 명령으로, `test-strategy`는 도구 목록으로 읽어 같은 참조가 다른 뜻이 됨 |

세 결함을 모두 고쳤고, 이제 CI가 같은 종류의 결함이 다시 들어오지 못하게 막아요.

## 작업 흐름

```
입력 수집 → 분석(명세 분해·이어진 기능·검증 레벨 제안)
  → 🛑 체크포인트 1 (해석·범위·재사용할 것·검증 레벨 확정·이슈 초안)
  → 이슈·브랜치 → 기준선 측정 → 구현(항목마다 이슈 체크박스 갱신)
  → 검증(레벨별 증거 수집·판정) → 리뷰
  → 🛑 체크포인트 2 (검증 보고서·리뷰 처리·커밋 초안)
  → 커밋·PR(캡처 첨부)
```

체크포인트 밖에서도 **결정이 필요하면 멈추고 물어봐요.**

## 설계 원칙

**규칙은 한 곳에만 둬요.** 프로젝트 값은 `CLAUDE.md` 설정 절, 스택 규칙은 `stack/`, 흐름은 `feature.md`에 있어요. 스킬은 `{설정:항목}`으로 참조만 하고, 그 참조가 실제로 풀리는지는 `harness lint`·`doctor`가 확인해요.

**스킬은 필요할 때만 로드해요.** 리뷰 규칙·검증 방법은 해당 단계에서만 읽어요.

**우선순위를 명시해요.** 사용자 지시 > 팀 룰 > 플러그인·외부 스킬 > 기본 동작. 충돌하면 어느 쪽을 따랐는지 밝혀요.

**스스로 결정하지 않아요.** 명세에 없는 동작, 기존 화면 변경, 새 에셋·라이브러리, 범위 밖 수정, 서버 값 추정은 개발자가 정해요. AI는 선택지와 결과, 권장안과 근거까지만 내요.

**작업 상태를 외부화해요.** 진행 상황은 이슈 체크박스, 결정은 이슈 코멘트에 남겨요. 세션이 끊겨도 이슈만 보면 이어갈 수 있어요.

**컨텍스트를 아껴요.** 파일명·함수로 좁혀 필요한 구간만 읽고, 같은 파일을 두 번 넣지 않아요. 넓은 탐색은 Explore 에이전트에 맡기고 결론만 받아요.

**검증은 위험도로 정하고, 증거로 판정해요.**

| 레벨 | 대상 | 필요한 증거 |
|---|---|---|
| L0 정적 | 문구, 스타일 상수, 에셋 교체 | 타입·린트 기준선 대비 + 바뀐 지점 전/후 캡처 |
| L1 컴포넌트 | 한 컴포넌트의 UI·로직 | + 통합 테스트(성공·실패) + 상태별 캡처 |
| L2 화면·공용 | 화면 흐름, 공용 컴포넌트·store·API 계층 | + 진입→이탈 시나리오 + 이어진 기능 회귀 |
| L3 전역·고위험 | 라우팅·인증·결제·데이터 삭제·빌드·네이티브 | + E2E + 실서버·실기기 + 되돌리는 방법 |

- 변경의 크기가 아니라 영향 범위와 위험도로 정해요. 결제·인증·개인정보를 건드리거나 사용처가 3곳 이상이면 한 단계 올려요
- 레벨은 AI가 제안하고 개발자가 확정해요
- 코드를 고치기 전에 기준선(타입에러 수, 기존 실패 테스트, 변경 전 화면)을 재요
- 증거가 없으면 통과가 아니라 미검증이에요. 실패는 **실패**(매번 재현)·**불안정**(결과가 달라짐)·**검증 불가**(환경 문제)로 먼저 분류해요
- 같은 원인으로 두 번 고쳐도 결과가 달라지지 않으면 멈추고 보고해요

**실패를 통과로 처리하지 않아요.**

## 테스트 전략

통합 테스트 중심의 테스팅 트로피를 따라요. 단위 테스트는 순수 로직에만 써요.

| 층 | 웹 | React Native |
|---|---|---|
| UI 상태 | Storybook | (선택) Storybook RN |
| 통합·단위 | Jest(Next)/Vitest(Vite) + Testing Library | Jest + RNTL |
| E2E | Playwright (CI, 공식 Docker 이미지) | Maestro |
| 모킹 | MSW | MSW (`msw/native`) |

좋은 테스트의 기준은 **핵심 기능이 성공하는가, 실패하면 어떤 명세 항목인지 추적되는가, 다른 테스트와 독립적인가**예요. 자세한 내용은 [`test-strategy`](.claude/skills/test-strategy/SKILL.md)에 있어요.

## 구조

```
.claude/                      프로젝트에 복사되는 하네스
├── commands/
│   ├── feature.md            작업 흐름 (체크포인트 2회, 의사결정, 컨텍스트 규칙, 중단 조건)
│   └── setup-harness.md      스택·아키텍처 감지 → 설정안 승인 → 프리셋 적용 → doctor
├── skills/
│   ├── spec-crosscheck/      명세 ↔ 구현 대조표
│   ├── code-review-rules/    기계적 검증 → 공통 → 고유 → 스택 → 테스트 → 4원칙
│   ├── verify/               검증 레벨(L0~L3)·증거·판정·보고서
│   ├── test-strategy/        테스팅 트로피, 레벨별 테스트, MSW 모킹
│   ├── ui-verify/            레벨별 캡처 원칙 (+ setup이 복사하는 method.md)
│   └── github-pr/            승인 후 커밋, 캡처 업로드, PR
├── hooks/limit-large-read.sh
└── settings.json
templates/CLAUDE.harness.md   CLAUDE.md에 들어갈 "하네스 설정" 절 (모든 {설정:...}의 기준)
presets/                      스택별 규칙·UI 검증 방법·scaffold
├── shared/                   TypeScript·React Query 규칙, MSW scaffold
├── android-native/           Compose·AAOS 규칙, adb 검증, CI(Gradle)
├── react-native-expo/        RN 규칙, Maestro 검증, CI(JS 검증)
└── web-react-next/           React·Next 규칙, Storybook·Playwright 검증, CI(Docker), compose
src/                          harness CLI (TypeScript, 런타임 의존성 없음)
├── commands/                 init, doctor·lint
├── checks/                   검사별 모듈
└── lib/                      마크다운·settings.json 파서, 진단 형식
test/                         Vitest — CLI·검사·hook 스크립트
docs/cli.md                   CLI 레퍼런스
```

## 확장

- **사고가 나면** `CLAUDE.md`의 "고유 규칙"에 한 줄 추가해요. 스택 공통이면 `stack/` 파일에 사례와 함께 추가해요
- **새 프로젝트 값**은 `templates/CLAUDE.harness.md`에 행을 추가하고 `{설정:이름}`으로 참조해요. `harness lint`가 참조와 템플릿이 맞는지 확인해요
- **새 스택 프리셋**은 `presets/<이름>/`에 `preset.md`(감지 조건·복사할 파일·테스트 조합), `stack/`, `method.md`를 만들어요

개발 방법은 [CONTRIBUTING.md](CONTRIBUTING.md)에 있어요.

## 요구 사항

- Claude Code
- Node.js `>=22.12` (CLI)
- GitHub CLI (`gh`) 로그인
- `jq` (hook에서 사용)
- 디자인 시안을 읽으려면 Figma MCP (선택)

## 라이선스

[MIT](LICENSE)
