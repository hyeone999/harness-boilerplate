import path from "node:path";

import { checkFrontmatter } from "../checks/frontmatter.js";
import { checkHooks } from "../checks/hooks.js";
import { checkPresetSources } from "../checks/presets.js";
import { checkPresetApplied } from "../checks/project.js";
import {
  checkDuplicateKeys,
  checkEmptyValues,
  checkPlaceholders,
  checkSettingRefs,
} from "../checks/settings.js";
import type { Diagnostic } from "../lib/diagnostic.js";
import { readText } from "../lib/fs.js";
import { HARNESS_HEADING, parseHarnessSettings } from "../lib/markdown.js";

export const TEMPLATE_PATH = "templates/CLAUDE.harness.md";

/**
 * 보일러플레이트 원본을 검사한다 (CI용).
 * 스킬의 `{설정:...}` 참조가 템플릿과 맞는지, 프리셋이 가리키는 파일이 있는지 본다.
 */
export async function lint(root: string): Promise<Diagnostic[]> {
  const templateFile = path.join(root, TEMPLATE_PATH);
  const settings = parseHarnessSettings((await readText(templateFile)) ?? "");
  if (settings === undefined) {
    return [
      {
        check: "harness-section",
        severity: "error",
        file: TEMPLATE_PATH,
        message: `보일러플레이트 루트가 아니다. ${TEMPLATE_PATH}에 "## ${HARNESS_HEADING}" 절이 없다`,
      },
    ];
  }

  const results = await Promise.all([
    checkSettingRefs(root, templateFile, settings, [".claude", "presets"]),
    checkFrontmatter(root),
    checkHooks(root),
    checkPresetSources(root),
  ]);
  return [...checkDuplicateKeys(root, templateFile, settings), ...results.flat()];
}

/** 하네스를 적용한 프로젝트를 검사한다. */
export async function doctor(root: string): Promise<Diagnostic[]> {
  const claudeFile = path.join(root, "CLAUDE.md");
  const settings = parseHarnessSettings((await readText(claudeFile)) ?? "");

  const common = (
    await Promise.all([checkFrontmatter(root), checkHooks(root), checkPresetApplied(root)])
  ).flat();

  if (settings === undefined) {
    return [
      {
        check: "harness-section",
        severity: "error",
        file: "CLAUDE.md",
        message: `"## ${HARNESS_HEADING}" 절이 없다. Claude Code에서 /setup-harness를 실행한다`,
      },
      ...common,
    ];
  }

  return [
    ...checkPlaceholders(root, claudeFile, settings),
    ...checkEmptyValues(root, claudeFile, settings),
    ...checkDuplicateKeys(root, claudeFile, settings),
    ...(await checkSettingRefs(root, claudeFile, settings, [".claude"])),
    ...common,
  ];
}
