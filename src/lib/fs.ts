import { access, constants, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SKIPPED_DIRS = new Set(["node_modules", ".git", "dist"]);

export async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export async function isExecutable(file: string): Promise<boolean> {
  try {
    await access(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readText(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (isErrnoException(error) && error.code === "ENOENT") return undefined;
    throw error;
  }
}

/** dir 아래 모든 파일의 절대 경로를 정렬해 돌려준다. dir이 없으면 빈 배열. */
export async function walkFiles(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath, e.name))
    .filter(
      (file) =>
        !path
          .relative(dir, file)
          .split(path.sep)
          .some((s) => SKIPPED_DIRS.has(s)),
    )
    .sort();
}

/** 진단에 쓸 경로. root 기준 상대 경로를 POSIX 구분자로 바꾼다. */
export function displayPath(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join("/");
}

export function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
