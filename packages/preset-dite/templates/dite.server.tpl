import { createServer } from "@dite/nest";

(async function main() {
  const server = await createServer({ pwd: process.cwd() });
  console.log('server');
  await server.start()
})();
