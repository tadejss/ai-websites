import http from "node:http";
import { loadGatewayConfig } from "./config";
import { detectModem } from "./modem/detect";
import { runPollerLoop } from "./poller";

function readBearer(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim() || null;
}

async function main(): Promise<void> {
  const config = loadGatewayConfig();
  const { modem, status } = await detectModem({
    dryRun: config.dryRun,
    hilinkUrl: config.hilinkUrl,
  });

  const server = http.createServer(async (req, res) => {
    const token = readBearer(req.headers.authorization);
    if (token !== config.localSecret) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const url = new URL(req.url ?? "/", `http://${config.host}:${config.port}`);

    try {
      if (req.method === "GET" && url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, dryRun: config.dryRun }));
        return;
      }

      if (req.method === "GET" && url.pathname === "/status") {
        const current = await modem.getStatus();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(current));
        return;
      }

      if (req.method === "GET" && url.pathname === "/messages") {
        const messages = await modem.listIncomingSms();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ messages }));
        return;
      }

      if (req.method === "POST" && url.pathname === "/send") {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.from(chunk));
        }
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
          messageId?: string;
          to?: string;
          text?: string;
        };
        if (!body.to || !body.text) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "to and text required" }));
          return;
        }
        const result = await modem.sendSms(body.to, body.text);
        res.writeHead(result.success ? 200 : 502, {
          "Content-Type": "application/json",
        });
        res.end(
          JSON.stringify({
            success: result.success,
            messageId: body.messageId,
            ...(result.success
              ? { providerMessageId: result.providerMessageId }
              : { error: result.error }),
          }),
        );
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Server error",
        }),
      );
    }
  });

  server.listen(config.port, config.host, () => {
    console.log(
      `[gateway] listening on http://${config.host}:${config.port} mode=${status.mode}`,
    );
  });

  if (process.env.SMS_GATEWAY_AUTOPOLL === "true") {
    void runPollerLoop();
  }
}

void main();
