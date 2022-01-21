import assert from "node:assert";
import path from "path";
import FlyweightMapStorage from "./FlyweightMapStorage";
import fs from "fs";

describe(`FlyweightMapStorage#readExternal`, function () {
  it("should assign values to instance members after reading a binary encoded `lang`_`phoneprefix` libphonenumber carrier file", async () => {
    const rs = fs.createReadStream(
      path.join(__dirname, "..", "resources", "binary", "7_en")
    );
    const data = [];
    for await (const chunk of rs) {
      data.push(chunk);
    }
    const flyStore = new FlyweightMapStorage();
    flyStore.readExternal(Buffer.concat(data));

    assert.ok(flyStore.prefixSizeInBytes);
    assert.ok(flyStore.phoneNumberPrefixes);
    assert.ok(flyStore.descriptionPool);
    assert.ok(flyStore.descriptionIndexes);
  });
});
