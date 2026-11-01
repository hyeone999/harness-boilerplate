import { readdir } from "node:fs/promises";
import path from "node:path";

import type { Diagnostic } from "../lib/diagnostic.js";
import { displayPath, exists, readText } from "../lib/fs.js";

const COPY_SECTION = /^##\s+복사할 파일\s*$/;

/** `preset.md`의 "복사할 파일" 표 첫 칸에 적힌 원본 경로를 뽑는다. */
export function copySources(text: string): { source: string; line: number }[] {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => COPY_SECTION.test(l));
  if (start === -1) return [];

  const sources: { source: string; line: number }[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (/^##\s/.test(line)) break;
    const cell = /^\s*\|\s*`([^`]+)`\s*\|/.exec(line);
    if (cell?.[1] !== undefined) sources.push({ source: cell[1], line: i + 1 });
  }
  return sources;
}

/** 파일 이름 부분의 `*`만 지원한다 (`../shared/stack/*.md`). */
async function matches(presetDir: string, source: string): Promise<boolean> {
  const target = path.join(presetDir, source);
  const base = path.basename(target);
  if (!base.includes("*")) return exists(target);

  const dir = path.dirname(target);
  if (!(await exists(dir))) return false;
  const escaped = base.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", "[^/]*");
  const pattern = new RegExp(`^${escaped}$`);
  return (await readdir(dir)).some((name) => pattern.test(name));
}

/** 프리셋이 복사하라고 적은 파일이 실제로 있는지 본다. 없으면 /setup-harness가 중간에 실패한다. */
export async function checkPresetSources(root: string): Promise<Diagnostic[]> {
  const presetsDir = path.join(root, "presets");
  if (!(await exists(presetsDir))) return [];

  const diagnostics: Diagnostic[] = [];
  const presets = (await readdir(presetsDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const preset of presets) {
    const presetDir = path.join(presetsDir, preset);
    const file = path.join(presetDir, "preset.md");
    const text = await readText(file);
    if (text === undefined) continue; // shared/처럼 preset.md가 없는 공용 디렉터리

    for (const { source, line } of copySources(text)) {
      if (await matches(presetDir, source)) continue;
      diagnostics.push({
        check: "preset-source",
        severity: "error",
        file: displayPath(root, file),
        line,
        message: `복사할 원본 ${source}가 없다`,
      });
    }
  }
  return diagnostics;
}
