let logger: typeof console.log;
before(function () {
  logger = console.log;
  console.log(`disabled console.log in ${__filename}`);
  console.log = () => {};
});
after(function () {
  console.log = logger;
  console.log(`reenabled console.log in ${__filename}`);
});
