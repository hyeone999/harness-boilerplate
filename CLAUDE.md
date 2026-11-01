# harness-boilerplate

Claude Code 작업 하네스(`.claude/`, `presets/`, `templates/`)와 그것을 설치·검사하는 CLI(`src/`).

## 명령

- 전체 확인: `npm run check` (typecheck → lint → test → build → lint:harness)
- 하네스 문서만: `npm run build && npm run lint:harness`
- 테스트 하나: `npx vitest run test/<파일>.test.ts -t "<테스트 이름>"`

## 규칙

- `.claude/`·`presets/`의 문서를 고치면 `lint:harness`를 돌린다. 스킬은 프로젝트 값을 직접 적지 않고 `{설정:이름}`으로 참조하며, 이름은 `templates/CLAUDE.harness.md`의 표 키·소절과 정확히 같아야 한다
- 이 저장소의 `.claude/`는 **다른 프로젝트에 복사되는 산출물**이다. 이 저장소 작업용 설정을 넣지 않는다
- 하네스 문서는 평서문(`~한다`), README는 해요체로 쓴다
- CLI는 런타임 의존성을 두지 않는다. 검사를 추가하면 `CheckId`, `docs/cli.md` 검사 목록, 실패 경로 테스트를 함께 바꾼다
- 커밋 형식: `[FEAT|FIX|DOCS|CHORE|TEST|REFACTOR] 평서문`
