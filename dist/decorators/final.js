"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.final = void 0;
const final = (target, propertyKey) => {
    const value = target[propertyKey];
    if (!value) {
        Object.defineProperty(target, propertyKey, {
            set: function (value) {
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
    }
    else {
        Object.defineProperty(target, propertyKey, {
            get: function () {
                return value;
            },
            enumerable: true,
        });
    }
};
exports.final = final;
exports.default = exports.final;
