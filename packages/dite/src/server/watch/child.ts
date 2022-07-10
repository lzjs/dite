import path from 'path';
(async () => {
  console.log('Hello, world!');
  const app = require(path.resolve(process.cwd(), '.dite/server/main.js'));
  console.log(app);
})();
