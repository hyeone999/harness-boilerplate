# harness-boilerplate

Claude Code로 프론트엔드 기능을 **명세 → 이슈 → 구현 → 테스트·검증 → 리뷰 → PR**까지 진행하는 작업 하네스예요.

실제 서비스(React Native 앱)를 운영하면서 사고가 날 때마다 규칙을 추가해 다듬은 하네스를, 어떤 프로젝트에도 적용할 수 있게 스택과 프로젝트 값을 분리했어요.

## 무엇을 해결하나

| 문제 | 하네스의 대응 |
|---|---|
| 명세에 있는데 코드에 없는 항목을 사람이 일일이 대조 | `spec-crosscheck` — 항목마다 코드·배선·데이터 3단계 확인 |
| AI가 애매한 지점을 혼자 정해 버림 | **의사결정 규칙** — 멈추고 선택지를 제시해 물어봐요 |
| 같은 리뷰 지적이 반복됨 | `code-review-rules` — 실제 사고 사례 기반 체크리스트 |
| 긴 세션에서 앞의 결정을 잃음 | 작업 상태를 GitHub 이슈 체크박스에 외부화 |
| 큰 파일을 통째로 읽어 컨텍스트 낭비 | 300줄 넘는 파일 범위 없이 Read하면 hook이 차단 |
| 검증이 수동이라 생략됨 | `ui-verify` + 통합 테스트 중심 `test-strategy` |
| PR 리뷰어가 앱을 띄워야 결과를 봄 | `github-pr` — 캡처를 전용 브랜치에 올려 PR에 첨부 |

## 구조

```
.claude/
├── commands/
│   ├── feature.md          작업 흐름 (체크포인트 2회, 의사결정, 컨텍스트 규칙, 중단 조건)
│   └── setup-harness.md    스택·아키텍처 감지 → 설정안 승인 → 프리셋 적용 → (선택) scaffold
├── skills/
│   ├── spec-crosscheck/    명세 ↔ 구현 대조표
│   ├── code-review-rules/  기계적 검증 → 공통 → 고유 → 스택 → 테스트 → 4원칙
│   │   └── stack/          ← setup이 프로젝트에 맞는 규칙만 복사
│   ├── test-strategy/      테스팅 트로피, MSW 모킹
│   ├── ui-verify/          도구 무관 검증 원칙 (+ setup이 복사하는 method.md)
│   └── github-pr/          승인 후 커밋, 캡처 업로드, PR
├── hooks/limit-large-read.sh
└── settings.json
templates/CLAUDE.harness.md   CLAUDE.md에 들어갈 "하네스 설정" 절
presets/
├── shared/                 TypeScript·React Query 규칙, MSW scaffold
├── react-native-expo/      RN 규칙, Maestro 검증, CI(JS 검증)
└── web-react-next/         React·Next 규칙, Storybook·Playwright 검증, CI(Docker), compose
```

## 적용

### 1. 하네스 복사

```bash
# 대상 프로젝트 루트에서
git clone https://github.com/hyeone999/harness-boilerplate.git ~/harness-boilerplate
cp -R ~/harness-boilerplate/.claude ./
```

이미 `.claude/`가 있으면 덮어쓰지 말고 `commands/`, `skills/`, `hooks/`만 옮긴 뒤 `settings.json`의 `hooks`·`permissions`를 합쳐 주세요.

### 2. 프로젝트에 맞추기

Claude Code에서:

```
/setup-harness  (보일러플레이트 경로: ~/harness-boilerplate)
```

1. `package.json`·폴더 구조·git 이력에서 스택, 라우팅, 상태 관리, 명령, 커밋 형식, **아키텍처(어느 폴더가 무슨 역할인지)**를 감지해요
2. 설정안을 보여주고 승인을 받아요. 감지하지 못한 값은 물어봐요
3. `CLAUDE.md`에 "하네스 설정" 절을 추가하고, 맞는 스택 규칙과 검증 방법만 복사해요
4. 새 프로젝트면 테스트·Docker·CI scaffold를 선택적으로 만들어요

### 3. 사용

```
/feature  <기능명세서>  <디자인 링크>
```

## 작업 흐름

