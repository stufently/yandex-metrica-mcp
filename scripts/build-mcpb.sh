#!/usr/bin/env bash
# Build dist-mcpb/yandex-metrica-mcp-<package.json version>.mcpb.
# Single entry point for local builds and CI. Installs nothing on the host:
# compile, production install, and `mcpb pack` all run in node:24.21.0-slim
# as the current uid. Version is stamped from package.json; it is not stored
# in mcpb/manifest.json. Tool names and descriptions are copied from a live
# tools/list of the staged server so the manifest cannot drift from the code.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

IMAGE=node:24.21.0-slim
MCPB_CLI=@anthropic-ai/mcpb@2.1.2
MAX_BYTES=$((20 * 1024 * 1024))
UID_GID="$(id -u):$(id -g)"
VERSION="$(python3 -c 'import json; print(json.load(open("package.json"))["version"])')"
OUT_DIR="dist-mcpb"
OUT_FILE="$OUT_DIR/yandex-metrica-mcp-${VERSION}.mcpb"

if [ -z "$VERSION" ]; then
  echo "package.json version is empty" >&2
  exit 1
fi

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

build="$work/build"
stage="$work/stage"
mkdir -p "$build" "$stage"

cp package.json package-lock.json tsconfig.json "$build/"
cp -a src "$build/src"

docker run --rm -u "$UID_GID" -e HOME=/tmp \
  -v "$build":/app -w /app "$IMAGE" \
  sh -c 'npm ci --no-audit --no-fund && npm run build && npm prune --omit=dev --no-audit --no-fund'

cp "$build/package.json" "$stage/package.json"
cp -a "$build/dist" "$stage/dist"
cp -a "$build/node_modules" "$stage/node_modules"
rm -rf "$stage/node_modules/.cache"

python3 scripts/list-mcp-tools.py \
  docker run --rm -i --network none -u "$UID_GID" -e HOME=/tmp \
  -e YANDEX_METRICA_TOKEN=dummy \
  -v "$stage":/app:ro -w /app \
  "$IMAGE" node dist/index.js \
  >"$work/tools.json"

python3 - "$VERSION" "$work/tools.json" mcpb/manifest.json "$stage/manifest.json" <<'PY'
import json
import pathlib
import sys

version, tools_path, src, dest = sys.argv[1:5]
manifest = json.loads(pathlib.Path(src).read_text(encoding="utf-8"))
if "version" in manifest:
    sys.exit("mcpb/manifest.json must not store version; the build stamps it from package.json")
tools = json.loads(pathlib.Path(tools_path).read_text(encoding="utf-8"))
names = [t["name"] for t in tools]
if not names or len(names) != len(set(names)):
    sys.exit("tool list is empty or has duplicate names")
manifest["version"] = version
manifest["tools"] = [
    {"name": t["name"], "description": t.get("description") or ""} for t in tools
]
manifest.pop("tools_generated", None)
pathlib.Path(dest).write_text(
    json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
)
PY

docker run --rm -u "$UID_GID" -e HOME=/tmp \
  -v "$stage":/work:ro \
  -v "$PWD/$OUT_DIR":/out \
  "$IMAGE" \
  npx -y "$MCPB_CLI" pack /work "/out/yandex-metrica-mcp-${VERSION}.mcpb"

python3 - "$OUT_FILE" "$MAX_BYTES" <<'PY'
import sys
import zipfile

path, limit = sys.argv[1], int(sys.argv[2])
with zipfile.ZipFile(path) as z:
    names = z.namelist()
bad = []
for name in names:
    base = name.rstrip("/").split("/")[-1]
    if name.startswith("src/") or name.startswith("tests/") or name.startswith(".git/"):
        bad.append(name)
    elif "/__pycache__/" in name or name.startswith("__pycache__/"):
        bad.append(name)
    elif base.startswith(".env"):
        bad.append(name)
    elif name.endswith(".ts") and not name.startswith("node_modules/"):
        bad.append(name)
if "manifest.json" not in names:
    bad.append("missing manifest.json at archive root")
if "dist/index.js" not in names:
    bad.append("missing dist/index.js")
if "package.json" not in names:
    bad.append("missing package.json")
if not any(name.startswith("node_modules/") for name in names):
    bad.append("missing production node_modules")
if bad:
    sys.exit("bundle has forbidden or missing files:\n" + "\n".join(bad[:40]))
PY

size="$(stat -c %s "$OUT_FILE")"
if [ "$size" -gt "$MAX_BYTES" ]; then
  echo "$OUT_FILE is $size bytes, limit $MAX_BYTES" >&2
  exit 1
fi

echo "built $OUT_FILE ($size bytes)"
