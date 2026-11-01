import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { init, InitError } from "../src/commands/init.js";
import { PACKAGE_ROOT } from "../src/lib/paths.js";
import { fixture } from "./helpers.js";

const run = (target: string, options: { force?: boolean; dryRun?: boolean } = {}) =>
  init(target, { force: false, dryRun: false, ...options });

const readJson = async (file: string): Promise<unknown> => JSON.parse(await readFile(file, "utf8"));

describe("init", () => {
  it("빈 프로젝트에 commands·skills·hooks와 settings.json을 설치한다", async () => {
    const target = await fixture();
    const result = await run(target);

    expect(result.applied).toBe(true);
    expect(result.settings).toBe("create");
    expect(result.files.every((f) => f.action === "create")).toBe(true);
    expect(result.files.map((f) => f.file)).toContain(".claude/skills/verify/SKILL.md");
    expect(await readJson(path.join(target, ".claude/settings.json"))).toEqual(
      await readJson(path.join(PACKAGE_ROOT, ".claude/settings.json")),
    );
  });

  it("hook 스크립트의 실행 권한을 유지한다", async () => {
    const target = await fixture();
    await run(target);
    const { mode } = await stat(path.join(target, ".claude/hooks/limit-large-read.sh"));
    expect(mode & 0o111).not.toBe(0);
  });

  it("두 번 실행해도 아무것도 바뀌지 않는다", async () => {
    const target = await fixture();
    await run(target);
    const again = await run(target);
    expect(again.settings).toBe("unchanged");
    expect(again.files.every((f) => f.action === "unchanged")).toBe(true);
  });

  it("기존 settings.json의 다른 설정을 보존하며 합친다", async () => {
    const target = await fixture({
      ".claude/settings.json": JSON.stringify({
        model: "opus",
        permissions: { allow: ["Bash(ls)"] },
      }),
    });
    const result = await run(target);
    const settings = (await readJson(path.join(target, ".claude/settings.json"))) as {
      model: string;
      permissions: { allow: string[] };
    };
    expect(result.settings).toBe("merge");
    expect(settings.model).toBe("opus");
    expect(settings.permissions.allow[0]).toBe("Bash(ls)");
    expect(settings.permissions.allow).toContain("Bash(git status:*)");
  });

  it("내용이 다른 기존 파일이 있으면 아무것도 쓰지 않는다", async () => {
    const target = await fixture({ ".claude/commands/feature.md": "팀이 고친 내용\n" });
    const result = await run(target);

    expect(result.applied).toBe(false);
    expect(result.files.filter((f) => f.action === "conflict")).toEqual([
      { file: ".claude/commands/feature.md", action: "conflict" },
    ]);
    expect(await readFile(path.join(target, ".claude/commands/feature.md"), "utf8")).toBe(
      "팀이 고친 내용\n",
    );
    await expect(stat(path.join(target, ".claude/settings.json"))).rejects.toThrow();
  });

  it("--force면 덮어쓴다", async () => {
    const target = await fixture({ ".claude/commands/feature.md": "팀이 고친 내용\n" });
    const result = await run(target, { force: true });
    expect(result.applied).toBe(true);
    expect(result.files.find((f) => f.file === ".claude/commands/feature.md")?.action).toBe(
      "overwrite",
    );
  });

  it("--dry-run이면 계획만 돌려주고 쓰지 않는다", async () => {
    const target = await fixture();
    const result = await run(target, { dryRun: true });
    expect(result.applied).toBe(false);
    expect(result.files.length).toBeGreaterThan(0);
    await expect(stat(path.join(target, ".claude"))).rejects.toThrow();
  });

  it("깨진 settings.json은 합치지 않고 멈춘다", async () => {
    const target = await fixture({ ".claude/settings.json": "{ not json" });
    await expect(run(target)).rejects.toThrow(InitError);
    expect(await readFile(path.join(target, ".claude/settings.json"), "utf8")).toBe("{ not json");
  });

  it("보일러플레이트 자신에게는 설치하지 않는다", async () => {
    await expect(run(PACKAGE_ROOT)).rejects.toThrow(InitError);
  });

  it("설치 직후 doctor는 setup이 필요하다고만 알린다", async () => {
    const { doctor } = await import("../src/commands/check.js");
    const target = await fixture();
    await run(target);
    await writeFile(path.join(target, "CLAUDE.md"), "# 프로젝트\n");
    const errors = (await doctor(target)).filter((d) => d.severity === "error");
    expect(errors.map((d) => d.check)).toEqual(["harness-section"]);
  });
});
