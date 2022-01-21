"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhonePrefixMap = void 0;
const FlyweightMapStorage_1 = __importDefault(require("./FlyweightMapStorage"));
class PhonePrefixMap {
    constructor() {
        this[_a] = 'PhonePrefixMap';
    }
    getPhonePrefixMapStorage() {
        return this.phonePrefixMapStorage;
    }
    createDefaultMapStorage() {
        throw 'unused';
        return new DefaultMapStorage();
    }
    createFlyweightMapStorage() {
        return new FlyweightMapStorage_1.default();
    }
    static getSizeOfPhonePrefixMapStorage(mapStorage, phonePrefixMap) {
        return 1;
    }
    getSmallerMapStorage(phonePrefixMap) {
        try {
            const flyweightMapStorage = this.createFlyweightMapStorage();
            const sizeOfFlyweightMapStorage = PhonePrefixMap.getSizeOfPhonePrefixMapStorage(flyweightMapStorage, phonePrefixMap);
            return flyweightMapStorage;
        }
        catch (e) {
            return this.createFlyweightMapStorage();
        }
    }
    readPhonePrefixMap(sortedPhonePrefixMap) {
        this.phonePrefixMapStorage = this.getSmallerMapStorage(sortedPhonePrefixMap);
    }
    readExternal(objectInput) {
        this.phonePrefixMapStorage ||= new FlyweightMapStorage_1.default();
        this.phonePrefixMapStorage.readExternal(objectInput);
    }
    writeExternal(objectOutput) {
        throw 'unimplemented';
    }
    lookup(number) {
        if (typeof number !== 'number') {
            let phonePrefix = parseInt(`${number.countryCallingCode}${number.nationalNumber}`);
            return this.lookup(phonePrefix);
        }
        const numOfEntries = this.phonePrefixMapStorage.getNumOfEntries();
        if (numOfEntries === 0)
            return null;
        let phonePrefix = number;
        let currentIndex = numOfEntries - 1;
        let currentSetOfLengths = this.phonePrefixMapStorage.getPossibleLengths();
        const arrayOfLengths = [...currentSetOfLengths];
        while (arrayOfLengths.length > 0) {
            const possibleLength = arrayOfLengths.pop();
            let phonePrefixStr = `${phonePrefix}`;
            if (phonePrefixStr.length > possibleLength)
                phonePrefix = parseInt(phonePrefixStr.slice(0, possibleLength));
            currentIndex = this.binarySearch(0, currentIndex, phonePrefix);
            if (currentIndex < 0)
                return null;
            const currentPrefix = this.phonePrefixMapStorage.getPrefix(currentIndex);
            if (phonePrefix === currentPrefix)
                return this.phonePrefixMapStorage.getDescription(currentIndex);
        }
        return null;
    }
    binarySearch(start, end, value) {
        let mid = 0;
        while (start <= end) {
            mid = start + end >>> 1;
            let currentValue = this.phonePrefixMapStorage.getPrefix(mid);
            if (currentValue === value) {
                return mid;
            }
            else if (currentValue > value) {
                mid--;
                end = mid;
            }
            else {
                start = mid + 1;
            }
        }
        return mid;
    }
    toString() {
        return this.phonePrefixMapStorage.toString();
    }
}
exports.PhonePrefixMap = PhonePrefixMap;
_a = Symbol.toStringTag;
exports.default = PhonePrefixMap;
