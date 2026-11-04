# Public website

Public URL: https://auto-rubric.kayley1026lzt.chatgpt.site

Case review now defaults to the full 22-item review dated 4 November 2026: 345 saved answers, 6,342 numerical ratings, and explicit reasons for every unscored item. Earlier selected-item ratings remain available as a separate condition. Saved explanations, flags, plain-text output and the all-item CSV are readable online. See the [publication checks](../validation/20261104-full-rubric/README.md).

Daily use and restart instructions: [中文使用说明](USAGE_CN.md).

The [28–29 October source-case study](https://auto-rubric.kayley1026lzt.chatgpt.site/#study/cases) contains 22 published-report cases with their saved interviews, answers, item scores and repeat explanations. Each case has a full download and an unscored review copy. Case review retains the prepared cases and actual staged-interview conditions; New evaluation accepts pasted or imported user cases. Saved scores identify their selected manuscript snapshot, while the live form retains Original or Revised D3a/D5c rules. See the [case update checks](../validation/20261029-cases/README.md).

Registered Sites source: the sibling checkout `auto-rubric-public`, project `appgprj_6adfdc1603988191a795a461d19f5914`. Reuse this identity for future publication.

The existing React interface is hosted on Sites. The original Python AutoRubric engine runs on the host computer, connected through an outbound Cloudflare tunnel. No paid hosting service was opened.

- Anyone can browse the saved study and download public display copies.
- Authorised accounts can generate answers, run original or proposed scoring rules and save reviews. New evaluations and reviews are stored locally per account.
- Clinical references and candidate information requirements remain **awaiting confirmation**.
- Public display labels use generic wording. Historical study files and original raw outputs are retained unchanged.

The computer must remain awake and online for live evaluations and saving. After reboot, double-click the repository's `启动AutoRubric.command`. It reuses the existing configuration, restores the protected backend and tunnel, registers the current connection and checks the public website. The recovery supervisor continues after the terminal closes. Repeated launches reuse the same supervisor. It is a manual launcher, not a macOS login item.

Connection changes no longer require a Site deployment. A signed, timestamped registration verifies the backend with a nonce proof before updating one managed D1 row. The row contains only the tunnel address and lease metadata; it contains no accounts, API keys, passwords or clinical records. The host renews the three-minute lease every minute. An expired lease is treated as offline rather than falling back to an old address. The existing bridge secret is reused; it is never written to source or browser assets.

When the computer is offline, the public study remains available and writes fail with an offline message. Recovery does not restart interrupted model jobs or change saved scores. Use Retry on the existing evaluation after reconnecting.

## Local files

Private state is ignored by Git under `arena/.data/public-access/`:

- `ACCESS.txt`: account IDs, permissions and access passwords. Share only with authorised users.
- `config.json`: hashed passwords, session/bridge secrets and loopback configuration.
- `records/members/`: private evaluations and review history.
- `deployment-*`: separate deployment checks and their complete model outputs.
- `recovery-status.json` and `*-recovery.log`: local recovery status and process logs; these are not public exports.

The model API key stays in the repository’s local `.env`; it is never included in Sites source or browser assets. The existing Sites bridge secret stays in runtime secrets. The legacy `BACKEND_ORIGIN` setting is unused once the managed `DB` binding is present.

## Source and validation

`prepare_site.py <destination>` copies the UI and generates public-only study responses in the separate, registered Sites source checkout. It never copies `.env`, `.data` or member records. `worker.js` serves the public snapshot and proxies authenticated operations to the existing Python engine.

The original local entry point remains `arena/server.py`. The restricted entry point is `arena/public_server.py --config <private-config.json>`. Do not expose the original local server through the public tunnel.

See [deployment checks](../validation/20261026-public/README.md) and [recovery checks](../validation/20261027-recovery/README.md) for observed test results.

The GitHub copy includes the complete non-secret deployment-check outputs and their SHA-256 manifest. Private account configuration, passwords and ordinary member evaluations remain excluded. Existing research archives are preserved.
