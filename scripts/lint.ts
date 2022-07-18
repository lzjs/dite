import 'zx/globals';

async function main() {
  await $`eslint --cache --ext js,jsx,ts,tsx packages`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
