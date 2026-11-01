import { readdir } from "node:fs/promises";
import path from "node:path";

import type { Diagnostic } from "../lib/diagnostic.js";
import { exists } from "../lib/fs.js";

const METHOD_FILE = ".claude/skills/ui-verify/method.md";
const STACK_DIR = ".claude/skills/code-review-rules/stack";

/** /setup-harness가 프리셋에서 복사해야 하는 파일. 없으면 해당 단계가 "setup을 먼저 하라"며 멈춘다. */
export async function checkPresetApplied(root: string): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  if (!(await exists(path.join(root, METHOD_FILE)))) {
    diagnostics.push({
      check: "ui-verify-method",
      severity: "warning",
      file: METHOD_FILE,
      message: "UI 검증 방법이 없다. /setup-harness가 프리셋의 method.md를 복사한다",
    });
  }

  const stackDir = path.join(root, STACK_DIR);
  const stackRules = (await exists(stackDir))
    ? (await readdir(stackDir)).filter((name) => name.endsWith(".md"))
    : [];
  if (stackRules.length === 0) {
    diagnostics.push({
      check: "stack-rules",
      severity: "warning",
      file: STACK_DIR,
      message: "스택 규칙이 없다. 리뷰가 스택별 체크를 건너뛴다",
    });
  }

  return diagnostics;
}
