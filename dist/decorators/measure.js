"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measure = void 0;
const perf_hooks_1 = require("perf_hooks");
let isAsyncFunction;
try {
    isAsyncFunction = require("util/types").isAsyncFunction;
}
catch {
    isAsyncFunction = function () {
        return arguments[0].constructor.name === "AsyncFunction";
    };
}
const measure = (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    if (isAsyncFunction(descriptor.value)) {
        descriptor.value = async function (...args) {
            const start = perf_hooks_1.performance.now();
            const result = await originalMethod.apply(this, args);
            const finish = perf_hooks_1.performance.now();
            console.log(`Execution time of async ${target.constructor.name}#${propertyKey}: ${(finish - start).toPrecision(2)} milliseconds`);
            return result;
        };
    }
    else {
        descriptor.value = function (...args) {
            const start = perf_hooks_1.performance.now();
            const result = originalMethod.apply(this, args);
            const finish = perf_hooks_1.performance.now();
            console.log(`Execution time of ${target.constructor.name}#${propertyKey}: ${(finish - start).toPrecision(2)} milliseconds`);
            return result;
        };
    }
    return descriptor;
};
exports.measure = measure;
exports.measure = () => { };
exports.default = exports.measure;
