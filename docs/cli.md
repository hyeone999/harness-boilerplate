# CLI 레퍼런스

`harness`는 하네스를 프로젝트에 설치하고, 하네스 문서들이 서로 맞물려 있는지 검사한다.

하네스는 마크다운으로 된 지시문이라 깨져도 에러가 나지 않는다. 스킬이 없는 설정 키를 참조하면 LLM은 값을 추측하고, frontmatter가 깨지면 스킬이 조용히 로드되지 않고, hook 스크립트에 실행 권한이 없으면 차단이 조용히 꺼진다. `harness`는 이런 실패를 실행 전에 정적으로 잡는다.

```bash
git clone https://github.com/hyeone999/harness-boilerplate.git ~/harness-boilerplate
cd ~/harness-boilerplate && npm ci && npm link   # npm ci가 prepare로 빌드한다

harness <명령> [dir] [옵션]
```

`npm link` 없이 `node ~/harness-boilerplate/dist/cli.js <명령>`으로도 실행할 수 있다. `/setup-harness`가 보일러플레이트의 `presets/`·`templates/`를 읽으므로 원본은 지우지 않는다.

## 명령

### `harness init [dir]`

`.claude/commands`, `.claude/skills`, `.claude/hooks`를 `dir`(기본: 현재 디렉터리)에 복사하고 `.claude/settings.json`을 합친다.

- 같은 내용의 파일은 건너뛴다. 여러 번 실행해도 결과가 같다
- **내용이 다른 기존 파일이 하나라도 있으면 아무것도 쓰지 않는다.** 팀이 고친 스킬을 모르고 덮어쓰지 않게 한다. 차이를 확인한 뒤 `--force`로 덮어쓴다
- `settings.json`은 덮어쓰지 않고 합친다
  - `permissions.allow`: 기존 순서를 유지하고 없는 규칙만 뒤에 붙인다
  - `hooks`: `command` 문자열이 같은 hook이 이미 있으면 넣지 않는다. 같은 이벤트에 다른 hook이 있으면 그 뒤에 붙인다
  - 그 밖의 키(`model`, `env` 등)는 건드리지 않는다
  - 기존 파일이 JSON이 아니거나 `hooks` 형식이 틀리면 합치지 않고 멈춘다
- hook 스크립트의 실행 권한을 유지한다

| 옵션 | 동작 |
|---|---|
| `--dry-run` | 추가·덮어씀·충돌·병합할 파일만 보여준다 |
| `--force` | 내용이 다른 기존 파일을 덮어쓴다 |

설치가 끝나면 Claude Code에서 `/setup-harness`로 프로젝트 값을 채운다.

### `harness doctor [dir]`

하네스를 적용한 프로젝트를 검사한다. `/setup-harness` 직후, 그리고 하네스 파일을 고친 뒤에 실행한다.

`CLAUDE.md`의 `## 하네스 설정` 절을 기준으로 아래 검사 중 `harness-section`, `placeholder`, `empty-value`, `duplicate-key`, `setting-ref`(`.claude/` 아래), `frontmatter`, `hook`, `ui-verify-method`, `stack-rules`를 실행한다.

### `harness lint [dir]`

보일러플레이트 원본을 검사한다. 이 저장소의 CI가 실행한다.

`templates/CLAUDE.harness.md`를 기준으로 `duplicate-key`, `setting-ref`(`.claude/`와 `presets/` 아래), `frontmatter`, `hook`, `preset-source`를 실행한다. 템플릿의 `{{...}}`는 원래 비어 있어야 하므로 `placeholder`는 보지 않는다.

### 공통 옵션

| 옵션 | 동작 |
|---|---|
| `--json` | `{ diagnostics, summary }`를 JSON으로 출력한다. 에이전트나 다른 도구가 읽을 때 쓴다 |
| `--strict` | 경고도 실패로 친다 |
| `-h`, `--help` | 도움말 |
| `-v`, `--version` | 버전 |

### 종료 코드

| 코드 | 뜻 |
|---|---|
| 0 | 통과 (경고만 있으면 `--strict`가 아닐 때 통과) |
| 1 | 검사 오류가 있거나, `init`이 충돌·깨진 설정으로 멈췄다 |
| 2 | 알 수 없는 명령·옵션, 인자 과다 |

### 출력 형식

