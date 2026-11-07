---
description: 하네스를 이 프로젝트에 맞게 설정한다. 스택·아키텍처를 감지해 설정안을 만들고, 승인을 받은 뒤 CLAUDE.md 설정 절과 프리셋을 적용한다. 새 프로젝트면 테스트·Docker·CI scaffold도 선택적으로 만든다.
---

# /setup-harness

하네스 파일(`.claude/`)은 `harness init`으로 이미 프로젝트에 복사돼 있고, 보일러플레이트 원본의 `presets/`·`templates/` 경로를 알고 있어야 한다. 원본 경로는 `harness init`이 마지막에 출력한다. 모르면 사용자에게 묻는다.

**감지한 값은 전부 제안일 뿐이다.** 하나라도 확정하기 전에 사용자에게 보여주고 승인받는다 (의사결정 규칙).

## 1. 감지

파일 전체를 읽지 않는다. 필요한 키만 뽑는다.

```bash
# 스택·스크립트
jq '{deps: ((.dependencies // {}) + (.devDependencies // {}) | keys), scripts}' package.json

# 패키지 매니저
ls yarn.lock pnpm-lock.yaml package-lock.json bun.lockb 2>/dev/null

# Node 버전
cat .nvmrc .node-version 2>/dev/null; jq -r '.engines.node // empty' package.json

# Android (package.json이 없을 때)
ls settings.gradle* build.gradle* app/build.gradle* 2>/dev/null

# 브랜치
git remote show origin 2>/dev/null | grep "HEAD branch"; git branch -r | head -20

# 구조 (2단계까지)
find . -maxdepth 3 -type d \( -name node_modules -o -name .git -o -name ios -o -name android -o -name .next -o -name dist \) -prune -o -type d -print | head -80
```

감지할 것:

| 항목 | 단서 |
|---|---|
| 프리셋 | `presets/*/preset.md`의 감지 조건 |
| 라우팅 | `expo-router`·`@react-navigation/*`·Next `app/`·`pages/`·`react-router` |
| 상태 관리 | `zustand`·`@reduxjs/toolkit`·`jotai`·`recoil` → 스토어 위치 |
| 데이터 패칭 | `@tanstack/react-query`·`swr`·axios 인스턴스 위치 |
| 테스트 | `jest`·`vitest`·`@testing-library/*`·`@playwright/test`·`storybook`·`msw`·`.maestro/` |
| 명령 | `scripts`의 `typecheck`·`lint`·`test`·`dev` |
| 커밋 형식 | `git log --oneline -20`에서 패턴 (`[FEAT]`, `feat:` 등) |
| 아키텍처 | 폴더 이름과 대표 파일 몇 개 (`grep -rl "create(" --include=store*`, `api` 접두사 파일) |
| API 스키마 | `openapi*.{json,yaml}`, 스웨거 URL(`.env*`의 API 주소로 추정), 생성 타입 폴더 |

폴더 역할이 이름만으로 애매하면 대표 파일 1~2개의 앞부분만 읽고 판단한다. 그래도 애매하면 비워 두고 묻는다.

## 2. 🛑 설정안 제시

다음을 한 번에 보여주고 승인받는다. 비어 있는 값은 질문으로 바꾼다.

- 선택한 프리셋과 그 근거 (감지된 의존성)
- `templates/CLAUDE.harness.md`를 채운 설정 절 미리보기
  - 아키텍처 표는 **이 프로젝트의 실제 경로**로 채운다. 프리셋 기본값을 그대로 쓰지 않는다
- 복사할 스택 규칙 파일 목록 (`preset.md`의 표)
- 문서 동기화·고유 규칙 — 감지할 수 없으므로 사용자에게 묻는다. 없으면 비워 둔다
- 리뷰어 — 본인 계정이면 GitHub이 무시한다고 알린다

## 3. 적용

승인받은 내용만 적용한다.

1. `CLAUDE.md`에 설정 절을 추가한다. 이미 있으면 기존 내용과의 차이를 보여주고 덮어쓸지 묻는다. CLAUDE.md의 다른 내용은 건드리지 않는다
2. 스택 규칙을 `.claude/skills/code-review-rules/stack/`에 복사한다
3. 프리셋의 `method.md`를 `.claude/skills/ui-verify/method.md`로 복사한다
4. 타입체크·린트·테스트 명령을 `.claude/settings.json`의 `permissions.allow`에 추가할지 묻는다

복사한 규칙 파일에 프로젝트와 맞지 않는 항목(쓰지 않는 라이브러리 이야기 등)이 있으면 지울지 묻는다.

## 4. scaffold (선택)

**기존 프로젝트에는 제안만 하고 강제하지 않는다.** 새 프로젝트이거나 사용자가 원할 때만 진행한다.

프리셋 `preset.md`의 scaffold 표를 보여주고, 만들 항목을 고르게 한다.

- 테스트 도구·Storybook·Playwright는 **공식 init 명령으로 설치한다.** 설정 파일을 직접 쓰지 않는다
- `ci.yml`·`docker-compose.yml`·`mocks/`는 템플릿을 복사하고 `{{...}}` 자리를 설정 값으로 채운다. GitHub Actions 표현식 `${{ ... }}`은 건드리지 않는다
- Node 버전은 `.nvmrc`와 CI 컨테이너 태그를 같게 맞춘다. Playwright 이미지 태그는 설치된 `@playwright/test` 버전과 같게 맞춘다
- MSW는 `npx msw init <public 디렉터리>`로 서비스 워커를 만든다 (웹)
- 모킹 스위치 환경변수를 `.env.example`에 추가한다

## 5. 확인

- `harness doctor`를 실행한다 (`harness`가 PATH에 없으면 `node <보일러플레이트 경로>/dist/cli.js doctor`). 채우지 않은 `{{...}}`, 설정에 없는 `{설정:...}` 참조, 깨진 frontmatter·settings.json, hook 실행 권한을 잡는다. 오류가 0이 될 때까지 고친다
- hook이 동작하는지 300줄 넘는 파일 하나를 범위 없이 Read해 막히는지 확인한다 (hook은 세션 재시작 후 적용될 수 있다)
- 타입체크·린트·테스트 명령을 한 번씩 돌려 기준선을 기록한다

적용한 내용과 사용자에게 남은 일(예: CI 시크릿, 리뷰어 초대)을 요약해 보고한다.
