# 기여 안내

## 개발 환경

- Node `>=22.12` (`.nvmrc`)
- `jq` — hook 스크립트와 그 테스트가 쓴다
- `shellcheck` (선택) — CI에서 hook 스크립트를 검사한다

```bash
npm ci
npm run check   # typecheck → lint → test → build → lint:harness
```

| 스크립트 | 내용 |
|---|---|
| `npm run typecheck` | `tsc --noEmit` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| `npm run lint` | ESLint(typescript-eslint `strictTypeChecked`) + Prettier 검사 |
| `npm test` | Vitest |
| `npm run build` | `src/` → `dist/` |
| `npm run lint:harness` | 빌드한 CLI로 이 저장소의 하네스 문서를 검사한다 |

런타임 의존성은 두지 않는다. Node 내장 모듈(`node:util`의 `parseArgs`, `node:fs`)만 쓴다.

## 하네스 문서를 고칠 때

스킬·커맨드·프리셋을 고치면 `npm run build && npm run lint:harness`를 돌린다.

- 새 프로젝트 값이 필요하면 `templates/CLAUDE.harness.md`에 행을 추가하고 `{설정:이름}`으로 참조한다. 스킬에 값을 직접 적지 않는다
- 같은 이름의 키를 두 소절에 두지 않는다 (`duplicate-key`)
- 새 스킬은 `.claude/skills/<이름>/SKILL.md`에 두고 frontmatter의 `name`을 디렉터리 이름과 같게 한다
- 사고 사례는 해당 스택 파일(`presets/*/stack/`)이나 `principles.md`에 사례와 함께 덧붙인다

## CLI를 고칠 때

- 검사를 추가하면 `src/lib/diagnostic.ts`의 `CheckId`에 ID를 추가하고, `docs/cli.md`의 검사 목록에 **잡는 것·왜 문제인가·고치는 법**을 함께 적는다
- 실패 경로 테스트를 함께 쓴다. 테스트 이름은 동작 문장으로 쓴다 (`"내용이 다른 기존 파일이 있으면 아무것도 쓰지 않는다"`)
- 파일 시스템 테스트는 `test/helpers.ts`의 `fixture()`로 임시 디렉터리를 만든다

## 커밋

`[TYPE] 평서문` 형식을 쓴다. `FEAT`, `FIX`, `DOCS`, `CHORE`, `TEST`, `REFACTOR`.

```
[FIX] 템플릿의 중복 키를 나눈다
```
