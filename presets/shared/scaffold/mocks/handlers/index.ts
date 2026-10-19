import { http, HttpResponse } from "msw";

// 도메인별 handler를 모은다. 응답 타입은 API 스키마에서 생성한 타입을 쓴다.
// 스키마 확정 전 추정한 응답에는 `// TODO: 스키마 확정 전 추정`을 남긴다.

export const handlers = [
  http.get("*/api/health", () => HttpResponse.json({ status: "ok" })),
];
