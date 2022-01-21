"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhonePrefixMapStorageStrategy = void 0;
const os_1 = __importDefault(require("os"));
class PhonePrefixMapStorageStrategy {
    constructor() {
        this.numOfEntries = 0;
        this.possibleLengths = new Set();
    }
    getNumOfEntries() {
        return this.numOfEntries;
    }
    getPossibleLengths() {
        this.possibleLengths = new Set([...this.possibleLengths].sort((a, b) => a - b));
        return this.possibleLengths;
    }
    toString() {
        let output = "";
        const numOfEntries = this.getNumOfEntries();
        for (let i = 0; i < numOfEntries; i++) {
            output += this.getPrefix(i).toString();
            output += "|";
            output += this.getDescription(i);
            output += os_1.default.EOL;
        }
        return output;
    }
}
exports.PhonePrefixMapStorageStrategy = PhonePrefixMapStorageStrategy;
exports.default = PhonePrefixMapStorageStrategy;
