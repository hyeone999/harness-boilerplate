import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach } from "vitest";

const created: string[] = [];

afterEach(async () => {
  await Promise.all(created.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

/** 파일 맵으로 임시 디렉터리를 만든다. 테스트가 끝나면 지운다. */
export async function fixture(files: Record<string, string> = {}): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "harness-test-"));
  created.push(root);
  await Promise.all(
    Object.entries(files).map(async ([file, content]) => {
      const target = path.join(root, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    }),
  );
  return root;
}

export const skill = (name: string, description = `${name} 설명`) =>
  `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`;

/** 최소한의 하네스 설정 절 */
export const harnessSection = (body: string) => `# 프로젝트\n\n## 하네스 설정\n\n${body}\n`;
