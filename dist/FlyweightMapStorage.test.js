"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const path_1 = __importDefault(require("path"));
const FlyweightMapStorage_1 = __importDefault(require("./FlyweightMapStorage"));
const fs_1 = __importDefault(require("fs"));
describe(`FlyweightMapStorage#readExternal`, function () {
    it("should assign values to instance members after reading a binary encoded `lang`_`phoneprefix` libphonenumber carrier file", async () => {
        const rs = fs_1.default.createReadStream(path_1.default.join(__dirname, "..", "resources", "binary", "7_en"));
        const data = [];
        for await (const chunk of rs) {
            data.push(chunk);
        }
        const flyStore = new FlyweightMapStorage_1.default();
        flyStore.readExternal(Buffer.concat(data));
        node_assert_1.default.ok(flyStore.prefixSizeInBytes);
        node_assert_1.default.ok(flyStore.phoneNumberPrefixes);
        node_assert_1.default.ok(flyStore.descriptionPool);
        node_assert_1.default.ok(flyStore.descriptionIndexes);
    });
});
