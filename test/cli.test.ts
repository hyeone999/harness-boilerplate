import { existsSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { main } from "../src/main.js";
import { PACKAGE_ROOT } from "../src/lib/paths.js";
import { fixture } from "./helpers.js";

let stdout: string[];
let stderr: string[];

beforeEach(() => {
  stdout = [];
  stderr = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    stdout.push(args.join(" "));
  });
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    stderr.push(args.join(" "));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("harness CLI", () => {
  it("--version은 package.json 버전을 출력한다", async () => {
    expect(await main(["--version"])).toBe(0);
    expect(stdout[0]).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("명령이 없으면 도움말과 함께 사용법 오류(2)로 끝난다", async () => {
    expect(await main([])).toBe(2);
    expect(stdout.join("\n")).toContain("harness init");
  });

  it("알 수 없는 명령·옵션은 2로 끝난다", async () => {
    expect(await main(["deploy"])).toBe(2);
    expect(await main(["lint", "--nope"])).toBe(2);
    expect(await main(["lint", "a", "b"])).toBe(2);
  });

  it("없는 디렉터리는 만들지 않고 사용법 오류로 끝난다", async () => {
    const root = await fixture();
    const missing = path.join(root, "typo");
    expect(await main(["init", missing])).toBe(2);
    expect(existsSync(missing)).toBe(false);
    expect(await main(["doctor", missing])).toBe(2);
  });

  it("lint는 이 저장소에서 0으로 끝난다", async () => {
    expect(await main(["lint", PACKAGE_ROOT])).toBe(0);
    expect(stdout.at(-1)).toBe("0 error(s), 0 warning(s)");
  });

  it("doctor --json은 기계가 읽을 수 있는 결과를 내고 오류가 있으면 1로 끝난다", async () => {
    const root = await fixture({ "CLAUDE.md": "# 설정 없음\n" });
    expect(await main(["doctor", root, "--json"])).toBe(1);
    const report = JSON.parse(stdout.join("\n")) as { summary: { errors: number } };
    expect(report.summary.errors).toBe(1);
  });

  it("--strict면 경고도 실패로 친다", async () => {
    const root = await fixture({ "CLAUDE.md": "## 하네스 설정\n\n### 저장소\n" });
    expect(await main(["doctor", root])).toBe(0);
    expect(await main(["doctor", root, "--strict"])).toBe(1);
  });

  it("init 충돌은 1로 끝나고 이유를 stderr에 쓴다", async () => {
    const root = await fixture({ ".claude/commands/feature.md": "다름\n" });
    expect(await main(["init", root])).toBe(1);
    expect(stderr.join("\n")).toContain("--force");
  });
});
