import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PACKAGE_ROOT } from "../src/lib/paths.js";
import { fixture } from "./helpers.js";

const HOOK = path.join(PACKAGE_ROOT, ".claude/hooks/limit-large-read.sh");

/** Claude Code가 PreToolUse hook에 넘기는 입력 형태로 hook을 실행한다. */
function runHook(toolInput: Record<string, unknown>) {
  const result = spawnSync(HOOK, {
    input: JSON.stringify({ tool_name: "Read", tool_input: toolInput }),
    encoding: "utf8",
  });
  return { status: result.status, stdout: result.stdout.trim() };
}

const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i}`).join("\n") + "\n";

describe("limit-large-read hook", () => {
  it("300줄 이하 파일은 통과시킨다", async () => {
    const root = await fixture({ "small.ts": lines(300) });
    expect(runHook({ file_path: path.join(root, "small.ts") })).toEqual({ status: 0, stdout: "" });
  });

  it("300줄을 넘는 파일을 범위 없이 읽으면 deny한다", async () => {
    const root = await fixture({ "big.ts": lines(301) });
    const { status, stdout } = runHook({ file_path: path.join(root, "big.ts") });
    expect(status).toBe(0);
    const output = JSON.parse(stdout) as {
      hookSpecificOutput: { permissionDecision: string; permissionDecisionReason: string };
    };
    expect(output.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(output.hookSpecificOutput.permissionDecisionReason).toContain("301줄");
  });

  it.each([{ offset: 100 }, { limit: 50 }, { offset: 0 }])(
    "범위(%o)를 주면 큰 파일도 통과시킨다",
    async (range) => {
      const root = await fixture({ "big.ts": lines(1000) });
      expect(runHook({ file_path: path.join(root, "big.ts"), ...range }).stdout).toBe("");
    },
  );

  it("바이너리 파일은 줄 수와 무관하게 통과시킨다", async () => {
    const root = await fixture({ "image.png": "\0".repeat(10) + lines(500) });
    expect(runHook({ file_path: path.join(root, "image.png") }).stdout).toBe("");
  });

  it("없는 파일은 Read 도구가 처리하도록 통과시킨다", () => {
    expect(runHook({ file_path: "/nonexistent/file.ts" })).toEqual({ status: 0, stdout: "" });
  });
});
