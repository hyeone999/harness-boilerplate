# React (웹) 체크 항목

## setState 업데이터는 순수해야 한다

업데이터 안에서 부수효과(저장소 쓰기, 요청)를 하거나 외부 변수에 대입하지 않는다. Strict Mode에서는 업데이터가 두 번 호출돼 부수효과도 두 번 일어난다.

## useEffect는 동기화에만 쓴다

- 이벤트 처리(버튼 클릭 후 요청)는 핸들러에서 한다. "상태가 바뀌면 요청"을 effect로 엮으면 원인 추적이 어렵다
- props·state에서 계산할 수 있는 값은 effect로 state에 복사하지 않고 렌더 중에 계산한다
- 구독·타이머·리스너는 cleanup을 반환한다. Strict Mode에서 마운트가 두 번 일어나면 누수가 드러난다
- 의존성 배열을 lint 경고 때문에 비우지 않는다. 의도적으로 1회만 실행할 때는 이유를 주석으로 남긴다

## 리스트 key

배열 index를 key로 쓰지 않는다. 항목이 추가·삭제·정렬되면 입력값과 상태가 다른 항목에 붙는다. 서버 id를 쓴다.

## 접근성

- 클릭 가능한 요소는 `<button>`·`<a>`를 쓴다. `div onClick`은 키보드로 조작할 수 없다
- 아이콘만 있는 버튼에는 `aria-label`
- 폼 입력에는 `<label>` 연결. 테스트도 `getByLabelText`로 찾을 수 있어야 한다

접근성을 지키면 Testing Library·Playwright가 역할로 요소를 찾을 수 있어 테스트가 구현에 덜 묶인다.

## 외부 링크·새 창

`target="_blank"`에는 `rel="noopener noreferrer"`.

## 이미지·아이콘

- 색만 다른 SVG를 여러 개 만들지 않는다. `currentColor`로 두고 CSS `color`로 바꾼다
- 배경·dim은 SVG에 넣지 않고 CSS로 처리한다
- 레이아웃 시프트를 막도록 크기를 지정한다
