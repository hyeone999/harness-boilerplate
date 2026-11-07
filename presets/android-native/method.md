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

## Pleos Connect 에뮬레이터

Pleos Connect 앱일 때만 적용한다.

### 스크린샷

`adb exec-out screencap`은 앱 영역이 검게 나올 수 있다. 절대 경로로 에뮬레이터 콘솔 명령을 쓴다.

```bash
adb emu screenrecord screenshot "$TMPDIR/<화면명>.png"
```

### 사용자

앱은 드라이버 사용자(user 10)로 실행된다. `adb shell am get-current-user`로 확인하고 설치·권한 명령에 `--user`를 붙인다.

```bash
adb install -r --user 10 app/build/outputs/apk/debug/app-debug.apk
adb shell pm grant --user 10 {설정:앱 ID} android.permission.RECORD_AUDIO
```

### 주행 상태 (Virtual Console)

에뮬레이터에 내장돼 있어 설치가 필요 없다. **브라우저에서 콘솔 페이지가 열려 있어야** 활성화되고, 닫혀 있으면 쓰기 API가 `emulator_inactive`를 돌려준다.

```bash
adb forward tcp:8088 tcp:8088
open http://127.0.0.1:8088/
curl -X PUT "http://127.0.0.1:8088/vehicle/gear?gear=Drive"
curl -X PUT "http://127.0.0.1:8088/vehicle/controls?speed=30&accelerator=0&brake=0"
adb shell dumpsys car_service --services CarUxRestrictionsManagerService | grep 'Display id: 0 UXR'
```

- `DO: true`면 주행 제한 상태다. 확인 후 기어를 `Park`로 되돌린다
- `accelerator`를 0보다 크게 주면 콘솔이 속도를 계속 올린다
- `cmd car_service inject-vhal-event`는 user 빌드라 쓸 수 없다

### 마이크

기본 설정에서는 Mac의 마이크 입력이 전달되지 않는다. 실행 옵션을 켜고, 값이 계속 0이면 macOS 개인정보 보호의 마이크 권한을 확인한다.

```bash
~/Library/Android/sdk/emulator/emulator -avd <AVD 이름> -allow-host-audio
```

## 로그

```bash
adb logcat -d -b crash | tail -20
adb logcat -d | grep {설정:앱 ID} | tail -40
```
