import { chmod } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { doctor, lint } from "../src/commands/check.js";
import type { CheckId, Diagnostic } from "../src/lib/diagnostic.js";
import { PACKAGE_ROOT } from "../src/lib/paths.js";
import { fixture, harnessSection, skill } from "./helpers.js";

const only = (diagnostics: Diagnostic[], check: CheckId) =>
  diagnostics.filter((d) => d.check === check);

const SETTINGS_JSON = JSON.stringify({
  hooks: {
    PreToolUse: [
      {
        matcher: "Read",
        hooks: [{ type: "command", command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/guard.sh' }],
      },
    ],
  },
});

const FILLED = harnessSection(`### 저장소

| 항목 | 값 |
|---|---|
| 기본 브랜치 | main |

### 아키텍처

| 역할 | 위치 |
|---|---|
| 아이콘 | src/icons |`);

/** 설정·스킬·hook이 모두 맞는 프로젝트 */
async function healthyProject(overrides: Record<string, string> = {}) {
  const root = await fixture({
    "CLAUDE.md": FILLED,
    ".claude/skills/verify/SKILL.md": `${skill("verify")}\n{설정:기본 브랜치} {설정:아키텍처 → 아이콘}\n`,
    ".claude/skills/ui-verify/SKILL.md": skill("ui-verify"),
    ".claude/skills/ui-verify/method.md": "# 방법\n",
    ".claude/skills/code-review-rules/SKILL.md": skill("code-review-rules"),
    ".claude/skills/code-review-rules/stack/react.md": "# React\n",
    ".claude/commands/feature.md": "---\ndescription: 기능 구현\n---\n",
    ".claude/hooks/guard.sh": "#!/bin/bash\n",
    ".claude/settings.json": SETTINGS_JSON,
    ...overrides,
  });
  await chmod(path.join(root, ".claude/hooks/guard.sh"), 0o755);
  return root;
}

describe("doctor", () => {
  it("설정이 맞는 프로젝트는 진단이 없다", async () => {
    expect(await doctor(await healthyProject())).toEqual([]);
  });

  it("하네스 설정 절이 없으면 setup을 안내한다", async () => {
    const diagnostics = await doctor(await healthyProject({ "CLAUDE.md": "# 프로젝트\n" }));
    expect(only(diagnostics, "harness-section")).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("/setup-harness");
  });

  it("채워지지 않은 {{...}} 자리를 줄 번호와 함께 알린다", async () => {
    const root = await healthyProject({
      "CLAUDE.md": FILLED.replace("| 기본 브랜치 | main |", "| 기본 브랜치 | {{BASE_BRANCH}} |"),
    });
    const [placeholder] = only(await doctor(root), "placeholder");
    expect(placeholder).toMatchObject({ file: "CLAUDE.md", severity: "error" });
    expect(placeholder?.message).toContain("{{BASE_BRANCH}}");
  });

  it("스킬이 설정에 없는 키를 참조하면 그 위치를 가리킨다", async () => {
    const root = await healthyProject({
      ".claude/skills/verify/SKILL.md": `${skill("verify")}본문\n{설정:리뷰어}\n`,
    });
    const [ref] = only(await doctor(root), "setting-ref");
    // skill()이 6줄, 본문 1줄 다음
    expect(ref).toMatchObject({ file: ".claude/skills/verify/SKILL.md", line: 8 });
    expect(ref?.message).toContain("{설정:리뷰어}");
  });

  it("빈 값은 경고만 한다", async () => {
    const root = await healthyProject({ "CLAUDE.md": FILLED.replace("| main |", "|  |") });
    expect(only(await doctor(root), "empty-value")).toMatchObject([{ severity: "warning" }]);
  });

  it("두 소절에 같은 키가 있으면 모호하다고 알린다", async () => {
    const root = await healthyProject({
      "CLAUDE.md": FILLED.replace(
        "| 아이콘 | src/icons |",
        "| 아이콘 | src/icons |\n| 기본 브랜치 | dev |",
      ),
    });
    expect(only(await doctor(root), "duplicate-key")).toHaveLength(1);
  });

  it("프리셋이 적용되지 않았으면 경고한다", async () => {
    const root = await healthyProject();
    const { rm } = await import("node:fs/promises");
    await rm(path.join(root, ".claude/skills/ui-verify/method.md"));
    await rm(path.join(root, ".claude/skills/code-review-rules/stack"), { recursive: true });
    const checks = (await doctor(root)).map((d) => [d.check, d.severity]);
    expect(checks).toEqual([
      ["ui-verify-method", "warning"],
      ["stack-rules", "warning"],
    ]);
  });
});

describe("frontmatter", () => {
  it("name이 디렉터리 이름과 다르면 실패한다", async () => {
    const root = await healthyProject({ ".claude/skills/verify/SKILL.md": skill("verification") });
    const [d] = only(await doctor(root), "frontmatter");
    expect(d?.message).toContain('"verification"');
  });

  it("SKILL.md가 없는 스킬 디렉터리를 잡는다", async () => {
    const root = await healthyProject({ ".claude/skills/orphan/notes.md": "메모\n" });
    expect(only(await doctor(root), "frontmatter")).toMatchObject([
      { file: ".claude/skills/orphan", message: "SKILL.md가 없다" },
    ]);
  });

  it("description이 없으면 실패하고, 너무 길면 경고한다", async () => {
    const root = await healthyProject({
      ".claude/commands/feature.md": "---\nname: feature\n---\n",
      ".claude/skills/verify/SKILL.md": skill("verify", "가".repeat(1100)),
    });
    expect(only(await doctor(root), "frontmatter")).toMatchObject([
      { file: ".claude/skills/verify/SKILL.md", severity: "warning" },
      { file: ".claude/commands/feature.md", severity: "error" },
    ]);
  });
});

describe("hooks", () => {
  it("settings.json이 깨지면 실패한다", async () => {
    const root = await healthyProject({ ".claude/settings.json": "{ hooks: " });
    expect(only(await doctor(root), "hook")[0]?.message).toContain("JSON이 아니다");
  });

  it("hook 스크립트가 없거나 실행 권한이 없으면 실패한다", async () => {
    const root = await healthyProject();
    await chmod(path.join(root, ".claude/hooks/guard.sh"), 0o644);
    expect(only(await doctor(root), "hook")[0]?.message).toContain("실행 권한");

    const missing = await healthyProject();
    const { rm } = await import("node:fs/promises");
    await rm(path.join(missing, ".claude/hooks/guard.sh"));
    expect(only(await doctor(missing), "hook")[0]?.message).toContain("없다");
  });
});

describe("lint", () => {
  it("보일러플레이트 루트가 아니면 알린다", async () => {
    expect(await lint(await fixture())).toMatchObject([{ check: "harness-section" }]);
  });

  it("프리셋이 가리키는 원본 파일이 없으면 실패한다", async () => {
    const root = await fixture({
      "templates/CLAUDE.harness.md": harnessSection("### 저장소\n"),
      "presets/web/preset.md": [
        "# 프리셋",
        "## 복사할 파일",
        "| 원본 | 대상 |",
        "|---|---|",
        "| `stack/react.md` | x |",
        "| `../shared/stack/*.md` | x |",
        "| `stack/missing.md` | x |",
        "## scaffold",
        "| `scaffold/none.yml` | 복사 표 밖이라 보지 않는다 |",
      ].join("\n"),
      "presets/web/stack/react.md": "#\n",
      "presets/shared/stack/typescript.md": "#\n",
    });
    expect(only(await lint(root), "preset-source")).toMatchObject([
      { file: "presets/web/preset.md", line: 7, message: "복사할 원본 stack/missing.md가 없다" },
    ]);
  });

  it("이 저장소 자체가 lint를 통과한다", async () => {
    expect(await lint(PACKAGE_ROOT)).toEqual([]);
  });
});
