export const final = (target: any, propertyKey: string) => {
  const value: any = target[propertyKey];

  if (!value) {
    Object.defineProperty(target, propertyKey, {
      set: function (value: any) {
        Object.defineProperty(this, propertyKey, {
          get: function () {
            return value;
          },
          enumerable: true,
          configurable: false,
        });
      },
      enumerable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        return value;
      },
      enumerable: true,
    });
  }
};

export default final;
