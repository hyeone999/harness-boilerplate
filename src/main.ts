import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { doctor, lint } from "./commands/check.js";
import { init, InitError, type InitResult } from "./commands/init.js";
import { formatDiagnostics, sortDiagnostics, summarize } from "./lib/diagnostic.js";
import type { Diagnostic } from "./lib/diagnostic.js";
import { PACKAGE_ROOT } from "./lib/paths.js";

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;

const HELP = `harness — Claude Code 작업 하네스 설치·검사

사용법
  harness init [dir]     하네스를 dir(기본: 현재 디렉터리)에 설치한다
  harness doctor [dir]   하네스를 적용한 프로젝트의 설정 정합성을 검사한다
  harness lint [dir]     보일러플레이트 원본의 정합성을 검사한다 (CI용)

옵션
  --force       init: 내용이 다른 기존 파일을 덮어쓴다
  --dry-run     init: 바꿀 내용만 보여준다
  --json        doctor·lint: 결과를 JSON으로 출력한다
  --strict      doctor·lint: 경고도 실패로 친다
  -h, --help    도움말
  -v, --version 버전

종료 코드: 0 통과, 1 검사 실패·충돌, 2 사용법 오류`;

function version(): string {
  const pkg: unknown = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"));
  return typeof pkg === "object" &&
    pkg !== null &&
    "version" in pkg &&
    typeof pkg.version === "string"
    ? pkg.version
    : "unknown";
}

function isDirectory(dir: string): boolean {
  return statSync(dir, { throwIfNoEntry: false })?.isDirectory() ?? false;
}

const ACTION_LABEL = {
  create: "추가",
  overwrite: "덮어씀",
  unchanged: "같음",
  conflict: "충돌",
} as const;

function printInit(result: InitResult, target: string, dryRun: boolean): number {
  const changed = result.files.filter((f) => f.action !== "unchanged");
  for (const f of changed) console.log(`  ${ACTION_LABEL[f.action]}  ${f.file}`);
  if (result.settings !== "unchanged") {
    console.log(`  ${result.settings === "create" ? "추가" : "병합"}  .claude/settings.json`);
  }

  const conflicts = result.files.filter((f) => f.action === "conflict");
  if (conflicts.length > 0) {
    console.error(
      `\n내용이 다른 파일이 ${conflicts.length}개 있어 아무것도 쓰지 않았다. 차이를 확인한 뒤 --force로 덮어쓴다.`,
    );
    return EXIT_FAILED;
  }
  if (dryRun) {
    console.log("\n--dry-run: 아무것도 쓰지 않았다.");
    return EXIT_OK;
  }
  if (changed.length === 0 && result.settings === "unchanged") {
    console.log("이미 최신이다.");
  }
  console.log(`
다음 단계 — ${target}에서 Claude Code를 열고:
  /setup-harness  (보일러플레이트 경로: ${PACKAGE_ROOT})
설정이 끝나면 harness doctor로 확인한다.`);
  return EXIT_OK;
}

function printDiagnostics(diagnostics: readonly Diagnostic[], json: boolean, strict: boolean) {
  const summary = summarize(diagnostics);
  if (json) {
    console.log(JSON.stringify({ diagnostics: sortDiagnostics(diagnostics), summary }, null, 2));
  } else {
    console.log(formatDiagnostics(diagnostics));
  }
  return summary.errors > 0 || (strict && summary.warnings > 0) ? EXIT_FAILED : EXIT_OK;
}

export async function main(argv: readonly string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: {
        force: { type: "boolean", default: false },
        "dry-run": { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        strict: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
    });
  } catch (error) {
    console.error(`${(error as Error).message}\n\n${HELP}`);
    return EXIT_USAGE;
  }

  const { values, positionals } = parsed;
  if (values.version) {
    console.log(version());
    return EXIT_OK;
  }
  const [command, dir = ".", ...rest] = positionals;
  if (values.help || command === undefined) {
    console.log(HELP);
    return values.help ? EXIT_OK : EXIT_USAGE;
  }
  if (rest.length > 0) {
    console.error(`인자가 너무 많다: ${rest.join(" ")}\n\n${HELP}`);
    return EXIT_USAGE;
  }
  const root = path.resolve(dir);
  if (!isDirectory(root)) {
    console.error(`디렉터리가 아니다: ${root}`);
    return EXIT_USAGE;
  }

  switch (command) {
    case "init":
      try {
        const result = await init(root, { force: values.force, dryRun: values["dry-run"] });
        return printInit(result, root, values["dry-run"]);
      } catch (error) {
        if (error instanceof InitError) {
          console.error(error.message);
          return EXIT_FAILED;
        }
        throw error;
      }
    case "doctor":
      return printDiagnostics(await doctor(root), values.json, values.strict);
    case "lint":
      return printDiagnostics(await lint(root), values.json, values.strict);
    default:
      console.error(`알 수 없는 명령: ${command}\n\n${HELP}`);
      return EXIT_USAGE;
  }
}
