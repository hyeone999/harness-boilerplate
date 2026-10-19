# React Query 체크 항목

`@tanstack/react-query`를 쓰는 프로젝트에만 적용한다.

## 낙관적 업데이트는 취소·롤백이 있어야 한다

`onMutate`에서 `cancelQueries` 없이 캐시를 바꾸면, 진행 중이던 재조회 응답이 낙관적 값을 덮어쓴다.

```ts
onMutate: async (vars) => {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, (old) => /* ... */);
  return { previous };
},
onError: (_e, _v, ctx) => {
  if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
},
```

롤백이 없으면 서버 저장이 실패해도 화면은 성공한 것처럼 남는다.

## 쿼리키는 팩토리로 관리한다

문자열을 여러 곳에 흩뿌리지 않는다.

```ts
export const contentDetailQueryKey = (id: string) =>
  ["content", "detail", id] as const;
```

## 상태는 캐시에서 파생한다

같은 데이터를 별도 `useState`로 복제하면 두 값이 어긋난다. 서버 데이터가 진실이면 캐시를 단일 진실로 두고 파생시킨다.

## enabled로 불필요한 호출을 막는다

`enabled: !!id` — 식별자가 없으면 요청하지 않는다.

## 실패를 사용자에게 알린다

mutation 실패 시 조용히 넘어가지 않는다. 토스트나 알림으로 알리고, 필요하면 재시도 경로를 준다.

## 테스트

테스트마다 `new QueryClient({ defaultOptions: { queries: { retry: false } } })`로 새 클라이언트를 만든다. 캐시를 공유하면 테스트가 서로 영향을 준다.
