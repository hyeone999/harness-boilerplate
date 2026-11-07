# 프리셋: Android 네이티브 (Kotlin + Jetpack Compose)

## 감지 조건

`package.json`이 없고 Gradle 빌드 파일(`build.gradle.kts`, `app/build.gradle.kts`)에 `com.android.application`이 있다.

| 단서 | 판단 |
|---|---|
| `androidx.compose` 의존성, `buildFeatures.compose` | Jetpack Compose. `stack/compose.md` 적용 |
| 매니페스트의 `android.hardware.type.automotive` | Android Automotive OS(AAOS). `stack/compose.md`의 차량 항목 적용 |

## 복사할 파일

| 원본 | 대상 | 조건 |
|---|---|---|
| `stack/compose.md` | `.claude/skills/code-review-rules/stack/` | Compose를 쓸 때 |
| `method.md` | `.claude/skills/ui-verify/method.md` | 항상 |

## 테스트 조합

| 층 | 도구 | 비고 |
|---|---|---|
| 단위 | JUnit (`src/test`) | 순수 로직 |
| 통합 | Compose UI Test (`src/androidTest`) | 필요할 때 추가 |
| E2E | adb + uiautomator | `method.md` 참고 |
| 모킹 | 인터페이스의 Fake 구현 | MSW는 쓰지 않는다 |

## scaffold (새 프로젝트에만, 승인 후)

| 파일 | 내용 |
|---|---|
| `scaffold/.github/workflows/ci.yml` | 컴파일·린트·단위 테스트·디버그 빌드 |

Gradle wrapper는 직접 쓰지 않고 `gradle wrapper` 명령으로 만든다.
