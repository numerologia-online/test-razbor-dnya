# Red Flag → REG.RU

Only reviewed Red Flag JSON content is released from this public repository.

- Source directory: `release/redflag/data/redflag/`
- Production target directory: `data/redflag/`
- Production FTP settings remain in GitHub Actions repository secrets, **never in code**.
- This workflow runs manually; automatic publication will be enabled after one proven safe release.
- It never modifies the main site, Telegram bot, PHP authorization, accounts, or payments.

For each release, update `release/redflag/manifest.json` and add the reviewed content files:
```json
{"version":1,"files":[
  {"source":"release/redflag/data/redflag/love/published/1-2.json",
   "target":"data/redflag/love/published/1-2.json",
   "previous_sha256":"<SHA256 of current production bytes, or null only for a new file>"}
]}
```
Only JSON / JSONL files below the Red Flag prefix are accepted.
Production files are checked against the prior hash and backed up. If there is production drift or a verification failure, the release stops, and any already-updated files are rolled back.
