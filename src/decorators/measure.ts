import { performance } from "perf_hooks";

let isAsyncFunction: Function;
try {
  isAsyncFunction = require("util/types").isAsyncFunction;
} catch {
  isAsyncFunction = function () {
    return arguments[0].constructor.name === "AsyncFunction";
  };
}

export const measure = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => {
  const originalMethod = descriptor.value;

  if (isAsyncFunction(descriptor.value)) {
    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      const result = await originalMethod.apply(this, args);
      const finish = performance.now();
      console.log(
        `Execution time of async ${target.constructor.name}#${propertyKey}: ${(
          finish - start
        ).toPrecision(2)} milliseconds`
      );
      return result;
    };
  } else {
    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      const result = originalMethod.apply(this, args);
      const finish = performance.now();
      console.log(
        `Execution time of ${target.constructor.name}#${propertyKey}: ${(
          finish - start
        ).toPrecision(2)} milliseconds`
      );
      return result;
    };
  }

  return descriptor;
};

// this is to turn off the console log execution time measurement decorator
measure = () => {};

export default measure;
