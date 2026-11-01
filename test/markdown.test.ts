import { describe, expect, it } from "vitest";

import {
  findPlaceholders,
  findSettingRefs,
  parseFrontmatter,
  parseHarnessSettings,
  resolveRef,
} from "../src/lib/markdown.js";

const SETTINGS = `# 프로젝트

다른 절의 표는 설정이 아니다.

| 항목 | 값 |
|---|---|
| 바깥 | x |

## 하네스 설정

### 저장소

| 항목 | 값 |
|---|---|
| 기본 브랜치 | main |
| 소스 확장자 | \`\\.(ts\\|tsx)$\` |

\`\`\`md
## 코드 블록 안의 제목은 절을 끝내지 않는다
| 블록 | 안 |
\`\`\`

### 아키텍처

| 역할 | 위치 |
|:--|--:|
| 아이콘 | src/icons |

### 고유 규칙

- 한 줄

## 다음 절

| 밖 | 값 |
|---|---|
| 이후 | y |
`;

describe("parseHarnessSettings", () => {
  const settings = parseHarnessSettings(SETTINGS);

  it("하네스 설정 절이 없으면 undefined를 돌려준다", () => {
    expect(parseHarnessSettings("# 제목\n\n## 다른 절\n")).toBeUndefined();
  });

  it("절 안의 표 행만 키로 읽고 머리글 행은 건너뛴다", () => {
    expect(settings?.rows.map((r) => [r.section, r.key])).toEqual([
      ["저장소", "기본 브랜치"],
      ["저장소", "소스 확장자"],
      ["아키텍처", "아이콘"],
    ]);
  });

  it("셀 안의 이스케이프된 파이프를 값으로 되살린다", () => {
    expect(settings?.rows.find((r) => r.key === "소스 확장자")?.value).toBe("`\\.(ts|tsx)$`");
  });

  it("코드 블록 안의 제목·표는 무시한다", () => {
    expect(settings?.rows.some((r) => r.key === "블록")).toBe(false);
    expect(settings?.sections.has("고유 규칙")).toBe(true);
  });

  it("행의 줄 번호를 1부터 센다", () => {
    expect(settings?.rows[0]?.line).toBe(
      SETTINGS.split("\n").indexOf("| 기본 브랜치 | main |") + 1,
    );
  });
});

describe("findSettingRefs / resolveRef", () => {
  const settings = parseHarnessSettings(SETTINGS);
  if (settings === undefined) throw new Error("fixture가 깨졌다");

  const resolve = (text: string) => {
    const [ref] = findSettingRefs(text);
    if (ref === undefined) throw new Error(`참조가 없다: ${text}`);
    return resolveRef(ref, settings);
  };

  it("표의 키를 찾는다", () => {
    expect(resolve("`{설정:기본 브랜치}`")).toBe("ok");
  });

  it("소절 이름도 참조로 인정한다", () => {
    expect(resolve("{설정:고유 규칙}")).toBe("ok");
  });

  it("소절 → 키 형식은 그 소절 안에서만 찾는다", () => {
    expect(resolve("{설정:아키텍처 → 아이콘}")).toBe("ok");
    expect(resolve("{설정:저장소 → 아이콘}")).toBe("missing-key");
    expect(resolve("{설정:없는 소절 → 아이콘}")).toBe("missing-section");
  });

  it("없는 키는 missing-key", () => {
    expect(resolve("{설정:앱 ID}")).toBe("missing-key");
  });

  it("표기 설명용 {설정:항목}·{설정:...}은 참조로 세지 않는다", () => {
    expect(findSettingRefs("`{설정:항목}`으로 표기한다")).toEqual([]);
    expect(findSettingRefs("`{설정:...}` 참조를 검사한다")).toEqual([]);
  });

  it("한 줄의 참조를 모두 찾고 줄 번호를 붙인다", () => {
    const refs = findSettingRefs("첫 줄\n{설정:a}와 {설정:b → c}");
    expect(refs).toEqual([
      { raw: "{설정:a}", key: "a", line: 2 },
      { raw: "{설정:b → c}", section: "b", key: "c", line: 2 },
    ]);
  });
});

describe("parseFrontmatter", () => {
  it("첫 줄의 --- 블록에서 key: value를 읽는다", () => {
    const fm = parseFrontmatter("---\nname: verify\ndescription: 검증할 때: 호출\n---\n본문");
    expect(fm?.data.get("name")).toBe("verify");
    expect(fm?.data.get("description")).toBe("검증할 때: 호출");
  });

  it("닫는 ---가 없거나 첫 줄이 아니면 undefined", () => {
    expect(parseFrontmatter("---\nname: x\n")).toBeUndefined();
    expect(parseFrontmatter("\n---\nname: x\n---\n")).toBeUndefined();
  });
});

describe("findPlaceholders", () => {
  it("채워지지 않은 {{NAME}}을 찾는다", () => {
    expect(findPlaceholders("| 기본 브랜치 | {{BASE_BRANCH}} / {{ PM }} |")).toEqual([
      "BASE_BRANCH",
      "PM",
    ]);
  });

  it("GitHub Actions 표현식은 제외한다", () => {
    expect(findPlaceholders("group: ci-${{ github.ref }}")).toEqual([]);
    expect(findPlaceholders("${{ SECRETS_TOKEN }}")).toEqual([]);
  });
});
