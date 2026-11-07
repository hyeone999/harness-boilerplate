# Changelog

## 0.1.0

### 추가

- `harness` CLI
  - `init`: 하네스 설치. `settings.json`을 덮어쓰지 않고 합치고, 내용이 다른 기존 파일이 있으면 아무것도 쓰지 않는다 (`--force`, `--dry-run`)
  - `doctor`: 적용한 프로젝트의 설정 정합성 검사
  - `lint`: 보일러플레이트 원본 검사
  - `--json`, `--strict`
- CI: Node 22·24 매트릭스, typecheck·lint·test·build·하네스 lint, shellcheck, 패키지 파일 목록 확인
- `docs/cli.md` CLI 레퍼런스, `CONTRIBUTING.md`, MIT 라이선스

### 수정

`harness lint`가 찾은 하네스 문서의 결함을 고쳤다.

- 템플릿의 `앱 ID / 스킴` 행을 `앱 ID`·`앱 스킴`으로 나눴다. RN 프리셋의 `{설정:앱 ID}`·`{설정:앱 스킴}`이 풀리지 않았다
- 템플릿의 `mocks (MSW)` 행을 `mocks 위치`로 바꿨다. `test-strategy`의 `{설정:아키텍처 → mocks 위치}`가 풀리지 않았다
- 템플릿 `외부 소스`의 `테스트`를 `테스트 도구`로 바꿨다. `명령`의 `테스트`와 이름이 겹쳐 `{설정:테스트}`가 명령과 도구 목록 중 무엇인지 모호했다
