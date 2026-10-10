#!/usr/bin/env python3
"""List tools from a stdio MCP server. Args are the server command, not a shell line."""

import json
import select
import subprocess
import sys
import time


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: list-mcp-tools.py CMD [ARG...]", file=sys.stderr)
        return 2
    proc = subprocess.Popen(
        sys.argv[1:],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    buf = b""
    next_id = 1

    def send(obj: dict) -> None:
        assert proc.stdin is not None
        proc.stdin.write((json.dumps(obj) + "\n").encode())
        proc.stdin.flush()

    def request(method: str, params: dict, timeout: float = 60) -> dict:
        nonlocal buf, next_id
        rid = next_id
        next_id += 1
        send({"jsonrpc": "2.0", "id": rid, "method": method, "params": params})
        deadline = time.time() + timeout
        assert proc.stdout is not None
        while time.time() < deadline:
            while b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                line = line.strip()
                if not line:
                    continue
                try:
                    msg = json.loads(line)
                except ValueError:
                    continue
                if isinstance(msg, dict) and msg.get("id") == rid and "method" not in msg:
                    if "error" in msg:
                        raise RuntimeError("%s -> error %s" % (method, msg["error"]))
                    result = msg.get("result", {})
                    if not isinstance(result, dict):
                        raise RuntimeError("%s -> result is not an object" % method)
                    return result
            ready, _, _ = select.select([proc.stdout], [], [], 1.0)
            if ready:
                chunk = proc.stdout.read1(65536)
                if not chunk:
                    err = b""
                    if proc.stderr is not None:
                        err = proc.stderr.read()
                    tail = err.decode("utf-8", "replace")[-2000:]
                    raise RuntimeError("server closed stdout during %s; stderr tail: %s" % (method, tail))
                buf += chunk
        raise RuntimeError("timeout after %ss waiting for %s" % (timeout, method))

    try:
        request(
            "initialize",
            {
                "protocolVersion": "2025-06-18",
                "capabilities": {},
                "clientInfo": {"name": "build-mcpb", "version": "1"},
            },
        )
        send({"jsonrpc": "2.0", "method": "notifications/initialized"})
        listed = request("tools/list", {}).get("tools", [])
        if not isinstance(listed, list) or not listed:
            raise RuntimeError("server listed no tools")
        tools = []
        for tool in listed:
            if not isinstance(tool, dict) or not isinstance(tool.get("name"), str):
                raise RuntimeError("tool entry missing name: %r" % (tool,))
            description = tool.get("description") or ""
            if not isinstance(description, str):
                raise RuntimeError("%s: description is not a string" % tool["name"])
            tools.append({"name": tool["name"], "description": description})
        json.dump(tools, sys.stdout, indent=2, ensure_ascii=False)
        sys.stdout.write("\n")
        return 0
    except Exception as exc:
        print("list-mcp-tools: %s" % exc, file=sys.stderr)
        return 1
    finally:
        if proc.stdin is not None:
            try:
                proc.stdin.close()
            except OSError:
                pass
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()


if __name__ == "__main__":
    sys.exit(main())
