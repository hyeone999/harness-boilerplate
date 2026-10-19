import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

/** 모킹 스위치가 켜졌을 때만 동적 import로 시작한다. 프로덕션 번들에 MSW가 들어가지 않게 한다. */
export async function enableMocking() {
  // Next: process.env.NEXT_PUBLIC_API_MOCKING / Vite: import.meta.env.VITE_API_MOCKING
  if ({{MOCK_ENV_EXPR}} !== "true") return;
  await worker.start({ onUnhandledRequest: "bypass" });
}
