/**
 * `.claude/settings.json` 중 하네스가 다루는 부분(permissions.allow, hooks)만 타입으로 좁힌다.
 * 나머지 키는 건드리지 않고 그대로 보존한다.
 */

export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface HookCommand {
  readonly type: string;
  readonly command?: string;
}

export interface HookGroup {
  readonly matcher?: string;
  readonly hooks: readonly HookCommand[];
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHookCommand(value: JsonValue): value is JsonObject & HookCommand {
  return (
    isJsonObject(value) &&
    typeof value["type"] === "string" &&
    (value["command"] === undefined || typeof value["command"] === "string")
  );
}

function isHookGroup(value: JsonValue): value is JsonObject & HookGroup {
  return (
    isJsonObject(value) &&
    (value["matcher"] === undefined || typeof value["matcher"] === "string") &&
    Array.isArray(value["hooks"]) &&
    value["hooks"].every(isHookCommand)
  );
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseSettings(text: string): ParseResult<JsonObject> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: `JSON이 아니다: ${(error as Error).message}` };
  }
  if (!isJsonObject(parsed)) return { ok: false, error: "최상위 값이 객체가 아니다" };
  return { ok: true, value: parsed };
}

/** 이벤트 이름 → hook 그룹. 형식이 틀린 이벤트는 errors에 담는다. */
export function readHooks(settings: JsonObject): {
  events: Map<string, HookGroup[]>;
  errors: string[];
} {
  const events = new Map<string, HookGroup[]>();
  const errors: string[] = [];
  const hooks = settings["hooks"];
  if (hooks === undefined) return { events, errors };
  if (!isJsonObject(hooks)) return { events, errors: ["hooks가 객체가 아니다"] };

  for (const [event, groups] of Object.entries(hooks)) {
    if (Array.isArray(groups) && groups.every(isHookGroup)) {
      events.set(event, groups);
    } else {
      errors.push(`hooks.${event}는 { matcher?, hooks: [{ type, command? }] }의 배열이어야 한다`);
    }
  }
  return { events, errors };
}

function readAllow(settings: JsonObject): string[] {
  const permissions = settings["permissions"];
  if (!isJsonObject(permissions)) return [];
  const allow = permissions["allow"];
  return Array.isArray(allow) ? allow.filter((v): v is string => typeof v === "string") : [];
}

function commandsOf(groups: readonly HookGroup[]): Set<string> {
  return new Set(groups.flatMap((g) => g.hooks.flatMap((h) => h.command ?? [])));
}

/**
 * source의 permissions.allow와 hooks를 target에 합친다. target에 이미 있는 항목은 다시 넣지 않는다.
 * hook은 command 문자열이 같으면 같은 hook으로 본다.
 */
export function mergeSettings(
  target: JsonObject,
  source: JsonObject,
): { merged: JsonObject; changed: boolean } {
  const merged = structuredClone(target);
  let changed = false;

  const allow = readAllow(merged);
  const missingAllow = readAllow(source).filter((rule) => !allow.includes(rule));
  if (missingAllow.length > 0) {
    const permissions = isJsonObject(merged["permissions"]) ? merged["permissions"] : {};
    permissions["allow"] = [...allow, ...missingAllow];
    merged["permissions"] = permissions;
    changed = true;
  }

  const hooks = isJsonObject(merged["hooks"]) ? merged["hooks"] : {};
  const sourceHooks = source["hooks"];
  if (isJsonObject(sourceHooks)) {
    for (const [event, sourceGroups] of Object.entries(sourceHooks)) {
      if (!Array.isArray(sourceGroups)) continue;
      const current = hooks[event];
      const existing = Array.isArray(current) ? current : [];
      const known = commandsOf(existing.filter(isHookGroup));
      const missing = sourceGroups.filter(
        (g) =>
          isHookGroup(g) && g.hooks.some((h) => h.command !== undefined && !known.has(h.command)),
      );
      if (missing.length === 0) continue;
      hooks[event] = [...existing, ...missing];
      merged["hooks"] = hooks;
      changed = true;
    }
  }

  return { merged, changed };
}

/** command 문자열에서 `$CLAUDE_PROJECT_DIR/...`로 가리킨 스크립트 경로를 뽑는다. */
export function projectScriptPath(command: string): string | undefined {
  const match = /\$\{?CLAUDE_PROJECT_DIR\}?"?\/([^\s"']+)/.exec(command);
  return match?.[1];
}
