#!/bin/bash
# Keep Wi-Fi as the default internet route; only host-route 192.168.8.1
# via the HiLink USB modem. Idempotent. Does not change DNS.
set -euo pipefail

MODEM_HOST="${HILINK_HOST:-192.168.8.1}"
MODEM_NET="${HILINK_NET:-192.168.8}"

wifi_dev=""
modem_dev=""
modem_gateway=""

echo "[hilink-route] current default routes:"
netstat -rn -f inet | awk 'NR==1 || $1=="default"'

wifi_dev="$(networksetup -listallhardwareports 2>/dev/null | awk '
  /Hardware Port: Wi-Fi/ {wifi=1}
  wifi && /Device:/ {print $2; exit}
')"

# Discover USB/HiLink interface: has an address on 192.168.8.0/24
while IFS= read -r iface; do
  ifconfig "$iface" 2>/dev/null | grep -q "inet ${MODEM_NET}\\." || continue
  modem_dev="$iface"
  modem_gateway="$(ifconfig "$iface" 2>/dev/null | awk '/inet / {print $2; exit}')"
  break
done < <(ifconfig -l)

if [[ -z "$modem_dev" ]]; then
  echo "[hilink-route] no interface with ${MODEM_NET}.x found; plug in the Brovi dongle first."
  exit 0
fi

echo "[hilink-route] Wi-Fi device: ${wifi_dev:-unknown}"
echo "[hilink-route] modem device: $modem_dev (local ${modem_gateway:-unknown})"

default_via_modem=0
if netstat -rn -f inet | awk -v gw="$MODEM_HOST" -v dev="$modem_dev" '
  $1=="default" && ($2==gw || $NF==dev) { found=1 }
  END { exit found ? 0 : 1 }
'; then
  default_via_modem=1
fi

if [[ "$default_via_modem" -eq 1 ]]; then
  echo "[hilink-route] default route goes via modem ($MODEM_HOST / $modem_dev)."
  echo "[hilink-route] removing that default route only."
  if route -n delete default "$MODEM_HOST" 2>/dev/null; then
    echo "[hilink-route] deleted default via $MODEM_HOST"
  else
    echo "[hilink-route] could not delete default via $MODEM_HOST (may need sudo)."
  fi
else
  echo "[hilink-route] default route is not via the modem; leaving it."
fi

if ! netstat -rn -f inet | awk -v host="$MODEM_HOST" '$1==host { found=1 } END { exit found ? 0 : 1 }'; then
  echo "[hilink-route] adding host route $MODEM_HOST via $modem_dev"
  if route -n add -host "$MODEM_HOST" -interface "$modem_dev" 2>/dev/null; then
    echo "[hilink-route] host route added"
  else
    echo "[hilink-route] could not add host route (may need sudo)."
  fi
else
  echo "[hilink-route] host route to $MODEM_HOST already present"
fi

echo "[hilink-route] done. Also set: System Settings → Network → Set Service Order → Wi-Fi above USB."
echo "[hilink-route] routes after:"
netstat -rn -f inet | awk 'NR==1 || $1=="default" || $1=="'"$MODEM_HOST"'"'
