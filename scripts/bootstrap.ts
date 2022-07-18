async function main() {
  console.log('bootstrap');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
