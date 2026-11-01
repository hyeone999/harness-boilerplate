import path from "node:path";

import type { Diagnostic } from "../lib/diagnostic.js";
import { displayPath, readText, walkFiles } from "../lib/fs.js";
import {
  findPlaceholders,
  findSettingRefs,
  resolveRef,
  type HarnessSettings,
} from "../lib/markdown.js";

/** 스킬·커맨드의 `{설정:...}` 참조가 하네스 설정 절에서 실제로 찾아지는지 본다. */
export async function checkSettingRefs(
  root: string,
  settingsFile: string,
  settings: HarnessSettings,
  scanDirs: readonly string[],
): Promise<Diagnostic[]> {
  const settingsName = displayPath(root, settingsFile);
  const diagnostics: Diagnostic[] = [];

  for (const dir of scanDirs) {
    for (const file of await walkFiles(path.join(root, dir))) {
      if (!file.endsWith(".md")) continue;
      const text = (await readText(file)) ?? "";
      for (const ref of findSettingRefs(text)) {
        const result = resolveRef(ref, settings);
        if (result === "ok") continue;
        const where =
          result === "missing-section"
            ? `소절 [${ref.section ?? ""}] 없음`
            : ref.section === undefined
              ? `키·소절 [${ref.key}] 없음`
              : `소절 [${ref.section}]에 키 [${ref.key}] 없음`;
        diagnostics.push({
          check: "setting-ref",
          severity: "error",
          file: displayPath(root, file),
          line: ref.line,
          message: `${ref.raw}를 찾을 수 없다 (${settingsName}: ${where})`,
        });
      }
    }
  }
  return diagnostics;
}

/** 같은 키가 두 소절에 있으면 `{설정:키}`가 어느 값을 가리키는지 정할 수 없다. */
export function checkDuplicateKeys(
  root: string,
  settingsFile: string,
  settings: HarnessSettings,
): Diagnostic[] {
  const firstSeen = new Map<string, string>();
  const diagnostics: Diagnostic[] = [];
  for (const row of settings.rows) {
    const previous = firstSeen.get(row.key);
    if (previous === undefined) {
      firstSeen.set(row.key, row.section);
      continue;
    }
    diagnostics.push({
      check: "duplicate-key",
      severity: "error",
      file: displayPath(root, settingsFile),
      line: row.line,
      message: `키 [${row.key}]가 두 소절(${previous}, ${row.section})에 있어 {설정:${row.key}}가 모호하다`,
    });
  }
  return diagnostics;
}

/** /setup-harness가 채우지 않고 남긴 `{{NAME}}` 자리. */
export function checkPlaceholders(
  root: string,
  settingsFile: string,
  settings: HarnessSettings,
): Diagnostic[] {
  return settings.lines.flatMap(([line, text]) =>
    findPlaceholders(text).map((name): Diagnostic => ({
      check: "placeholder",
      severity: "error",
      file: displayPath(root, settingsFile),
      line,
      message: `{{${name}}}가 채워지지 않았다. /setup-harness를 다시 실행하거나 값을 직접 적는다`,
    })),
  );
}

/** 값이 빈 행. 해당 없는 항목이면 "없음"처럼 명시하게 한다. */
export function checkEmptyValues(
  root: string,
  settingsFile: string,
  settings: HarnessSettings,
): Diagnostic[] {
  return settings.rows
    .filter((row) => row.value === "")
    .map((row): Diagnostic => ({
      check: "empty-value",
      severity: "warning",
      file: displayPath(root, settingsFile),
      line: row.line,
      message: `[${row.key}] 값이 비어 있다. 해당 없으면 "없음"으로 적는다`,
    }));
}
