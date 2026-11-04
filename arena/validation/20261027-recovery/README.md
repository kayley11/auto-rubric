# One-click recovery

Website: https://auto-rubric.kayley1026lzt.chatgpt.site

After logging into the Mac, double-click `启动AutoRubric.command`. It restores the existing protected backend and tunnel, registers the current connection and reports READY after checking the website. The supervisor continues after the terminal closes. It does not install a login item or rerun model jobs.

## What was verified

| Check | Observed result |
| --- | --- |
| First launch and repeated launch | Website online; repeated launch reused the same supervisor and tunnel. |
| Tunnel address changed | The supervisor registered the replacement address; the public URL and deployed Site version stayed unchanged. |
| Backend and recovery supervisor both stopped | A single launcher call restored the backend and a new tunnel. This simulated process loss after reboot; the computer itself was not rebooted. |
| Existing accounts | The evaluation account could read its existing runs. The review account retained review access and could not start model jobs. |
| Existing session | An authenticated session remained valid after backend restart. |
| Local services offline | The public page and all 24 published interviews remained available; new writes stayed restricted. |
| Preservation | Five private configuration/account/run files, 73 previous study/protected files and 13 complete deployment-check outputs matched their saved hashes. |
| Secret scan | No existing API key, login password, password hash, session secret or bridge secret was found in the published archive or changed source/validation files. |

The first sign-in check immediately after a tunnel change did not pass; a fresh check succeeded with the unchanged credentials. Its initial HTTP status was not retained, so no cause is assigned. The subsequent full recovery sequence passed, including both accounts. A connection can still take time to settle after a tunnel restart.

## Automated checks

- 969 Python tests passed with model access disabled; local loopback test servers were allowed.
- 18 gateway/presentation tests and four original Sites-contract tests passed.
- Both frontend builds, Ruff, shell syntax checks and Git whitespace checks passed. Production dependency audit: zero vulnerabilities.
- No new model calls or human ratings were made. Clinical references and candidate information requirements remain **awaiting confirmation**.

Site version 3, source commit `de238f8dc1d2e5300c7ff80a29cc5a84e413e5a5`, deployed successfully. Only connection-address and lease metadata use the managed D1 table; accounts and evaluation records stay local.

Evidence: [verification.json](verification.json) · [complete recovery-check output](live-checks.txt) · [中文使用教程](../../hosting/USAGE_CN.md).
