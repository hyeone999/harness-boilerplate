import { readdir } from "node:fs/promises";
import path from "node:path";

import type { Diagnostic } from "../lib/diagnostic.js";
import { displayPath, exists, readText } from "../lib/fs.js";
import { parseFrontmatter } from "../lib/markdown.js";

/** Claude Code가 스킬 description을 잘라 쓰는 길이 */
export const MAX_DESCRIPTION_LENGTH = 1024;

async function listDirs(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

async function listMarkdown(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort();
}

/**
 * 스킬은 description으로 호출 여부가 정해진다. frontmatter가 깨지면 스킬이 조용히 로드되지 않는다.
 */
export async function checkFrontmatter(root: string): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const report = (file: string, message: string, severity: Diagnostic["severity"] = "error") => {
    diagnostics.push({ check: "frontmatter", severity, file: displayPath(root, file), message });
  };

  const skillsDir = path.join(root, ".claude", "skills");
  for (const name of await listDirs(skillsDir)) {
    const file = path.join(skillsDir, name, "SKILL.md");
    const text = await readText(file);
    if (text === undefined) {
      report(path.join(skillsDir, name), "SKILL.md가 없다");
      continue;
    }
    const frontmatter = parseFrontmatter(text);
    if (frontmatter === undefined) {
      report(file, "frontmatter(--- ... ---)가 없다");
      continue;
    }
    const skillName = frontmatter.data.get("name");
    if (skillName !== name) {
      report(file, `name "${skillName ?? ""}"이 디렉터리 이름 "${name}"과 다르다`);
    }
    checkDescription(frontmatter.data.get("description"), file, report);
  }

  const commandsDir = path.join(root, ".claude", "commands");
  for (const name of await listMarkdown(commandsDir)) {
    const file = path.join(commandsDir, name);
    const frontmatter = parseFrontmatter((await readText(file)) ?? "");
    if (frontmatter === undefined) {
      report(file, "frontmatter(--- ... ---)가 없다");
      continue;
    }
    checkDescription(frontmatter.data.get("description"), file, report);
  }

  return diagnostics;
}

function checkDescription(
  description: string | undefined,
  file: string,
  report: (file: string, message: string, severity?: Diagnostic["severity"]) => void,
): void {
  if (description === undefined || description === "") {
    report(file, "description이 비어 있다");
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    report(
      file,
      `description이 ${description.length}자다. ${MAX_DESCRIPTION_LENGTH}자를 넘으면 잘린다`,
      "warning",
    );
  }
}
