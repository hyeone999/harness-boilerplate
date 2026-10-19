# UI 검증 방법 — React Native (Expo dev client + Maestro, iOS 시뮬레이터)

원칙은 `SKILL.md`를 따른다. 이 파일은 실행 방법만 다룬다.

## 사전 조건

```bash
export PATH="$PATH":"$HOME/.maestro/bin"
maestro --version
xcrun simctl list devices booted | grep iPhone
lsof -ti:{설정:개발 서버 포트}
```

- Maestro는 **Java 17**이 필요하다. 다른 버전이 잡혀 `Bad CPU type` 등으로 실패하면 `JAVA_HOME`을 17로 지정한다
- 시뮬레이터가 없으면 `xcrun simctl boot <UDID> && open -a Simulator`
- Metro가 없으면 `npx expo start --dev-client > "$TMPDIR/metro.log" 2>&1 &`

## ⚠️ 최신 코드 확인

앱이 이미 떠 있으면 캐시된 구버전 JS로 동작한다.

```bash
D=$(xcrun simctl list devices booted -j | grep -o '"udid" : "[^"]*"' | head -1 | cut -d'"' -f4)
xcrun simctl terminate $D {설정:앱 ID}
xcrun simctl openurl $D "{설정:앱 스킴}://expo-development-client/?url=http%3A%2F%2Flocalhost%3A{설정:개발 서버 포트}"
```

Metro 로그에 `Bundled ... index` 줄이 새로 찍혀야 최신 코드다.

네이티브 모듈이 바뀐 브랜치면 JS 리로드로는 부족하다. 네이티브 재빌드가 필요하다.

## 실행

시나리오는 스크래치패드에 작업마다 만든다.

```yaml
appId: {설정:앱 ID}
---
- launchApp
- extendedWaitUntil:
    visible: "<첫 화면 고정 텍스트>"
    timeout: 20000
- tapOn: "<탭 이름>"
- assertVisible: "<도착 화면 고정 텍스트>"
- takeScreenshot: <화면명>
```

```bash
maestro test "$TMPDIR/<flow>.yaml"
LATEST=$(ls -td ~/.maestro/tests/*/ | head -1)
ls "$LATEST"<flow명>/takeScreenshot/
```

스크린샷은 실행 디렉터리가 아니라 Maestro 홈에 저장된다.

## Maestro 주의점

- RN `Modal`과 바텀시트 라이브러리 내용은 **접근성 트리에 잡히지 않는 경우가 많다.** `assertVisible` 대신 스크린샷으로 판독하고, 그 안의 버튼을 눌러야 하면 별도 시나리오로 나눈다
- iOS에서 `back`은 동작하지 않는다. 헤더의 뒤로가기 버튼을 탭하거나 좌표로 누른다
- 긴 화면은 `scrollUntilVisible`로 필요한 요소까지만 내린다
- 리스트 항목을 눌러야 하면 `testID={\`prefix-${index}\`}`를 붙이고, 캡처 후 제거할지 정한다

## 로그

Metro 출력에 앱 로그가 남는다.

```bash
tail -40 "$TMPDIR/metro.log"
```
