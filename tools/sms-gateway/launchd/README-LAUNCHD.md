# Unattended SMS gateway (LaunchAgent)

Do **not** load this agent until LIVE activation is explicitly approved.

The HiLink modem is only reachable from this Mac. Vercel enqueues; this process claims/sends.

## Prerequisites

1. `tools/sms-gateway/.env` configured with:

```bash
SMS_GATEWAY_SECRET=…          # same as Vercel Production
SMS_GATEWAY_LOCAL_SECRET=…
SMS_API_BASE_URL=https://zbrendiraj.si
SMS_DRY_RUN=false
SMS_BATCH_SIZE=1
SMS_POLL_INTERVAL_MS=15000
HILINK_URL=http://192.168.8.1
```

2. Production still has `SMS_CRON_ENQUEUE_DISABLED=true` until you intentionally remove it.
3. Pre-LIVE queue isolated (`npx tsx scripts/sms-isolate-pre-live-queue.ts --apply`).
4. Wi-Fi kept primary: `./scripts/macos-keep-wifi-primary.sh`.

## Install (operator only — later)

From the repo root:

```bash
REPO_ROOT="$(pwd)"
NODE_BIN="$(command -v node)"
HOME_DIR="$HOME"
TEMPLATE="$REPO_ROOT/tools/sms-gateway/launchd/si.zbrendiraj.sms-gateway.plist.template"
TARGET="$HOME_DIR/Library/LaunchAgents/si.zbrendiraj.sms-gateway.plist"

sed \
  -e "s|__REPO_ROOT__|$REPO_ROOT|g" \
  -e "s|__NODE_BIN__|$NODE_BIN|g" \
  -e "s|__HOME__|$HOME_DIR|g" \
  "$TEMPLATE" > "$TARGET"

launchctl unload "$TARGET" 2>/dev/null || true
launchctl load "$TARGET"
launchctl kickstart -k "gui/$(id -u)/si.zbrendiraj.sms-gateway"
```

Confirm:

```bash
curl -s -H "Authorization: Bearer $SMS_GATEWAY_LOCAL_SECRET" http://127.0.0.1:8787/health
tail -f ~/Library/Logs/zbrendiraj-sms-gateway.log
```

## Stop

```bash
launchctl unload ~/Library/LaunchAgents/si.zbrendiraj.sms-gateway.plist
```

## Notes

- `SMS_GATEWAY_AUTOPOLL=true` starts `runPollerLoop()` inside `src/server.ts`.
- Outbound sends only after 09:13 Europe/Ljubljana and only while Neon daily capacity remains.
- Inbound/opt-out continues regardless of the send window.
- KeepAlive restarts the process after crashes; it does **not** reset Neon daily target/sent counts.
