import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 패키지 루트 (`.claude/`, `presets/`, `templates/`가 있는 곳).
 * 이 파일은 src/lib/paths.ts와 dist/lib/paths.js 모두 루트에서 두 단계 아래에 있다.
 */
export const PACKAGE_ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
