"use strict";
let logger;
before(function () {
    logger = console.log;
    console.log(`disabled console.log in ${__filename}`);
    console.log = () => { };
});
after(function () {
    console.log = logger;
    console.log(`reenabled console.log in ${__filename}`);
});
