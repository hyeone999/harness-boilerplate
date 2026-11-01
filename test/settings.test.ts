import { describe, expect, it } from "vitest";

import { mergeSettings, parseSettings, projectScriptPath, readHooks } from "../src/lib/settings.js";
import type { JsonObject } from "../src/lib/settings.js";

const HOOK = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/limit-large-read.sh';

const source: JsonObject = {
  permissions: { allow: ["Bash(git status:*)", "Bash(git diff:*)"] },
  hooks: {
    PreToolUse: [{ matcher: "Read", hooks: [{ type: "command", command: HOOK }] }],
  },
};

describe("mergeSettings", () => {
  it("빈 설정에는 source를 그대로 넣는다", () => {
    const { merged, changed } = mergeSettings({}, source);
    expect(changed).toBe(true);
    expect(merged).toEqual(source);
  });

  it("기존 allow 순서를 지키고 없는 규칙만 뒤에 붙인다", () => {
    const { merged } = mergeSettings(
      { permissions: { allow: ["Bash(npm test:*)", "Bash(git diff:*)"], deny: ["Bash(rm:*)"] } },
      source,
    );
    expect(merged["permissions"]).toEqual({
      allow: ["Bash(npm test:*)", "Bash(git diff:*)", "Bash(git status:*)"],
      deny: ["Bash(rm:*)"],
    });
  });

  it("하네스와 무관한 키는 보존한다", () => {
    const { merged } = mergeSettings({ model: "opus", env: { A: "1" } }, source);
    expect(merged["model"]).toBe("opus");
    expect(merged["env"]).toEqual({ A: "1" });
  });

  it("같은 command의 hook이 이미 있으면 다시 넣지 않는다", () => {
    const target: JsonObject = {
      permissions: { allow: ["Bash(git status:*)", "Bash(git diff:*)"] },
      hooks: {
        PreToolUse: [{ matcher: "Read|Grep", hooks: [{ type: "command", command: HOOK }] }],
      },
    };
    const { merged, changed } = mergeSettings(target, source);
    expect(changed).toBe(false);
    expect(merged).toEqual(target);
  });

  it("다른 hook이 있는 이벤트에는 하네스 hook을 덧붙인다", () => {
    const other = { matcher: "Bash", hooks: [{ type: "command", command: "./guard.sh" }] };
    const { merged } = mergeSettings({ hooks: { PreToolUse: [other], Stop: [] } }, source);
    expect(merged["hooks"]).toEqual({
      PreToolUse: [other, { matcher: "Read", hooks: [{ type: "command", command: HOOK }] }],
      Stop: [],
    });
  });

  it("target을 변경하지 않는다", () => {
    const target: JsonObject = { permissions: { allow: [] } };
    mergeSettings(target, source);
    expect(target).toEqual({ permissions: { allow: [] } });
  });
});

describe("parseSettings / readHooks", () => {
  it("JSON이 아니거나 객체가 아니면 실패한다", () => {
    expect(parseSettings("{").ok).toBe(false);
    expect(parseSettings("[]").ok).toBe(false);
  });

  it("형식이 틀린 hook 이벤트를 알려준다", () => {
    const { errors } = readHooks({ hooks: { PreToolUse: [{ matcher: "Read" }] } });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("PreToolUse");
  });
});

describe("projectScriptPath", () => {
  it.each([
    [HOOK, ".claude/hooks/limit-large-read.sh"],
    ["$CLAUDE_PROJECT_DIR/.claude/hooks/a.sh --flag", ".claude/hooks/a.sh"],
    ["${CLAUDE_PROJECT_DIR}/scripts/b.sh", "scripts/b.sh"],
  ])("%s → %s", (command, expected) => {
    expect(projectScriptPath(command)).toBe(expected);
  });

  it("프로젝트 경로를 쓰지 않는 명령은 undefined", () => {
    expect(projectScriptPath("npx prettier --check")).toBeUndefined();
  });
});
