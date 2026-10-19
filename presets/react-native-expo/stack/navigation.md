# 네비게이션 체크 항목 (React Navigation / Expo Router)

## 라우트 추가 시 함께 바꿀 곳을 본다

React Navigation:

1. `ParamList` 타입에 등록했는가
2. `<Stack.Screen>`에 등록했는가
3. `{설정:문서 동기화}`에 적힌 화면명 매핑(분석 도구 등)에 추가했는가

Expo Router는 파일 위치가 곧 라우트다. 파일을 옮기거나 이름을 바꾸면 그 경로로 이동하던 `router.push`·`<Link href>`를 함께 고친다.

## 화면을 주석 처리·삭제할 때 진입 코드를 함께 정리한다

라우트를 지웠는데 이동 호출이 남아 있으면 버튼이 무반응이 된다.

```bash
grep -rn 'navigate("ScreenName"\|screen: "ScreenName"\|"/screen-path"' <소스 루트>
```

등록을 주석 처리한 화면으로 두 화면이 계속 이동을 시도해 버튼이 동작하지 않은 사례가 있다.

## 화면이 도달 가능한지 확인한다

컴포넌트가 존재하고 라우트에 등록돼 있어도, 이동 호출부가 없으면 죽은 화면이다. 이런 화면이 몇 달씩 남아 있던 사례가 있다.

## NavigationContainer의 배선을 확인한다

`onStateChange`(화면 추적), `ref`(알림 딥링크), 전역 핸들러 등록이 리팩터링 중 함께 삭제되기 쉽다. 함수는 남고 호출부만 사라지면 타입체크로 잡히지 않는다.

## 화면 조회 추적

React Navigation은 분석 도구가 화면 전환을 자동으로 추적하지 않는다. 네이티브 자동 수집은 Activity/ViewController 단위라 RN에서는 화면 하나로 고정된다. `onStateChange`에서 직접 로깅하는 코드를 지우면 화면별 지표가 전부 사라진다.