```
.claude/skills/test-strategy/SKILL.md:84  error    {설정:아키텍처 → mocks 위치}를 찾을 수 없다 (templates/CLAUDE.harness.md: 소절 [아키텍처]에 키 [mocks 위치] 없음)  [setting-ref]
1 error(s), 0 warning(s)
```

`파일:줄  심각도  메시지  [검사 ID]`. 파일 → 줄 순으로 정렬한다.

## 검사

### 설정 참조 규칙

스킬과 커맨드는 프로젝트 값을 직접 적지 않고 `{설정:이름}`으로 참조한다. 값은 `CLAUDE.md`의 `## 하네스 설정` 절 한 곳에만 있다.

| 표기 | 찾는 곳 |
|---|---|
| `{설정:기본 브랜치}` | 어느 소절이든 표 첫 칸이 `기본 브랜치`인 행, 또는 `### 기본 브랜치` 소절 |
| `{설정:아키텍처 → 아이콘}` | `### 아키텍처` 소절 안에서 첫 칸이 `아이콘`인 행 |
| `{설정:항목}`, `{설정:...}` | 표기법을 설명하는 예시라 검사하지 않는다 |

표의 머리글 행(바로 다음 줄이 `|---|`인 행)과 코드 블록 안의 내용은 설정으로 보지 않는다. 셀 안의 `|`는 `\|`로 쓴다.

### 검사 목록

| ID | 심각도 | 잡는 것 | 왜 문제인가 | 고치는 법 |
|---|---|---|---|---|
| `harness-section` | error | `## 하네스 설정` 절이 없다 | 모든 `{설정:...}`이 풀리지 않는다 | `/setup-harness` 실행 |
| `placeholder` | error | 설정 절에 `{{NAME}}`이 남았다 | LLM이 `{{BASE_BRANCH}}`를 브랜치 이름으로 쓰거나 값을 추측한다 | 값을 채운다. 해당 없으면 "없음" |
| `empty-value` | warning | 표의 값 칸이 비었다 | 빈 값과 "해당 없음"을 구분할 수 없다 | "없음"으로 적는다 |
| `duplicate-key` | error | 같은 키가 두 소절에 있다 | `{설정:키}`가 어느 값인지 정할 수 없다 | 키 이름을 나누거나 `소절 → 키`로 참조한다 |
| `setting-ref` | error | `{설정:...}`이 설정 절에서 찾아지지 않는다 | 스킬이 존재하지 않는 값을 근거로 동작한다 | 템플릿에 행을 추가하거나 참조 이름을 고친다 |
| `frontmatter` | error | 스킬에 `SKILL.md`·frontmatter·`description`이 없거나 `name`이 디렉터리 이름과 다르다. 커맨드에 `description`이 없다 | 스킬이 로드되지 않거나 호출 시점을 판단할 수 없다 | frontmatter를 고친다 |
| `frontmatter` | warning | `description`이 1024자를 넘는다 | 잘린 부분은 호출 판단에 쓰이지 않는다 | 줄인다 |
| `hook` | error | `settings.json`이 JSON이 아니거나 `hooks` 형식이 틀리다. `$CLAUDE_PROJECT_DIR/...`로 가리킨 스크립트가 없거나 실행 권한이 없다 | hook이 조용히 동작하지 않는다 | JSON을 고치고 `chmod +x` |
| `preset-source` | error | `preset.md`의 "복사할 파일" 표가 가리키는 원본이 없다 (`lint`만) | `/setup-harness`가 중간에 실패한다 | 경로를 고치거나 파일을 추가한다 |
| `ui-verify-method` | warning | `.claude/skills/ui-verify/method.md`가 없다 (`doctor`만) | UI 검증 단계가 멈춘다 | `/setup-harness`로 프리셋을 적용한다 |
| `stack-rules` | warning | `code-review-rules/stack/`에 규칙이 없다 (`doctor`만) | 리뷰가 스택별 체크를 건너뛴다 | `/setup-harness`로 프리셋을 적용한다 |

### 한계

- frontmatter는 한 줄짜리 `key: value`만 읽는다. 여러 줄 YAML(`description: |`)은 지원하지 않는다
- `preset-source`의 와일드카드는 파일 이름 부분의 `*`만 지원한다
- 참조가 **올바른 값**을 가리키는지는 보지 않는다. 키가 있는지만 본다
