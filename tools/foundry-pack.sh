#!/usr/bin/env bash
set -euo pipefail

action="${1:-}"
if [[ "$action" != "pack" && "$action" != "unpack" ]]; then
  echo "Usage: tools/foundry-pack.sh <pack|unpack>" >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
node "$repo_root/tools/foundry-pack.cjs" "$action"
