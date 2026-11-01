/**
 * 하네스 문서가 쓰는 마크다운의 작은 부분집합만 다룬다.
 * - `## 하네스 설정` 절 아래 `### 소절`과 `| 키 | 값 |` 표
 * - `{설정:이름}` / `{설정:소절 → 키}` 참조
 * - 한 줄짜리 `key: value` frontmatter
 * 범용 파서가 아니다. 하네스 문서 형식이 바뀌면 여기와 테스트를 함께 고친다.
 */

export const HARNESS_HEADING = "하네스 설정";

/** 참조 표기를 설명하려고 문서에 쓰는 예시 이름. 실제 설정 키가 아니다. */
const META_REF_NAMES = new Set(["항목", "..."]);

export interface SettingRow {
  readonly key: string;
  readonly value: string;
  readonly section: string;
  readonly line: number;
}

export interface HarnessSettings {
  /** `## 하네스 설정` 제목 줄 (1부터) */
  readonly headingLine: number;
  /** 소절 이름 → 제목 줄 */
  readonly sections: ReadonlyMap<string, number>;
  readonly rows: readonly SettingRow[];
  /** 절에 속한 줄들. [줄 번호, 내용] */
  readonly lines: readonly (readonly [number, string])[];
}

export interface SettingRef {
  readonly raw: string;
  /** `소절 → 키` 형식일 때만 있다 */
  readonly section?: string;
  readonly key: string;
  readonly line: number;
}

const FENCE = /^\s*(```|~~~)/;
const TABLE_ROW = /^\s*\|(.*)\|\s*$/;
const TABLE_SEPARATOR = /^\s*\|(\s*:?-+:?\s*\|)+\s*$/;

function splitCells(row: string): string[] {
  // GFM 표에서 셀 안의 `|`는 `\|`로 이스케이프한다
  return row.split(/(?<!\\)\|/).map((cell) => cell.trim().replaceAll("\\|", "|"));
}

export function parseHarnessSettings(text: string): HarnessSettings | undefined {
  const all = text.split(/\r?\n/);
  const start = all.findIndex((l) => new RegExp(`^##\\s+${HARNESS_HEADING}\\s*$`).test(l));
  if (start === -1) return undefined;

  const sections = new Map<string, number>();
  const rows: SettingRow[] = [];
  const lines: [number, string][] = [];
  let section = "";
  let inFence = false;

  for (let i = start + 1; i < all.length; i++) {
    const line = all[i] ?? "";
    const lineNo = i + 1;
    if (!inFence && /^##\s/.test(line)) break;
    lines.push([lineNo, line]);

    if (FENCE.test(line)) inFence = !inFence;
    if (inFence) continue;

    const heading = /^###\s+(.+?)\s*$/.exec(line);
    if (heading?.[1] !== undefined) {
      section = heading[1];
      sections.set(section, lineNo);
      continue;
    }

    const row = TABLE_ROW.exec(line);
    if (row?.[1] === undefined || TABLE_SEPARATOR.test(line)) continue;
    // 바로 다음 줄이 구분선이면 머리글 행이다
    if (TABLE_SEPARATOR.test(all[i + 1] ?? "")) continue;

    const [key = "", value = ""] = splitCells(row[1]);
    if (key !== "") rows.push({ key, value, section, line: lineNo });
  }

  return { headingLine: start + 1, sections, rows, lines };
}

export function findSettingRefs(text: string): SettingRef[] {
  const refs: SettingRef[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const match of line.matchAll(/\{설정:([^}]+)\}/g)) {
      const raw = match[0];
      const body = (match[1] ?? "").trim();
      if (META_REF_NAMES.has(body)) continue;

      const arrow = body.indexOf("→");
      if (arrow === -1) {
        refs.push({ raw, key: body, line: index + 1 });
      } else {
        refs.push({
          raw,
          section: body.slice(0, arrow).trim(),
          key: body.slice(arrow + 1).trim(),
          line: index + 1,
        });
      }
    }
  });
  return refs;
}

export type RefResolution = "ok" | "missing-section" | "missing-key";

/**
 * `{설정:키}`는 표의 키 또는 소절 이름과, `{설정:소절 → 키}`는 그 소절 안의 키와 맞아야 한다.
 */
export function resolveRef(ref: SettingRef, settings: HarnessSettings): RefResolution {
  if (ref.section === undefined) {
    const found = settings.rows.some((r) => r.key === ref.key) || settings.sections.has(ref.key);
    return found ? "ok" : "missing-key";
  }
  if (!settings.sections.has(ref.section)) return "missing-section";
  const { section } = ref;
  return settings.rows.some((r) => r.section === section && r.key === ref.key)
    ? "ok"
    : "missing-key";
}

export interface Frontmatter {
  readonly data: ReadonlyMap<string, string>;
}

/** 파일 첫 줄이 `---`일 때만 frontmatter로 본다. 닫는 `---`가 없으면 undefined. */
export function parseFrontmatter(text: string): Frontmatter | undefined {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return undefined;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end === -1) return undefined;

  const data = new Map<string, string>();
  for (const line of lines.slice(1, end)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (match?.[1] !== undefined) data.set(match[1], (match[2] ?? "").trim());
  }
  return { data };
}

/** 채워지지 않은 `{{NAME}}` 자리. GitHub Actions의 `${{ ... }}`는 제외한다. */
export function findPlaceholders(line: string): string[] {
  return [...line.matchAll(/(?<!\$)\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}/g)].map((m) => m[1] ?? "");
}
