#!/bin/bash
# Read 도구로 큰 텍스트 파일을 범위 없이 읽으면 막는다. offset/limit을 주면 통과한다.
MAX_LINES=300

input=$(cat)
if [ "$(jq -r '(.tool_input.offset // .tool_input.limit // empty) | tostring' <<<"$input")" != "" ]; then
  exit 0
fi

file=$(jq -r '.tool_input.file_path // empty' <<<"$input")
[ -f "$file" ] || exit 0
grep -Iq . "$file" 2>/dev/null || exit 0 # 바이너리(이미지·PDF)는 제외

lines=$(wc -l <"$file" | tr -d ' ')
[ "$lines" -le "$MAX_LINES" ] && exit 0

jq -n --arg reason "${file##*/} 파일이 ${lines}줄이라 통째로 읽지 않는다. grep -n으로 위치를 찾은 뒤 offset/limit으로 필요한 구간만 읽는다." \
  '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
