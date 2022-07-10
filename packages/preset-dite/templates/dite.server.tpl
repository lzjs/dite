import { createServer } from "@dite/server";

(async function main() {
  const server = await createServer({ pwd: process.cwd() });
  await server.start()
})();
