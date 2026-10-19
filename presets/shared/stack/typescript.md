# TypeScript 체크 항목

## 서버 enum은 유니온 타입으로 좁힌다

`Record<string, T>`로 두면 서버가 새 값을 보내도 컴파일러가 알려주지 않는다.

❌ `const RATING_LABEL: Record<string, string> = { ... }`

✅

```ts
export type Rating = "ALL" | "OVER12" | "OVER15" | "ADULT" | "UNRATED";
export const RATING_LABEL: Record<Rating, string> = { ... };
```

enum이 바뀌면 매핑 누락이 컴파일 에러로 잡힌다. 서버가 새 등급 값을 보내기 시작했을 때 `Record<string, string>`이라 영문 코드가 그대로 화면에 노출된 사례가 있다.

## 매핑에 없는 값은 원문을 노출하지 않는다

`?? rawValue` 폴백은 영문 코드가 화면에 그대로 나오는 결과를 낳는다. 표시용 라벨이 없으면 해당 항목을 숨긴다.

연령등급처럼 법정 표기가 걸린 값은 임의로 추정해 매핑하지 않는다.

## int64는 문자열로 다룬다

JS `number`는 2^53을 넘으면 정밀도를 잃는다. 서버가 문자열로 주는지 확인하고 타입도 `string`으로 선언한다. 변환이 필요하면 JSON 파싱 전에 해야 하며, `String(value)`는 이미 늦다.

## API 타입은 스키마와 대조한다

`{설정:API 스키마}`에서 스키마명으로 좁혀 읽는다. 전체를 읽지 않는다. 서버엔 있는데 타입에 없는 필드가 생기면 기능을 놓친다.

가능하면 스키마에서 타입을 생성한다 (openapi-typescript, orval 등). 손으로 옮기면 어긋난다.

## 타입에러는 기준선 대비로 판단한다

브랜치마다 기존 에러 수가 다르다. 변경 전 수치를 먼저 재고 비교한다.
