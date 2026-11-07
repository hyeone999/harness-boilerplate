# 스택 규칙 — Kotlin · Jetpack Compose

## Compose

- 상태는 화면 위쪽으로 끌어올리고, 하위 컴포저블은 값과 콜백만 받는다
- 부수 효과는 `LaunchedEffect`·`DisposableEffect` 안에서 실행한다. 컴포지션 중에 직접 실행하지 않는다
- `LaunchedEffect`의 key가 재시작 조건과 맞는지 확인한다
- 색상·크기는 테마와 공용 컴포넌트를 쓴다. 화면에 값을 직접 적지 않는다

## 코루틴

- 수명 주기에 묶인 scope를 쓴다. `GlobalScope`를 쓰지 않는다
- `CancellationException`을 삼키지 않는다

## 차량 앱 (AAOS)

- 주행 중 동작은 CarUxRestrictions 상태별로 확인한다
- 오디오는 재생 전에 포커스를 요청하고, 포커스 변경 이벤트(GAIN·LOSS·LOSS_TRANSIENT·CAN_DUCK)를 모두 처리한다
- 백그라운드로 가면 녹음과 차량 신호 구독을 중단한다
- 가로·세로 레이아웃을 모두 확인한다
