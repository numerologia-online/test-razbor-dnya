#!/usr/bin/env python3
"""Guarded FTPS publisher for reviewed Red Flag JSON only.
Never edits Telegram, auth, payments, or the site frontend.
"""
import ftplib
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import ssl
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "release/redflag/manifest.json"
SOURCE_PREFIX = "release/redflag/data/redflag/"
TARGET_PREFIX = "data/redflag/"
SITE = "xn--c1adkkdfjbp1a4l.online"
HOST = "server172.hosting.reg.ru"
MAX_FILE = 2_000_000
MAX_FILES = 800


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def prepare():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("version") != 1 or not isinstance(manifest.get("files"), list):
        raise ValueError("Invalid Red Flag release manifest")
    entries = manifest["files"]
    if len(entries) > MAX_FILES:
        raise ValueError("Too many files in one release")
    ready = []
    targets = set()
    for item in entries:
        if not isinstance(item, dict):
            raise ValueError("Manifest entry is not an object")
        source = item.get("source")
        target = item.get("target")
        oldhash = item.get("previous_sha256")
        if not isinstance(source, str) or not source.startswith(SOURCE_PREFIX):
            raise ValueError("Source outside Red Flag directory")
        if not isinstance(target, str) or not target.startswith(TARGET_PREFIX):
            raise ValueError("Target outside Red Flag directory")
        if target != source.removeprefix("release/redflag/"):
            raise ValueError("Source and target do not match")
        if target in targets:
            raise ValueError("Duplicate target in release")
        targets.add(target)
        if any(x in ("", ".", "..") for x in PurePosixPath(target).parts):
            raise ValueError("Unsafe target path")
        if not target.endswith((".json", ".jsonl")):
            raise ValueError("Only JSON or JSONL is allowed")
        if oldhash is not None and (not isinstance(oldhash, str) or re.fullmatch(r"[0-9a-f]{64}", oldhash) is None):
            raise ValueError("Invalid previous sha256")
        file_path = ROOT / source
        if not file_path.is_file() or not file_path.resolve().is_relative_to(ROOT.resolve()):
            raise ValueError("Release source file is missing or unsafe")
        data = file_path.read_bytes()
        if not data or len(data) > MAX_FILE:
            raise ValueError("Invalid release file size: " + source)
        text = data.decode("utf-8")
        if target.endswith(".jsonl"):
            lines = [line for line in text.splitlines() if line.strip()]
            if not lines:
                raise ValueError("Empty JSONL file: " + source)
            for line in lines:
                json.loads(line)
        else:
            json.loads(text)
        ready.append((target, data, oldhash))
    return ready


def get(ftp, remote):
    buf = io.BytesIO()
    try:
        ftp.retrbinary("RETR " + remote, buf.write)
    except ftplib.error_perm as exc:
        if str(exc).startswith("550"):
            return None
        raise
    return buf.getvalue()


def mkdirs(ftp, path):
    p = ""
    for part in PurePosixPath(path).parts:
        if part == "/":
            continue
        p += "/" + part
        try:
            ftp.mkd(p)
        except ftplib.error_perm:
            original = ftp.pwd()
            ftp.cwd(p)
            ftp.cwd(original)


def put(ftp, remote, contents):
    mkdirs(ftp, str(PurePosixPath(remote).parent))
    ftp.storbinary("STOR " + remote, io.BytesIO(contents))
    if get(ftp, remote) != contents:
        raise RuntimeError("FTPS readback mismatch for " + remote)


def main():
    release = prepare()
    if "--validate-only" in sys.argv:
        print("REDFLAG_MANIFEST_VALID, files:", len(release), flush=True)
        return
    if not release:
        raise ValueError("No approved Red Flag files to publish")
    user, password = os.environ.get("REG_FTP_USER"), os.environ.get("REG_FTP_PASSWORD")
    if not user or not password:
        raise RuntimeError("Missing REG_FTP_USER or REG_FTP_PASSWORD repository secrets")
    ftp = ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=30)
    ftp.connect(HOST, 21)
    ftp.login(user, password)
    ftp.prot_p()
    home = ftp.pwd().rstrip("/")
    webroot = home + "/www/" + SITE + "/"
    backuproot = home + "/site-safeguard-backups/redflag-public-" + os.environ.get("GITHUB_RUN_ID", str(int(time.time())))
    old = {}
    touched = []
    try:
        changes = []
        for target, payload, expected in release:
            before = get(ftp, webroot + target)
            old[target] = before
            if before == payload:
                continue
            if before is None:
                if expected is not None:
                    raise RuntimeError("Production drift: expected existing file " + target)
            elif expected is None or sha256(before) != expected:
                raise RuntimeError("Production drift; refusing overwrite: " + target)
            changes.append((target, payload))
        if not changes:
            print("REDFLAG_ALREADY_CURRENT", flush=True)
            return
        mkdirs(ftp, backuproot)
        for i, (target, _payload) in enumerate(changes):
            if old[target] is not None:
                put(ftp, backuproot + "/" + str(i) + ".bak", old[target])
        try:
            for target, payload in changes:
                touched.append(target)
                put(ftp, webroot + target, payload)
            print("REDFLAG_PUBLISHED", json.dumps({"files": len(changes), "backup": backuproot.rsplit("/", 1)[-1]}), flush=True)
        except BaseException:
            for target in reversed(touched):
                try:
                    if old[target] is None:
                        ftp.delete(webroot + target)
                    else:
                        put(ftp, webroot + target, old[target])
                except Exception:
                    print("ROLLBACK_NEEDS_ATTENTION: " + target, file=sys.stderr, flush=True)
            raise
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


if __name__ == "__main__":
    main()
