import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const clientsDir = resolve(__dirname, "../src/content/clients");

const clients = readdirSync(clientsDir)
  .filter((name) => name !== "default")
  .filter((name) => existsSync(resolve(clientsDir, name, "site.json")))
  .sort();

for (const client of clients) {
  console.log(client);
}