# UI 검증 방법 — 웹 (Storybook + 개발 서버 + Playwright)

원칙은 `SKILL.md`를 따른다. 이 파일은 실행 방법만 다룬다.

## 1순위: Storybook 스토리 캡처

컴포넌트·화면 단위 변경은 스토리로 확인한다. 데이터는 `msw-storybook-addon`으로 스토리마다 고정한다.

```bash
lsof -ti:6006 || ({설정:패키지 매니저} storybook --ci > "$TMPDIR/storybook.log" 2>&1 &)
```

스토리가 없으면 이번 변경의 상태(기본·로딩·빈 데이터·에러)별로 스토리를 추가한다. 스토리는 산출물로 PR에 남긴다.

캡처는 Playwright로 스토리 iframe을 직접 연다.

```ts
// $TMPDIR/capture.spec.ts
import { test } from "@playwright/test";

test("capture", async ({ page }) => {
  await page.goto("http://localhost:6006/iframe.html?id=<story-id>&viewMode=story");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${process.env.TMPDIR}/<화면명>.png`, fullPage: true });
});
```

```bash
npx playwright test "$TMPDIR/capture.spec.ts" --reporter=line
```

`<story-id>`는 `title`과 export 이름을 kebab-case로 이은 값이다 (`components-button--primary`).

## 2순위: 개발 서버 + MSW

여러 화면을 잇는 흐름은 개발 서버에서 MSW를 켜고 확인한다.

```bash
lsof -ti:{설정:개발 서버 포트} || ({설정:모킹 스위치}=true {설정:패키지 매니저} dev > "$TMPDIR/dev.log" 2>&1 &)
```

같은 방식으로 Playwright 스크립트를 스크래치패드에 만들어 이동·입력·캡처한다. 요소는 `getByRole`·`getByText`로 찾는다.

## ⚠️ 최신 코드 확인

- 개발 서버 로그에 변경 파일의 재컴파일 줄이 찍혔는지 본다
- 브라우저 캐시·서비스 워커(MSW 포함)가 이전 응답을 줄 수 있다. 의심되면 새 브라우저 컨텍스트로 연다 (Playwright는 테스트마다 새 컨텍스트)
- 환경변수를 바꿨으면 개발 서버를 재시작한다

## E2E (CI)

핵심 플로우 E2E는 `e2e/` 아래 Playwright 테스트로 두고 CI에서 돌린다. 로컬 검증 스크립트(스크래치패드)와 섞지 않는다.

## 로그

```bash
tail -40 "$TMPDIR/dev.log"
```

브라우저 콘솔 에러는 Playwright에서 `page.on("console", ...)`으로 받아 확인한다.
