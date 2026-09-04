# Local Brovi E3372-325 HiLink SMS Gateway

Local-only service that polls the production SMS queue and sends/receives messages through a **Brovi 4472 325** USB stick (Huawei E3372-325) in HiLink mode.

## Hardware

- Model: Brovi 4472 325 (Huawei E3372-325)
- Firmware: `3.0.3.61(H057SP11C983)`
- Web UI: `WEBUI 3.0.3.61(W13SP6C7110)`
- HiLink: [http://192.168.8.1](http://192.168.8.1)

The modem is **never** exposed to the public internet. This process binds to `127.0.0.1` only.

## Architecture

```text
Vercel / Neon (sms_messages, sms_inbound, sms_opt_outs)
      ↑ poll + preflight + result + inbound
tools/sms-gateway (this Mac)
      ↓ HiLink HTTP
Brovi @ http://192.168.8.1
      ↓ SIM
Lead phone
```

`SMS_DRY_RUN=true` blocks **outbound radio send** only. Inbound opt-out processing still runs.

## macOS networking

The stick appears as USB Ethernet and can steal the default route.

1. System Settings → Network → **Set Service Order** → Wi-Fi above the USB modem.
2. After plugging in:

```bash
./scripts/macos-keep-wifi-primary.sh
```

Goal: Wi-Fi = internet; host route only to `192.168.8.1`. The helper is idempotent and does not change DNS.

## Environment

Create `tools/sms-gateway/.env` (gitignored). Never put secrets in git or logs.

```bash
SMS_GATEWAY_SECRET=           # same value as Vercel Production
SMS_GATEWAY_LOCAL_SECRET=     # local HTTP only
SMS_API_BASE_URL=https://zbrendiraj.si
SMS_DRY_RUN=true
SMS_DAILY_LIMIT=5
SMS_MIN_DELAY_MS=3000
SMS_BATCH_SIZE=1
SMS_POLL_INTERVAL_MS=15000
HILINK_URL=http://192.168.8.1
```

Optional, only if probe shows the firmware requires them:

```bash
HILINK_USERNAME=admin
HILINK_PASSWORD=
HILINK_PIN=
```

`SMS_GATEWAY_LOCAL_SECRET` is never sent to Vercel. Production APIs use `SMS_GATEWAY_SECRET` as `Authorization: Bearer`.

## Probe (read-only)

Never sends SMS, never deletes inbox, never claims the production queue.

```bash
cd tools/sms-gateway
npm install
npm run probe
```

- `GET /api/pin/status` is allowed; `POST /api/pin/operate` is not.
- `POST /api/sms/sms-list` is a read-only peek; failure is `UNAVAILABLE`, not fatal.
- No SIM → `SIM: NO_SIM`, exit 0 if the modem session works.

## Dry-run outbound

```bash
SMS_DRY_RUN=true npm run poll
```

Claims the Neon queue, **authorizes** send (`POST /api/outreach/sms/preflight`), simulates send, writes `status=sent` with `provider_message_id=dryrun-…`. Does not call HiLink `send-sms`.

Then queue one **test** lead from `/admin` (not a real outreach blast).

## Live mode

Set `SMS_DRY_RUN=false` only after a successful probe, a dry-run queue cycle, and one live SMS to your own phone. That is a **later** task.

## SIM phases

```text
NO_SIM → insert SIM → PIN status → network registration → SMS ready
```

No SIM is not a gateway crash.

## Inbound + opt-out

Inbound is polled independently of the outbound queue (same `npm run poll` process).

```text
modem inbox → POST /api/outreach/sms/inbound → Neon persist
  → opt-out keywords STOP / NE / ODJAVA → sms_opt_outs
  → cancel queued + claimed (not sending)
  → delete modem SMS only after 2xx
```

Unknown numbers are persisted. Opt-out still creates a global blacklist row. Positive replies (`DA`, …) are stored only; no auto workflow yet.

## Local HTTP API (localhost only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| GET | `/status` | Modem / dry-run status |
| POST | `/send` | Manual send `{ to, text, messageId? }` |
| GET | `/messages` | Inbox snapshot from HiLink |

All require `Authorization: Bearer SMS_GATEWAY_LOCAL_SECRET`.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `192.168.8.1` unreachable | USB, HiLink UI, `macos-keep-wifi-primary.sh` |
| Modem became default gateway | Service order + helper script |
| Login required | Probe `state-login` / `AUTH_REQUIRED`; then set credentials if firmware needs them |
| `NO_SIM` | Expected until the SIM is inserted |
| PIN required | `HILINK_PIN` only after probe confirms; one attempt |
| Network unavailable | Wait for registration; do not change modem network settings |
| SMS API unavailable | Probe `sms-list`; session/token |
| Session expired | Client refreshes `SesTokInfo`; restart poller if it persists |
| Queue 401 | `SMS_GATEWAY_SECRET` mismatch with Vercel |
| Opt-out not applied | Inbound poll + `/api/outreach/sms/inbound` auth |

## Stop safely

`Ctrl+C` on the poller. Claimed messages whose lease expires return to the queue. `sending` messages are past the send boundary and are not cancelled by a later STOP.