```
입력 수집 → 분석(명세 분해·이어진 기능·기준선)
  → 🛑 체크포인트 1 (해석·범위·재사용할 것·이슈 초안)
  → 이슈·브랜치 → 구현(항목마다 이슈 체크박스 갱신)
  → 검증(타입 기준선·린트·통합 테스트·UI·명세 대조표) → 리뷰
  → 🛑 체크포인트 2 (결과·리뷰 처리·커밋 초안)
  → 커밋·PR(캡처 첨부)
```

체크포인트 밖에서도 **결정이 필요하면 멈추고 물어봐요.**

## 설계 원칙

**규칙은 한 곳에만 둬요.** 프로젝트 값은 `CLAUDE.md` 설정 절, 스택 규칙은 `stack/`, 흐름은 `feature.md`에 있어요. 스킬은 `{설정:항목}`으로 참조만 해요. CLAUDE.md는 항상 컨텍스트에 있으니 설정을 읽으려고 파일을 따로 열 필요가 없어요.

**스킬은 필요할 때만 로드해요.** 리뷰 규칙·검증 방법은 해당 단계에서만 읽어요.

**우선순위를 명시해요.** 사용자 지시 > 팀 룰 > 플러그인·외부 스킬 > 기본 동작. 플러그인은 일반적인 상황을 가정하고, 팀 룰은 이 코드베이스의 사정을 반영해요. 충돌하면 어느 쪽을 따랐는지 밝혀요.

**스스로 결정하지 않아요.** 명세에 없는 동작, 기존 화면 변경, 새 에셋·라이브러리, 범위 밖 수정, 서버 값 추정은 개발자가 정해요. AI는 선택지와 결과, 권장안과 근거까지만 내요.

**작업 상태를 외부화해요.** 진행 상황은 이슈 체크박스, 결정은 이슈 코멘트에 남겨요. 세션이 끊겨도 이슈만 보면 이어갈 수 있어요.

**컨텍스트를 아껴요.** 파일명·함수로 좁혀 필요한 구간만 읽고, 같은 파일을 두 번 넣지 않아요. 넓은 탐색은 Explore 에이전트에 맡기고 결론만 받아요. 에이전트 병렬은 독립 작업에만 써요.

**검증 비용을 변경 크기에 맞춰요.** 에셋 교체는 스크린샷 한 장이면 돼요. 같은 검증이 3번 실패하면 멈추고 보고해요.

**실패를 통과로 처리하지 않아요.**

## 테스트 전략

통합 테스트 중심의 테스팅 트로피를 따라요. 단위 테스트는 순수 로직에만 써요.

| 층 | 웹 | React Native |
|---|---|---|
| UI 상태 | Storybook | (선택) Storybook RN |
| 통합·단위 | Jest(Next)/Vitest(Vite) + Testing Library | Jest + RNTL |
| E2E | Playwright (CI, 공식 Docker 이미지) | Maestro |
| 모킹 | MSW | MSW (`msw/native`) |

좋은 테스트의 기준은 **핵심 기능이 성공하는가, 실패하면 어떤 명세 항목인지 추적되는가, 다른 테스트와 독립적인가**예요. 백엔드가 붙기 전에는 MSW로 모킹하고, 같은 handler를 개발 서버·Storybook·테스트에서 함께 써요. 자세한 내용은 `.claude/skills/test-strategy/SKILL.md`에 있어요.

## 환경 (새 프로젝트 scaffold)

- 로컬: 앱은 로컬 실행, Node 버전은 `.nvmrc`로 고정. DB·스토리지 같은 의존 서비스만 `docker-compose`
- CI: 모든 잡을 고정 Docker 이미지에서 실행해 로컬과 버전을 맞춤. 타입체크·린트·테스트는 모든 PR, Storybook 빌드 확인, E2E는 Playwright 이미지로

## 확장

- **사고가 나면** `CLAUDE.md`의 "고유 규칙"에 한 줄 추가해요. 스택 공통이면 `stack/` 파일에 사례와 함께 추가해요
- **새 스택 프리셋**은 `presets/<이름>/`에 `preset.md`(감지 조건·복사할 파일·테스트 조합), `stack/`, `method.md`를 만들어요

## 요구 사항

- Claude Code
- GitHub CLI (`gh`) 로그인
- `jq` (hook·setup에서 사용)
- 디자인 시안을 읽으려면 Figma MCP (선택)
