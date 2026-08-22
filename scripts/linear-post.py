#!/usr/bin/env python3
"""Post a comment (with image uploads) to a Linear issue in one call.

Purpose: keep Linear attachment plumbing OUT of model context (orchestrate skill
rule 3b, Scott's ruling 2026-08-22). One invocation uploads every image, rewrites
placeholders, posts the comment, and optionally flips the issue state — printing
only a short summary.

Usage:
    scripts/linear-post.py ISSUE-KEY COMMENT-FILE [--state "State Name"] [IMG ...]

    ISSUE-KEY     e.g. SC-182
    COMMENT-FILE  markdown body; `{{IMG:basename.png}}` placeholders are replaced
                  with `![basename](assetUrl)` after upload. Images passed on the
                  command line but not referenced by a placeholder are appended at
                  the end of the body.
    --state NAME  optionally move the issue to the named workflow state
                  (exact name match against the issue's team states, e.g.
                  "In Progress", "Awaiting"). Labels are NOT handled here — use
                  the MCP save_issue (labels REPLACE the full set).

Auth: LINEAR_API_KEY env var, or first line of ~/.config/linear/api_key.
Exit non-zero with a one-line error on any failure (nothing partial is retried).
"""
import json
import mimetypes
import os
import sys
import urllib.request

API = "https://api.linear.app/graphql"


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def api_key() -> str:
    key = os.environ.get("LINEAR_API_KEY", "").strip()
    if not key:
        path = os.path.expanduser("~/.config/linear/api_key")
        if os.path.exists(path):
            with open(path) as fh:
                key = fh.readline().strip()
    if not key:
        die("no LINEAR_API_KEY env var and no ~/.config/linear/api_key")
    return key


def gql(key: str, query: str, variables: dict) -> dict:
    req = urllib.request.Request(
        API,
        data=json.dumps({"query": query, "variables": variables}).encode(),
        headers={"Content-Type": "application/json", "Authorization": key},
    )
    with urllib.request.urlopen(req) as resp:
        out = json.load(resp)
    if out.get("errors"):
        die(f"GraphQL: {out['errors'][0].get('message', out['errors'])}")
    return out["data"]


def upload_image(key: str, path: str) -> str:
    """Upload one file via fileUpload mutation + signed PUT; return assetUrl."""
    size = os.path.getsize(path)
    ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
    data = gql(
        key,
        """mutation($contentType: String!, $filename: String!, $size: Int!) {
             fileUpload(contentType: $contentType, filename: $filename, size: $size) {
               success
               uploadFile { uploadUrl assetUrl headers { key value } }
             }
           }""",
        {"contentType": ctype, "filename": os.path.basename(path), "size": size},
    )
    up = data["fileUpload"]
    if not up["success"]:
        die(f"fileUpload refused for {path}")
    uf = up["uploadFile"]
    headers = {h["key"]: h["value"] for h in uf["headers"]}
    headers["Content-Type"] = ctype
    with open(path, "rb") as fh:
        req = urllib.request.Request(uf["uploadUrl"], data=fh.read(), headers=headers, method="PUT")
        urllib.request.urlopen(req)
    return uf["assetUrl"]


def main() -> None:
    args = sys.argv[1:]
    if len(args) < 2:
        die("usage: linear-post.py ISSUE-KEY COMMENT-FILE [--state NAME] [IMG ...]")
    issue_key, comment_file = args[0], args[1]
    rest = args[2:]
    state_name = None
    images = []
    i = 0
    while i < len(rest):
        if rest[i] == "--state":
            if i + 1 >= len(rest):
                die("--state needs a value")
            state_name = rest[i + 1]
            i += 2
        else:
            images.append(rest[i])
            i += 1

    for img in images:
        if not os.path.exists(img):
            die(f"image not found: {img}")
    if not os.path.exists(comment_file):
        die(f"comment file not found: {comment_file}")
    with open(comment_file) as fh:
        body = fh.read()

    key = api_key()

    issue = gql(
        key,
        'query($id: String!) { issue(id: $id) { id identifier team { id } } }',
        {"id": issue_key},
    )["issue"]

    uploaded = 0
    for img in images:
        base = os.path.basename(img)
        url = upload_image(key, img)
        uploaded += 1
        placeholder = "{{IMG:" + base + "}}"
        md = f"![{os.path.splitext(base)[0]}]({url})"
        if placeholder in body:
            body = body.replace(placeholder, md)
        else:
            body = body.rstrip() + f"\n\n{md}\n"

    leftover = [ln for ln in body.splitlines() if "{{IMG:" in ln]
    if leftover:
        die(f"unresolved image placeholder(s): {leftover[0].strip()}")

    ok = gql(
        key,
        """mutation($input: CommentCreateInput!) {
             commentCreate(input: $input) { success comment { url } }
           }""",
        {"input": {"issueId": issue["id"], "body": body}},
    )["commentCreate"]
    if not ok["success"]:
        die("commentCreate failed")

    state_msg = ""
    if state_name:
        states = gql(
            key,
            'query($id: String!) { team(id: $id) { states { nodes { id name } } } }',
            {"id": issue["team"]["id"]},
        )["team"]["states"]["nodes"]
        match = [s for s in states if s["name"].lower() == state_name.lower()]
        if not match:
            die(f"no state named '{state_name}' (have: {', '.join(s['name'] for s in states)})")
        upd = gql(
            key,
            """mutation($id: String!, $input: IssueUpdateInput!) {
                 issueUpdate(id: $id, input: $input) { success }
               }""",
            {"id": issue["id"], "input": {"stateId": match[0]["id"]}},
        )["issueUpdate"]
        if not upd["success"]:
            die("issueUpdate (state) failed")
        state_msg = f", state -> {match[0]['name']}"

    print(f"OK: {issue['identifier']} comment posted ({uploaded} image(s)){state_msg}")


if __name__ == "__main__":
    main()
