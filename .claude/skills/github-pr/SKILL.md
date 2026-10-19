---
name: github-pr
description: 변경사항을 작업 단위로 커밋하고 화면 캡처를 첨부해 PR까지 만들 때 사용. 의도 확인 → 커밋 전 리뷰 → 승인 후 커밋 → 캡처 업로드 → PR 생성을 처리한다. "커밋하고 PR 올려줘", "PR에 스크린샷 첨부" 요청 시 호출.
---

# 커밋 정리 + PR 스크린샷 첨부

변경사항을 작업 단위로 나눠 커밋하고, 화면 캡처를 `pr-screenshots` 브랜치에 올린 뒤, 그 이미지 링크를 넣어 PR을 만든다. **커밋은 사용자 승인 후에만 하고**, 나머지는 PR까지 이어서 진행한다.

이미 파일로 있는 이미지(디자인 시안 등)를 첨부할 때는 캡처 단계만 건너뛴다.

⚠️ `gh gist create`는 바이너리 파일을 거부한다. gist로 우회하지 않는다.

## 1. 커밋

```bash
git status --short
git diff --stat
```

**커밋은 AI가 임의로 하지 않는다.** 커밋 메시지의 "왜"는 사람의 의도라 AI가 추측해서 쓰지 않는다.

1. **의도 묻기** — 이번 변경을 왜 했는지 한 줄로 먼저 묻는다. `/feature` 체크포인트 2에서 이미 승인받았다면 생략한다
2. **커밋 전 리뷰** — `code-review-rules`로 리뷰한다. 지적이 있으면 고치고 다시 리뷰한다
3. **초안 제시** — 변경 파일을 관심사 단위로 묶는다. 화면·컴포넌트·유틸처럼 성격이 다른 변경을 한 커밋에 섞지 않는다. `.claude/` 아래 하네스 변경은 지금 작업과 무관하면 별도로 묶거나 제외한다. 커밋별 파일 목록과 메시지 초안(`{설정:커밋 형식}`)을 보여준다
4. **승인 후 커밋** — 승인하거나 고친 내용대로만 커밋한다

```bash
git add <파일...>
git commit -m "<메시지>"
git push -u origin <브랜치명>
```

## 2. 화면 캡처

**어떤 화면을 캡처할지 먼저 사용자에게 묻는다.** diff로 짐작되는 화면이 있어도 임의로 정하지 않는다.

`ui-verify` 스킬의 `method.md` 절차로 찍는다. 최신 코드 확인을 건너뛰지 않는다.

- 화면이 길어도 구간별로 여러 장 찍지 않는다. **diff와 관련된 구간까지만 스크롤해서 한 장**만 찍는다. 화면 전체를 보여주는 게 아니라 "이 변경이 화면에서 이렇게 보인다"를 보여주는 용도다
- 권한·서버 응답에 따라 분기되는 화면은 시스템 설정이나 서버 데이터를 조작하지 않는다. MSW handler를 바꾸거나 분기 조건을 임시로 고쳐 띄운 뒤 찍고, **반드시 원래대로 복구한다**
- 캡처를 위해 추가한 `testID`는 기록해 두고 6단계에서 제거한다

찍은 이미지는 Read로 열어 화면이 맞는지 먼저 확인한다. 잘못된 화면을 올리지 않는다.

## 3. 전용 브랜치에 이미지 업로드

코드 이력 없이 이미지만 담는 브랜치를 쓴다. 없으면 orphan으로 만든다.

```bash
WT="$TMPDIR/pr-screenshots-wt"
git fetch origin pr-screenshots 2>/dev/null
git worktree add "$WT" pr-screenshots 2>/dev/null \
  || git worktree add --orphan -b pr-screenshots "$WT"

DEST="<브랜치명>-<화면명>.png"   # 브랜치별로 이름을 나눠 덮어쓰지 않는다
cp "<screenshot>.png" "$WT/$DEST"
git -C "$WT" add "$DEST"
git -C "$WT" commit -q -m "docs: $DEST 스크린샷 추가"
git -C "$WT" push -q origin pr-screenshots
git worktree remove "$WT"
```

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
if [ "$(gh repo view --json visibility -q .visibility)" = "PRIVATE" ]; then
  IMG_URL="https://github.com/${REPO}/blob/pr-screenshots/${DEST}?raw=true"
else
  IMG_URL="https://raw.githubusercontent.com/${REPO}/pr-screenshots/${DEST}"
fi
```

⚠️ **private 저장소는 `raw.githubusercontent.com` 링크가 PR에서 깨진다.** 그 도메인은 세션 쿠키를 받지 않아 404가 난다. 반드시 `github.com/<REPO>/blob/pr-screenshots/<파일>?raw=true` 형식을 쓴다.

## 4. PR 생성

이미지는 원본 해상도로 올라가 PR에서 지나치게 크게 보인다. 마크다운 `![]()`는 크기를 못 바꾸므로 `<img width="...">`를 쓴다 (모바일 375, 웹은 800 정도).

```markdown
## 화면
| 화면 | 캡처 |
|---|---|
| <화면명> | <img src="<IMG_URL>" width="375"> |
```

PR 제목은 커밋과 같은 `{설정:커밋 형식}`을 따른다.

```bash
gh pr create --base {설정:기본 브랜치} --title "<제목>" --body-file <파일> \
  --assignee @me --reviewer {설정:리뷰어}
```

이미 있는 PR이면 수정한다.

```bash
gh pr edit <N> --body-file <파일> --add-assignee @me --add-reviewer {설정:리뷰어}
```

⚠️ 본인은 자기 PR의 리뷰어로 지정되지 않는다 (GitHub이 조용히 무시한다). 리뷰어 설정이 본인 계정이면 사용자에게 알린다.

## 5. 머지

머지는 사용자가 지시할 때만 한다. 리뷰가 필요한 PR을 임의로 머지하지 않는다.

## 6. 정리

캡처를 위해 이번 작업에서 추가한 `testID`만 제거한다. 원래 있던 `testID`는 건드리지 않는다.

```bash
git diff origin/{설정:기본 브랜치}...HEAD | grep -n "^+.*testID"
```

캡처를 다시 찍을 가능성이 있으면 제거를 미루고 사용자에게 확인한다.

## 실패 시

- 커밋 단위를 나누기 애매함 → 임의로 묶지 않고 사용자에게 묻는다
- 캡처가 화면에 닿지 않음 → 최신 코드 확인부터. 이후는 `verify` 4번의 판정 절차(실패·불안정·검증 불가)를 따른다
- 캡처가 로그인 화면에서 멈춤 → 세션이 풀린 것. 사용자에게 로그인을 요청한다
- push 실패 → 이미지 경로를 알리고 중단한다. 첨부 없이 PR을 만들지 않는다
- worktree가 남음 → `git worktree list`로 확인 후 정리한다
