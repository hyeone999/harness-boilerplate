import { chmod, copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { displayPath, exists, readText, walkFiles } from "../lib/fs.js";
import { PACKAGE_ROOT } from "../lib/paths.js";
import { mergeSettings, parseSettings, readHooks } from "../lib/settings.js";

/** settings.json은 덮어쓰지 않고 합치므로 따로 다룬다. */
const COPIED_DIRS = ["commands", "skills", "hooks"] as const;
const SETTINGS = path.join(".claude", "settings.json");

export interface InitOptions {
  /** 내용이 다른 기존 파일을 덮어쓴다 */
  readonly force: boolean;
  /** 계획만 보여주고 아무것도 쓰지 않는다 */
  readonly dryRun: boolean;
  /** 테스트용. 기본은 이 패키지 루트 */
  readonly sourceRoot?: string;
}

export type FileAction = "create" | "overwrite" | "unchanged" | "conflict";

export interface PlannedFile {
  readonly file: string;
  readonly action: FileAction;
}

export interface InitResult {
  readonly files: readonly PlannedFile[];
  readonly settings: "create" | "merge" | "unchanged";
  /** 실제로 파일을 썼는가. dry-run이거나 충돌로 멈추면 false */
  readonly applied: boolean;
}

export class InitError extends Error {
  override readonly name = "InitError";
}

interface CopyPlan {
  readonly source: string;
  readonly target: string;
  readonly action: FileAction;
}

async function sameContent(a: string, b: string): Promise<boolean> {
  const [left, right] = await Promise.all([readFile(a), readFile(b)]);
  return left.equals(right);
}

async function planCopies(sourceRoot: string, targetRoot: string, force: boolean) {
  const plans: CopyPlan[] = [];
  for (const dir of COPIED_DIRS) {
    for (const source of await walkFiles(path.join(sourceRoot, ".claude", dir))) {
      const target = path.join(targetRoot, path.relative(sourceRoot, source));
      let action: FileAction = "create";
      if (await exists(target)) {
        if (await sameContent(source, target)) action = "unchanged";
        else action = force ? "overwrite" : "conflict";
      }
      plans.push({ source, target, action });
    }
  }
  return plans;
}

async function planSettings(sourceRoot: string, targetRoot: string) {
  const sourceText = await readText(path.join(sourceRoot, SETTINGS));
  const source = parseSettings(sourceText ?? "");
  if (!source.ok)
    throw new InitError(`보일러플레이트의 ${SETTINGS}를 읽을 수 없다: ${source.error}`);

  const targetText = await readText(path.join(targetRoot, SETTINGS));
  if (targetText === undefined) {
    return { action: "create" as const, content: `${JSON.stringify(source.value, null, 2)}\n` };
  }

  const target = parseSettings(targetText);
  if (!target.ok) {
    throw new InitError(`${SETTINGS}를 합칠 수 없다 (${target.error}). 직접 고친 뒤 다시 실행한다`);
  }
  const hookErrors = readHooks(target.value).errors;
  if (hookErrors.length > 0) {
    throw new InitError(`${SETTINGS}를 합칠 수 없다: ${hookErrors.join("; ")}`);
  }

  const { merged, changed } = mergeSettings(target.value, source.value);
  return changed
    ? { action: "merge" as const, content: `${JSON.stringify(merged, null, 2)}\n` }
    : { action: "unchanged" as const, content: undefined };
}

/**
 * 하네스(`.claude/commands`, `skills`, `hooks`)를 대상 프로젝트에 복사하고 settings.json을 합친다.
 * 내용이 다른 기존 파일이 하나라도 있으면 `force` 없이는 아무것도 쓰지 않는다.
 */
export async function init(targetRoot: string, options: InitOptions): Promise<InitResult> {
  const sourceRoot = path.resolve(options.sourceRoot ?? PACKAGE_ROOT);
  const target = path.resolve(targetRoot);
  if (target === sourceRoot) {
    throw new InitError("보일러플레이트 자신에게는 설치할 수 없다. 대상 프로젝트 경로를 준다");
  }

  const copies = await planCopies(sourceRoot, target, options.force);
  const settings = await planSettings(sourceRoot, target);
  const result = (applied: boolean): InitResult => ({
    files: copies.map((c) => ({ file: displayPath(target, c.target), action: c.action })),
    settings: settings.action,
    applied,
  });

  if (options.dryRun || copies.some((c) => c.action === "conflict")) return result(false);

  for (const copy of copies) {
    if (copy.action === "unchanged") continue;
    await mkdir(path.dirname(copy.target), { recursive: true });
    await copyFile(copy.source, copy.target);
    // copyFile은 플랫폼에 따라 권한을 보존하지 않는다. hook의 실행 권한을 지킨다
    await chmod(copy.target, (await stat(copy.source)).mode);
  }
  if (settings.content !== undefined) {
    await mkdir(path.join(target, ".claude"), { recursive: true });
    await writeFile(path.join(target, SETTINGS), settings.content);
  }
  return result(true);
}
