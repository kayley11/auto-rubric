# Public website

Public URL: https://auto-rubric.kayley1026lzt.chatgpt.site

Daily use and restart instructions: [中文使用说明](USAGE_CN.md).

Registered Sites source: the sibling checkout `auto-rubric-public`, project `appgprj_6adfdc1603988191a795a461d19f5914`. Reuse this identity for future publication.

The existing React interface is hosted on Sites. The original Python AutoRubric engine runs on the host computer, connected through an outbound Cloudflare tunnel. No paid hosting service was opened.

- Anyone can browse the saved study and download public display copies.
- Authorised accounts can generate answers, run original or proposed scoring rules and save reviews. New evaluations and reviews are stored locally per account.
- Clinical references and candidate information requirements remain **awaiting confirmation**.
- Public display labels use generic wording. Historical study files and original raw outputs are retained unchanged.

The computer, restricted backend and tunnel must remain running for live evaluations and saving. When they are offline, the public study remains available and writes fail with an offline message. A restarted quick tunnel receives a different address; update the Site’s secret `BACKEND_ORIGIN` and redeploy the saved version. The public Site URL stays the same.

## Local files

Private state is ignored by Git under `arena/.data/public-access/`:

- `ACCESS.txt`: account IDs, permissions and access passwords. Share only with authorised users.
- `config.json`: hashed passwords, session/bridge secrets and loopback configuration.
- `records/members/`: private evaluations and review history.
- `deployment-*`: separate deployment checks and their complete model outputs.

The model API key stays in the repository’s local `.env`; it is never included in Sites source or browser assets. Sites stores only the backend origin and bridge secret as runtime secrets.

## Source and validation

`prepare_site.py <destination>` copies the UI and generates public-only study responses in the separate, registered Sites source checkout. It never copies `.env`, `.data` or member records. `worker.js` serves the public snapshot and proxies authenticated operations to the existing Python engine.

The original local entry point remains `arena/server.py`. The restricted entry point is `arena/public_server.py --config <private-config.json>`. Do not expose the original local server through the public tunnel.

See [deployment checks](../validation/20261026-public/README.md) for observed test results.

The GitHub copy includes the complete non-secret deployment-check outputs and their SHA-256 manifest. Private account configuration, passwords and ordinary member evaluations remain excluded. Existing research archives are preserved.
