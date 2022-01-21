import assert, { CallTracker } from "node:assert";
import PrefixFileReader from "./PrefixFileReader";
import path from "path";

describe(`new PrefixFileReader`, function () {
  it("should call PrefixFileReader#loadMappingFileProvider once", () => {
    const tracker = new CallTracker();
    const wrapped = tracker.calls(
      PrefixFileReader.prototype.loadMappingFileProvider,
      1
    );
    const original = PrefixFileReader.prototype.loadMappingFileProvider;
    PrefixFileReader.prototype.loadMappingFileProvider = wrapped;
    const reader = new PrefixFileReader(
      path.join(__dirname, "..", "resources", "binary")
    );
    assert.doesNotThrow(() => tracker.verify());
    PrefixFileReader.prototype.loadMappingFileProvider = original;
  });
});
