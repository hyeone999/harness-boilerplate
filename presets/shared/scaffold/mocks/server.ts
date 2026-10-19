// 웹(Jest·Vitest)은 "msw/node", React Native는 "msw/native"에서 가져온다.
import { setupServer } from "msw/{{MSW_RUNTIME}}";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);

// 테스트 setup 파일에서:
// beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
