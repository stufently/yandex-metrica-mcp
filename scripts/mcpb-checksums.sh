#!/usr/bin/env bash
# Usage: bash scripts/mcpb-checksums.sh DIR SUMS
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo 'Usage: bash scripts/mcpb-checksums.sh DIR SUMS' >&2
  exit 1
fi

export LC_ALL=C
bundle_dir=$(cd -- "$1" && pwd -P)
sums_dir=$(cd -- "$(dirname -- "$2")" && pwd -P)
sums="$sums_dir/$(basename -- "$2")"

shopt -s nullglob
bundles=()
for bundle in "$bundle_dir"/*.mcpb; do
  [[ -f "$bundle" ]] || continue
  bundles+=("${bundle##*/}")
done
if [[ ${#bundles[@]} -eq 0 ]]; then
  echo "No .mcpb files found in $bundle_dir" >&2
  exit 1
fi

merged_tmp=''
bundles_tmp=''
trap 'rm -f -- "$merged_tmp" "$bundles_tmp"' EXIT
merged_tmp=$(mktemp -- "$sums.XXXXXX")
bundles_tmp=$(mktemp -- "$sums.bundles.XXXXXX")

(
  cd -- "$bundle_dir"
  sha256sum -- "${bundles[@]}" > "$bundles_tmp"
  sha256sum -c --strict -- "$bundles_tmp"
)

# GNU checksum records may start with a backslash for escaped filenames.
bundle_record='^\\?[0-9a-fA-F]{64} [ *].*\.mcpb$'
if [[ -f "$sums" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ $bundle_record ]] && continue
    # An unterminated final foreign line needs an LF before the new records.
    printf '%s\n' "$line"
  done < "$sums" > "$merged_tmp"
fi
cat -- "$bundles_tmp" >> "$merged_tmp"
mv -- "$merged_tmp" "$sums"

# Check only bundle records, since preserved archive files may be elsewhere.
(
  cd -- "$bundle_dir"
  sha256sum -c --strict -- "$bundles_tmp"
)
