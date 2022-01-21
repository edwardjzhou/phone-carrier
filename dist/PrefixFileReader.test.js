"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importStar(require("node:assert"));
const PrefixFileReader_1 = __importDefault(require("./PrefixFileReader"));
const path_1 = __importDefault(require("path"));
describe(`new PrefixFileReader`, function () {
    it("should call PrefixFileReader#loadMappingFileProvider once", () => {
        const tracker = new node_assert_1.CallTracker();
        const wrapped = tracker.calls(PrefixFileReader_1.default.prototype.loadMappingFileProvider, 1);
        const original = PrefixFileReader_1.default.prototype.loadMappingFileProvider;
        PrefixFileReader_1.default.prototype.loadMappingFileProvider = wrapped;
        const reader = new PrefixFileReader_1.default(path_1.default.join(__dirname, "..", "resources", "binary"));
        node_assert_1.default.doesNotThrow(() => tracker.verify());
        PrefixFileReader_1.default.prototype.loadMappingFileProvider = original;
    });
});
