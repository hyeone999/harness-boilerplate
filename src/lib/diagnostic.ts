export type Severity = "error" | "warning";

export type CheckId =
  | "harness-section"
  | "placeholder"
  | "empty-value"
  | "duplicate-key"
  | "setting-ref"
  | "frontmatter"
  | "hook"
  | "preset-source"
  | "ui-verify-method"
  | "stack-rules";

export interface Diagnostic {
  readonly check: CheckId;
  readonly severity: Severity;
  /** 검사 루트 기준 상대 경로 (POSIX 구분자) */
  readonly file: string;
  /** 1부터 시작. 파일 단위 진단이면 없다 */
  readonly line?: number;
  readonly message: string;
}

export interface Summary {
  readonly errors: number;
  readonly warnings: number;
}

export function summarize(diagnostics: readonly Diagnostic[]): Summary {
  let errors = 0;
  let warnings = 0;
  for (const d of diagnostics) {
    if (d.severity === "error") errors++;
    else warnings++;
  }
  return { errors, warnings };
}

/** 파일 → 줄 → 검사 순으로 정렬해 같은 파일의 진단이 모여 보이게 한다. */
export function sortDiagnostics(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      (a.line ?? 0) - (b.line ?? 0) ||
      a.check.localeCompare(b.check),
  );
}

export function formatDiagnostics(diagnostics: readonly Diagnostic[]): string {
  const lines = sortDiagnostics(diagnostics).map((d) => {
    const location = d.line === undefined ? d.file : `${d.file}:${d.line}`;
    return `${location}  ${d.severity.padEnd(7)}  ${d.message}  [${d.check}]`;
  });
  const { errors, warnings } = summarize(diagnostics);
  lines.push(`${errors} error(s), ${warnings} warning(s)`);
  return lines.join("\n");
}
