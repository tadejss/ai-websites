# Local Huawei E3372h HiLink SMS Gateway

Local-only service that polls the production SMS queue and sends messages through a Huawei E3372h USB LTE stick in **HiLink** mode.

## Architecture

```text
Vercel / Neon queue
      ↑ poll + result
tools/sms-gateway (this machine)
      ↓ HiLink HTTP
E3372h @ http://192.168.8.1
      ↓ mobile network
Lead phone
```

The modem is **never** exposed to the public internet. This process binds to `127.0.0.1` only.

## Prerequisites

1. Plug the E3372h into this computer.
2. Confirm HiLink UI opens at [http://192.168.8.1](http://192.168.8.1).
3. Insert a SIM with SMS credit and wait until the stick shows network connectivity.
4. Set production env `SMS_GATEWAY_SECRET` on Vercel to the same value used locally.

## Environment

Create `tools/sms-gateway/.env` (never commit secrets):

```bash
SMS_GATEWAY_SECRET=long-random-shared-with-vercel
SMS_GATEWAY_LOCAL_SECRET=another-long-random-local-only
SMS_API_BASE_URL=https://zbrendiraj.si
SMS_DRY_RUN=true
SMS_MIN_DELAY_MS=3000
SMS_BATCH_SIZE=5
SMS_DAILY_LIMIT=100
SMS_POLL_INTERVAL_MS=15000
HILINK_URL=http://192.168.8.1
SMS_GATEWAY_PORT=8787
```

## Install & dry-run (no modem required)

```bash
cd tools/sms-gateway
npm install
SMS_DRY_RUN=true npm run poll
```

Dry-run claims queued messages from production (or staging), simulates send success, and posts results back. Neon SMS state updates without transmitting radio SMS.

## Live send

1. Set `SMS_DRY_RUN=false`.
2. Verify modem: open HiLink UI, or:

```bash
SMS_DRY_RUN=false npm start
# then:
curl -H "Authorization: Bearer $SMS_GATEWAY_LOCAL_SECRET" http://127.0.0.1:8787/status
```

3. Start the poller:

```bash
SMS_DRY_RUN=false npm run poll
```

4. In admin, click **Queue SMS** for a test lead, or wait for cron `/api/cron/sms-outreach`.

## Local HTTP API (localhost only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| GET | `/status` | Modem / dry-run status |
| POST | `/send` | Manual send `{ to, text, messageId? }` |
| GET | `/messages` | Inbox snapshot from HiLink |

All require `Authorization: Bearer SMS_GATEWAY_LOCAL_SECRET`.

## HiLink endpoints used

Documented E3372h HiLink HTTP API (verified against common E3372/E8372 scripts):

1. `GET /api/webserver/SesTokInfo` — session cookie + CSRF token
2. `GET /api/monitoring/status` — connectivity / signal
3. `POST /api/sms/send-sms` — outbound SMS (XML body)
4. `POST /api/sms/sms-list` — inbox (BoxType=1)

If your firmware returns different XML tags, update `src/modem/hilink.ts` only — outreach logic stays unchanged.

## Stop safely

Press `Ctrl+C` on the poller. Claimed messages whose lease expires return to the queue automatically.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Modem disconnected | HiLink URL, USB power, SIM PIN |
| Queue 401 | `SMS_GATEWAY_SECRET` mismatch with Vercel |
| Messages stay claimed | Lease expiry (`SMS_CLAIM_LEASE_MINUTES` on server); restart poller |
| Drafts instead of sent | HiLink XML Index/Date fields; use Index `-1` (already set) |
| Opt-out not applied | Inbound poll + `/api/outreach/sms/inbound` auth |
