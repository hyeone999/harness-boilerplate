import path from "node:path";

import type { Diagnostic } from "../lib/diagnostic.js";
import { exists, isExecutable, readText } from "../lib/fs.js";
import { parseSettings, projectScriptPath, readHooks } from "../lib/settings.js";

const SETTINGS_PATH = ".claude/settings.json";

/**
 * settings.json이 깨지거나 hook 스크립트가 없거나 실행 권한이 없으면 hook은 조용히 동작하지 않는다.
 */
export async function checkHooks(root: string): Promise<Diagnostic[]> {
  const text = await readText(path.join(root, SETTINGS_PATH));
  if (text === undefined) return [];

  const report = (message: string): Diagnostic => ({
    check: "hook",
    severity: "error",
    file: SETTINGS_PATH,
    message,
  });

  const parsed = parseSettings(text);
  if (!parsed.ok) return [report(parsed.error)];

  const { events, errors } = readHooks(parsed.value);
  const diagnostics = errors.map(report);

  for (const [event, groups] of events) {
    for (const group of groups) {
      for (const hook of group.hooks) {
        if (hook.command === undefined) continue;
        const script = projectScriptPath(hook.command);
        if (script === undefined) continue;
        const file = path.join(root, script);
        if (!(await exists(file))) {
          diagnostics.push(report(`${event} hook 스크립트 ${script}가 없다`));
        } else if (!(await isExecutable(file))) {
          diagnostics.push(
            report(`${event} hook 스크립트 ${script}에 실행 권한이 없다 (chmod +x)`),
          );
        }
      }
    }
  }
  return diagnostics;
}
