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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MappingFileProvider = void 0;
const assert_1 = __importDefault(require("assert"));
const string_decoder_1 = require("string_decoder");
const os_1 = __importDefault(require("os"));
const measure_1 = __importDefault(require("./decorators/measure"));
const STREAM_MAGIC = 0xaced;
const STREAM_VERSION = 5;
const TC_NULL = 0x70;
const TC_REFERENCE = 0x71;
const TC_CLASSDESC = 0x72;
const TC_OBJECT = 0x73;
const TC_STRING = 0x74;
const TC_ARRAY = 0x75;
const TC_CLASS = 0x76;
const TC_BLOCKDATA = 0x77;
const TC_ENDBLOCKDATA = 0x78;
const TC_RESET = 0x79;
const TC_BLOCKDATALONG = 0x7A;
const TC_EXCEPTION = 0x7B;
const TC_LONGSTRING = 0x7C;
const TC_PROXYCLASSDESC = 0x7D;
const TC_ENUM = 0x7E;
const baseWireHandle = 0x7E0000;
const SC_WRITE_METHOD = 0x01;
const SC_BLOCK_DATA = 0x08;
const SC_SERIALIZABLE = 0x02;
const SC_EXTERNALIZABLE = 0x04;
const SC_ENUM = 0x10;
class MappingFileProvider {
    constructor() {
        this.numOfEntries = 0;
    }
    readFileConfigs(availableDataFiles) {
        this.numOfEntries = availableDataFiles.size;
        this.countryCallingCodes = Array(this.numOfEntries);
        this.availableLanguages = Array(this.numOfEntries);
        let index = 0;
        for (const countryCallingCode of availableDataFiles.keys()) {
            this.countryCallingCodes[index++] = countryCallingCode;
            this.availableLanguages.push(new Set(availableDataFiles.get(countryCallingCode)));
        }
    }
    readExternal(objectInput) {
        let blockLimit = 1024 + 8 + 1;
        this.numOfEntries = objectInput.readUInt32BE(9);
        if (!this.countryCallingCodes || this.countryCallingCodes.length < this.numOfEntries) {
            this.countryCallingCodes = Array(this.numOfEntries);
        }
        this.availableLanguages ||= [];
        let overlappedSpace = 0;
        let elementSize;
        let offset = 13;
        for (let i = 0; i < this.numOfEntries; i++) {
            this.countryCallingCodes[i] = objectInput.readUInt32BE(offset);
            offset += 4;
            if (offset + 4 > blockLimit) {
                overlappedSpace = offset + 4 - blockLimit;
                assert_1.default.deepStrictEqual(objectInput.readUInt32BE(offset), TC_BLOCKDATALONG);
                offset += 4;
                blockLimit = objectInput.readUInt32BE(offset) + blockLimit + 5;
                offset += 4;
            }
            let numOfLangs;
            if (overlappedSpace !== 0) {
                overlappedSpace = 0;
                numOfLangs = objectInput.readUInt8(offset);
                offset += 1;
            }
            else {
                numOfLangs = objectInput.readUInt32BE(offset);
                offset += 4;
            }
            const setOfLangs = new Set();
            for (let j = 0; j < numOfLangs; j++) {
                const decoder = new string_decoder_1.StringDecoder('utf8');
                elementSize = objectInput.readUInt16BE(offset);
                offset += 2;
                const lang = decoder.write(objectInput.slice(offset, offset + elementSize));
                setOfLangs.add(lang);
                offset += elementSize;
            }
            this.availableLanguages.push(setOfLangs);
        }
    }
    toString() {
        let output = "";
        for (let i = 0; i < this.numOfEntries; i++) {
            output += this.countryCallingCodes[i];
            output += '|';
            const sortedSetOfLangs = new Set(this.availableLanguages[i]);
            for (const lang of sortedSetOfLangs) {
                output += lang;
                output += ',';
            }
            output += os_1.default.EOL;
        }
        return output;
    }
    getFileName(countryCallingCode, language, script, region) {
        if (language.length === 0)
            return "";
        if (!this.countryCallingCodes?.length)
            return '';
        let index = this.countryCallingCodes.indexOf(countryCallingCode);
        if (index < 0)
            return "";
        const setOfLangs = this.availableLanguages[index];
        if (setOfLangs.size > 0) {
            const languageCode = this.findBestMatchingLanguageCode(setOfLangs, language, script, region);
            if (languageCode.length > 0) {
                let fileName = '';
                fileName += countryCallingCode + '_' + languageCode;
                return fileName;
            }
        }
        return "";
    }
    findBestMatchingLanguageCode(setOfLangs, language, script, region) {
        const fullLocale = this.constructFullLocale(language, script, region);
        let normalizedLocale = MappingFileProvider.LOCALE_NORMALIZATION_MAP.get(fullLocale);
        if (normalizedLocale && setOfLangs.has(normalizedLocale))
            return normalizedLocale;
        if (setOfLangs.has(fullLocale))
            return fullLocale;
        if (this.onlyOneOfScriptOrRegionIsEmpty(script, region)) {
            if (setOfLangs.has(language))
                return language;
        }
        else if (script.length > 0 && region.length > 0) {
            const langWithScript = `${language}_${script}`;
            if (setOfLangs.has(langWithScript))
                return langWithScript;
            const langWithRegion = `${language}_${region}`;
            if (setOfLangs.has(langWithRegion))
                return langWithRegion;
            if (setOfLangs.has(language))
                return language;
        }
        return "";
    }
    onlyOneOfScriptOrRegionIsEmpty(script, region) {
        return (script.length === 0 && region.length > 0) || (region.length === 0 && script.length > 0);
    }
    constructFullLocale(language, script, region) {
        let fullLocale = language;
        fullLocale = this.appendSubsequentLocalePart(script, fullLocale);
        fullLocale = this.appendSubsequentLocalePart(region, fullLocale);
        return fullLocale;
    }
    appendSubsequentLocalePart(subsequentLocalePart, fullLocale) {
        if (subsequentLocalePart.length > 0) {
            fullLocale += subsequentLocalePart;
        }
        return fullLocale;
    }
}
_a = MappingFileProvider;
(() => {
    _a.normalizationMap = new Map();
    _a.normalizationMap.set("zh_TW", "zh_Hant");
    _a.normalizationMap.set("zh_HK", "zh_Hant");
    _a.normalizationMap.set("zh_MO", "zh_Hant");
    _a.LOCALE_NORMALIZATION_MAP = new Map([..._a.normalizationMap]);
})();
__decorate([
    measure_1.default
], MappingFileProvider.prototype, "readExternal", null);
exports.MappingFileProvider = MappingFileProvider;
exports.default = MappingFileProvider;
