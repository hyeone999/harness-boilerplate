# Next.js 체크 항목

`next`를 쓰는 프로젝트에만 적용한다. App Router 기준이며, Pages Router면 해당 없는 항목은 건너뛴다.

## 서버·클라이언트 컴포넌트 경계

- `"use client"`는 상호작용이 필요한 가장 작은 컴포넌트에 붙인다. 페이지 최상단에 붙이면 하위 전체가 클라이언트 번들로 간다
- 서버 컴포넌트에서 클라이언트 컴포넌트로 넘기는 props는 직렬화 가능해야 한다 (함수·Date·Map 불가)
- 서버 전용 코드(비밀 키, DB 접근)는 `import "server-only"`로 클라이언트 import를 막는다

## 환경변수

`NEXT_PUBLIC_` 접두사가 붙은 값은 **브라우저 번들에 그대로 들어간다.** 비밀 키에 붙이지 않는다. 새 환경변수를 추가하면 `.env.example`과 CI 설정도 함께 바꾼다.

## 데이터 패칭과 캐시

- 서버에서 `fetch`할 때 캐시 정책(`cache`, `next.revalidate`)을 명시한다. 기본값은 Next 버전마다 달랐다
- 변경 후 화면 갱신이 필요하면 `revalidatePath`/`revalidateTag`를 호출한다. 빠뜨리면 저장은 됐는데 화면이 그대로다
- 같은 데이터를 서버 컴포넌트와 클라이언트 쿼리 양쪽에서 따로 가져오면 두 값이 어긋난다. 한쪽을 진실로 정한다

## 하이드레이션 불일치

렌더 중 `Date.now()`, `Math.random()`, `window` 접근, 로케일 의존 포맷은 서버·클라이언트 결과가 달라 경고와 깜빡임을 낳는다. 클라이언트 전용 값은 effect 이후에 그린다.

## 라우트

- 라우트 폴더를 옮기거나 이름을 바꾸면 `<Link href>`·`router.push`·`redirect` 경로를 함께 고친다
- 라우트를 추가하면 `{설정:문서 동기화}`의 화면명 매핑(분석 도구 등)도 추가한다
- `loading.tsx`·`error.tsx`·`not-found.tsx`가 필요한 세그먼트인지 본다

## 이미지

`next/image`에는 `width`/`height` 또는 `fill`+`sizes`를 준다. 외부 도메인은 설정의 `images.remotePatterns`에 등록한다.
