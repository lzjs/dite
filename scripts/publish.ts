import 'zx/globals';

async function main() {
  await $`pnpm i`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
