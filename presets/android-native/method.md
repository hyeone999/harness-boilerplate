# UI 검증 방법 — Android 네이티브 (adb + uiautomator)

원칙은 `SKILL.md`를 따른다. 이 파일은 실행 방법만 다룬다.

## 사전 조건

```bash
~/Library/Android/sdk/platform-tools/adb devices
~/Library/Android/sdk/emulator/emulator -list-avds
```

- JDK 17이 필요하다. 다른 버전이 잡혀 `Bad CPU type` 등으로 실패하면 `JAVA_HOME`을 arm64용 17로 지정한다
- 차량 전용 동작은 해당 플랫폼 에뮬레이터에서 확인한다. 휴대폰 AVD 결과는 화면 흐름 확인용이다
- 어떤 에뮬레이터로 확인했는지 검증 보고서에 적는다

## ⚠️ 최신 코드 확인

```bash
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am force-stop {설정:앱 ID}
adb shell monkey -p {설정:앱 ID} -c android.intent.category.LAUNCHER 1
```

## 실행

```bash
adb shell uiautomator dump /sdcard/window.xml
adb exec-out cat /sdcard/window.xml    # 텍스트와 bounds 확인
adb shell input tap <x> <y>
adb exec-out screencap -p > "$TMPDIR/<화면명>.png"
```

## 주의점

- `uiautomator dump`는 수 초 걸린다. 짧게 지나가는 화면은 스크린샷이나 지연을 늘린 Fake로 확인한다
- 시나리오 스크립트는 스크래치패드에 작업마다 만든다

## 로그

```bash
adb logcat -d -b crash | tail -20
adb logcat -d | grep {설정:앱 ID} | tail -40
```
