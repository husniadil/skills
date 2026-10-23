#!/usr/bin/env bash
# Generate or edit one image through the Codex CLI's built-in image tool.
#
# The image is made on the ChatGPT plan Codex is signed in with, so no OpenAI
# API key is involved. Codex saves every image under
# $CODEX_HOME/generated_images/<thread id>/, and this copies the one from its
# own run to --out.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: generate.sh --out <file.png> [options] <prompt | ->

  <prompt>              The full image prompt. - reads it from stdin.

Options:
  --out <file.png>      Where the image goes. Must end in .png and must not
                        exist yet. Its directory is created if missing.
  --image <file>        Attach an image: an edit target or a reference. The
                        prompt says which. Repeatable.
  --transparent         Ask the tool for a transparent background.
  --model <slug>        The Codex model that relays the prompt to the tool.
                        Default: Codex's own default.

Needs codex signed in (codex login) and jq.
EOF
}

out=""
prompt=""
have_prompt=0
transparent=0
model=""
images=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out) out="$2"; shift 2 ;;
    --image) images+=("$2"); shift 2 ;;
    --transparent) transparent=1; shift ;;
    --model) model="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    -) prompt="$(cat)"; have_prompt=1; shift ;;
    -*) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
    *)
      if [[ "$have_prompt" -eq 1 ]]; then echo "more than one prompt given" >&2; exit 2; fi
      prompt="$1"; have_prompt=1; shift ;;
  esac
done

[[ -n "$out" ]] || { echo "--out is required" >&2; usage >&2; exit 2; }
[[ "$prompt" =~ [^[:space:]] ]] || { echo "the prompt is empty" >&2; usage >&2; exit 2; }
# The tool always writes PNG, so any other extension would mislabel the file.
[[ "$out" == *.png ]] || { echo "--out must end in .png: $out" >&2; exit 2; }
[[ ! -e "$out" ]] || { echo "--out already exists, pick another name: $out" >&2; exit 2; }

for tool in codex jq; do
  command -v "$tool" >/dev/null || { echo "$tool is not on PATH" >&2; exit 1; }
done

# Codex runs from an empty directory, so attachments need absolute paths.
abs_images=()
for img in "${images[@]+"${images[@]}"}"; do
  [[ -f "$img" ]] || { echo "--image is not a file: $img" >&2; exit 2; }
  abs_images+=("$(cd "$(dirname "$img")" && pwd)/$(basename "$img")")
done

work="$(mktemp -d "${TMPDIR:-/tmp}/codex-imagegen.XXXXXX")"
trap 'rm -rf "$work"' EXIT
mkdir "$work/cwd"

if [[ "$transparent" -eq 1 ]]; then background=true; else background=false; fi
if [[ ${#abs_images[@]} -gt 0 ]]; then
  attached="- The attached images are edit targets or references, as the prompt says."
else
  attached="- No image is attached. Generate a new one."
fi

# --ignore-user-config keeps the user's MCP servers, hooks and instructions
# file out of a session that only makes one tool call. --ephemeral keeps the
# run out of their Codex session history. The image is saved either way.
args=(exec --json --ephemeral --skip-git-repo-check --ignore-user-config
  --sandbox read-only -C "$work/cwd" -c 'model_reasoning_effort="low"')
[[ -n "$model" ]] && args+=(-m "$model")
for img in "${abs_images[@]+"${abs_images[@]}"}"; do args+=(-i "$img"); done

echo "Generating with codex…" >&2
started=$SECONDS
# The prompt goes in on stdin: -i takes every argument after it as a file.
set +e
codex "${args[@]}" > "$work/events.jsonl" 2> "$work/codex.err" <<EOF
Call your built-in image generation tool exactly once, then stop.

- Pass the prompt below to the tool as written. Do not add, drop or reword details.
- Set transparent_background to $background.
$attached
- Do not run shell commands, read files or load skills.
- After the call, reply with the single word "done", or with the tool's error if it failed.

Prompt:
$prompt
EOF
code=$?
set -e

thread="$(jq -r 'select(.type == "thread.started") | .thread_id' "$work/events.jsonl" 2>/dev/null | head -n 1)"
reply="$(jq -r 'select(.type == "item.completed" and .item.type == "agent_message") | .item.text' "$work/events.jsonl" 2>/dev/null | tail -n 1)"
failure="$(jq -r 'select(.type == "turn.failed") | .error.message' "$work/events.jsonl" 2>/dev/null | tail -n 1)"

if [[ "$code" -ne 0 || -n "$failure" || -z "$thread" ]]; then
  echo "codex exec failed (exit $code)" >&2
  [[ -n "$failure" ]] && echo "$failure" >&2
  grep -v -E '^Reading (prompt|additional input) from stdin' "$work/codex.err" | tail -n 20 >&2 || true
  exit 1
fi

dir="${CODEX_HOME:-$HOME/.codex}/generated_images/$thread"
made=()
if [[ -d "$dir" ]]; then
  while IFS= read -r f; do made+=("$f"); done < <(ls -t "$dir"/*.png 2>/dev/null)
fi

if [[ ${#made[@]} -eq 0 ]]; then
  echo "codex finished without an image. Its reply:" >&2
  echo "${reply:-<none>}" >&2
  exit 1
fi
if [[ ${#made[@]} -gt 1 ]]; then
  echo "codex made ${#made[@]} images where one was asked for. Copying the newest, the others stay in $dir" >&2
fi

mkdir -p "$(dirname "$out")"
cp "${made[0]}" "$out"
echo "Done in $(( SECONDS - started )) s. Codex's copy: ${made[0]}" >&2
echo "$out"
