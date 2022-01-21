"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlyweightMapStorage = void 0;
const PhonePrefixMapStorageStrategy_1 = __importDefault(require("./PhonePrefixMapStorageStrategy"));
const final_1 = __importDefault(require("./decorators/final"));
class FlyweightMapStorage extends PhonePrefixMapStorageStrategy_1.default {
    getPrefix(index) {
        return FlyweightMapStorage.readWordFromBuffer(this.phoneNumberPrefixes, this.prefixSizeInBytes, index);
    }
    getDescription(index) {
        const indexInDescriptionPool = FlyweightMapStorage.readWordFromBuffer(this.descriptionIndexes, this.descIndexSizeInBytes, index);
        return this.descriptionPool[indexInDescriptionPool];
    }
    readFromSortedMap(phonePrefixMap) {
        throw 'unused';
    }
    createDescriptionPool(dewscriptionsSet, phonePrefixMap) {
        throw 'unused';
    }
    static storeWordInBuffer(buffer, wordSize, index, value) {
        throw 'unused';
    }
    readExternal(objectInput) {
        let offset = 5;
        const chunkSize = objectInput.readUInt32BE(offset);
        offset += 4;
        const isFlyweight = !!objectInput.readUInt32LE(offset);
        offset += 4;
        this.prefixSizeInBytes = objectInput.readUInt32LE(offset);
        offset += 4;
        this.descIndexSizeInBytes = objectInput.readUInt32LE(offset);
        offset += 4;
        const sizeOfLengths = objectInput.readUInt32LE(offset);
        offset += 4;
        this.possibleLengths.clear();
        for (let i = 0; i < sizeOfLengths; i++) {
            this.possibleLengths.add(objectInput.readUInt32LE(offset));
            offset += 4;
        }
        const descriptionPoolSize = objectInput.readUInt8(offset);
        offset += 1;
        if (!this.descriptionPool || this.descriptionPool.length < descriptionPoolSize) {
            this.descriptionPool = Array(descriptionPoolSize);
        }
        for (let i = 0; i < descriptionPoolSize; i++) {
            const descriptionByteLength = objectInput.readUInt16BE(offset);
            offset += 2;
            const description = objectInput.slice(offset, offset + descriptionByteLength).toString();
            offset += descriptionByteLength;
            this.descriptionPool[i] = description;
        }
        this.readEntries(objectInput, offset);
    }
    readEntries(objectInput, offset) {
        this.numOfEntries = objectInput.readInt32BE(offset);
        offset += 4;
        if (!this.phoneNumberPrefixes || this.phoneNumberPrefixes.byteLength < this.numOfEntries * this.prefixSizeInBytes) {
            this.phoneNumberPrefixes = Buffer.alloc(this.numOfEntries * this.prefixSizeInBytes);
        }
        if (!this.descriptionIndexes || this.descriptionIndexes.length < this.numOfEntries * this.descIndexSizeInBytes) {
            this.descriptionIndexes = Buffer.alloc(this.numOfEntries * this.descIndexSizeInBytes);
        }
        let blockLimit = objectInput.readInt32BE(5) + 8 + 1;
        for (let i = 0; i < this.numOfEntries; i++) {
            if (offset + this.prefixSizeInBytes > blockLimit) {
                const needed = this.prefixSizeInBytes;
                const given = blockLimit - offset;
                const remainder = needed - given;
                const buf = Buffer.alloc(needed);
                const leftNumBytes = objectInput.copy(buf, 0, offset, blockLimit);
                const rightNumBytes = objectInput.copy(buf, leftNumBytes, blockLimit + 5, blockLimit + 5 + remainder);
                offset += given;
                if (objectInput.readUInt8(offset) === 0x7a) {
                    offset += 1;
                    blockLimit = objectInput.readUInt32BE(offset) + blockLimit + 5;
                    offset += 4;
                }
                else if (objectInput.readUInt8(offset) === 0x77) {
                    offset += 1;
                    blockLimit = objectInput.readUInt8(offset) + blockLimit + 5;
                    offset += 1;
                }
                offset += remainder;
                const wordIndex = i * this.prefixSizeInBytes;
                if (this.prefixSizeInBytes === FlyweightMapStorage.SHORT_NUM_BYTES) {
                    this.phoneNumberPrefixes.writeUInt16BE(buf.readUInt16BE(), wordIndex);
                }
                else if (this.prefixSizeInBytes === FlyweightMapStorage.INT_NUM_BYTES) {
                    this.phoneNumberPrefixes.writeUInt32BE(buf.readUInt32BE(), wordIndex);
                }
            }
            else {
                if (this.prefixSizeInBytes === FlyweightMapStorage.SHORT_NUM_BYTES) {
                    const wordIndex = i * FlyweightMapStorage.SHORT_NUM_BYTES;
                    this.phoneNumberPrefixes.writeUInt16BE(objectInput.readUInt16BE(offset), wordIndex);
                    offset += 2;
                }
                else if (this.prefixSizeInBytes === FlyweightMapStorage.INT_NUM_BYTES) {
                    const wordIndex = i * FlyweightMapStorage.INT_NUM_BYTES;
                    this.phoneNumberPrefixes.writeUInt32BE(objectInput.readUInt32BE(offset), wordIndex);
                    offset += 4;
                }
            }
            if (offset + this.descIndexSizeInBytes > blockLimit) {
                const needed = this.descIndexSizeInBytes;
                const given = blockLimit - offset;
                const remainder = needed - given;
                const buf = Buffer.alloc(needed);
                const leftNumBytes = objectInput.copy(buf, 0, offset, blockLimit);
                const rightNumBytes = objectInput.copy(buf, leftNumBytes, blockLimit + 5, blockLimit + 5 + remainder);
                offset += given;
                if (objectInput.readUInt8(offset) === 0x7a) {
                    offset += 1;
                    blockLimit = objectInput.readUInt32BE(offset) + blockLimit + 5;
                    offset += 4;
                }
                else if (objectInput.readUInt8(offset) === 0x77) {
                    offset += 1;
                    blockLimit = objectInput.readUInt8(offset) + blockLimit + 5;
                    offset += 1;
                }
                offset += remainder;
                const wordIndex = i * this.descIndexSizeInBytes;
                if (this.descIndexSizeInBytes === FlyweightMapStorage.SHORT_NUM_BYTES) {
                    this.descriptionIndexes.writeUInt16BE(buf.readUInt16BE(), wordIndex);
                }
                else if (this.descIndexSizeInBytes === FlyweightMapStorage.INT_NUM_BYTES) {
                    this.descriptionIndexes.writeUInt32BE(buf.readUInt32BE(), wordIndex);
                }
            }
            else {
                if (this.descIndexSizeInBytes === FlyweightMapStorage.SHORT_NUM_BYTES) {
                    const wordIndex = i * FlyweightMapStorage.SHORT_NUM_BYTES;
                    this.descriptionIndexes.writeUInt16BE(objectInput.readUInt16BE(offset), wordIndex);
                    offset += 2;
                }
                else if (this.descIndexSizeInBytes === FlyweightMapStorage.INT_NUM_BYTES) {
                    const wordIndex = i * FlyweightMapStorage.INT_NUM_BYTES;
                    this.descriptionIndexes.writeUInt32BE(objectInput.readUInt32BE(offset), wordIndex);
                    offset += 4;
                }
            }
        }
    }
    static readWordFromBuffer(buffer, wordSize, index) {
        const wordIndex = index * wordSize;
        return wordSize === this.SHORT_NUM_BYTES ? buffer.readInt16BE(wordIndex) : buffer.readInt32BE(wordIndex);
    }
    static getOptimalNumberOfBytesForValue(value) {
        throw 'unused';
        return value <= 0x7FFFFFFF ? this.SHORT_NUM_BYTES : this.INT_NUM_BYTES;
    }
    writeExternal(objectOutput) {
        throw 'unimplemented';
    }
    static writeExternalWord(objectOutput, wordSize, inputBuffer, index) {
        throw 'unimplemented';
    }
}
FlyweightMapStorage.SHORT_NUM_BYTES = Int16Array.BYTES_PER_ELEMENT;
FlyweightMapStorage.INT_NUM_BYTES = Int32Array.BYTES_PER_ELEMENT;
__decorate([
    final_1.default
], FlyweightMapStorage, "SHORT_NUM_BYTES", void 0);
__decorate([
    final_1.default
], FlyweightMapStorage, "INT_NUM_BYTES", void 0);
exports.FlyweightMapStorage = FlyweightMapStorage;
exports.default = FlyweightMapStorage;
