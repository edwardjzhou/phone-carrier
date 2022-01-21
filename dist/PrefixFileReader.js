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
exports.PrefixFileReader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const PhonePrefixMap_1 = __importDefault(require("./PhonePrefixMap"));
const MappingFileProvider_1 = __importDefault(require("./MappingFileProvider"));
const final_1 = __importDefault(require("./decorators/final"));
const measure_1 = __importDefault(require("./decorators/measure"));
class PrefixFileReader {
    constructor(phonePrefixDataDirectory) {
        this.mappingFileProvider = new MappingFileProvider_1.default();
        this.availablePhonePrefixMaps = new Map();
        this.phonePrefixDataDirectory = phonePrefixDataDirectory;
        this.loadingMappingFile = this.loadMappingFileProvider();
    }
    loadMappingFileProvider() {
        return new Promise((res) => {
            const configPath = path_1.default.join(this.phonePrefixDataDirectory, 'config');
            const source = fs_1.default.createReadStream(configPath);
            const configSize = fs_1.default.statSync(configPath).size;
            const bufs = [];
            source.on('data', (buf) => {
                bufs.push(buf);
            }).on('end', () => {
                this.mappingFileProvider.readExternal(Buffer.concat(bufs, configSize));
                res();
            });
        });
    }
    async getDescriptionForNumber(number, language = 'en', script = "", region = "") {
        const countryCallingCode = parseInt(number.countryCallingCode);
        const phonePrefix = countryCallingCode !== 1
            ? countryCallingCode : (1000 + (+number.nationalNumber / 10000000) | 0);
        const phonePrefixDescriptions = await this.getPhonePrefixDescriptions(phonePrefix, language, script, region);
        let description = phonePrefixDescriptions ? phonePrefixDescriptions.lookup(number) : null;
        if ((description == null || description.length == 0) && this.mayFallBackToEnglish(language)) {
            const defaultMap = await this.getPhonePrefixDescriptions(phonePrefix, "en", "", "");
            if (!defaultMap)
                return "";
            description = defaultMap.lookup(number);
        }
        return description != null ? description : "";
    }
    mayFallBackToEnglish(lang) {
        return lang !== "zh" && lang !== "ja" && lang !== "ko";
    }
    async getPhonePrefixDescriptions(prefixMapKey, language, script, region) {
        await this.loadingMappingFile;
        const fileName = this.mappingFileProvider.getFileName(prefixMapKey, language, script, region);
        if (fileName.length === 0)
            return null;
        if (!this.availablePhonePrefixMaps.has(fileName))
            await this.loadPhonePrefixMapFromFile(fileName);
        return this.availablePhonePrefixMaps.get(fileName);
    }
    loadPhonePrefixMapFromFile(fileName) {
        return new Promise((res) => {
            const rs = fs_1.default.createReadStream(path_1.default.join(this.phonePrefixDataDirectory, fileName));
            let bufs = Buffer.alloc(0);
            rs.on('data', (buf) => {
                bufs = Buffer.concat([bufs, buf]);
            }).on('end', () => {
                const prefixMap = new PhonePrefixMap_1.default();
                prefixMap.readExternal(bufs);
                this.availablePhonePrefixMaps.set(fileName, prefixMap);
                res();
            });
        });
    }
}
__decorate([
    final_1.default
], PrefixFileReader.prototype, "phonePrefixDataDirectory", void 0);
__decorate([
    final_1.default
], PrefixFileReader.prototype, "loadingMappingFile", void 0);
__decorate([
    final_1.default
], PrefixFileReader.prototype, "mappingFileProvider", void 0);
__decorate([
    final_1.default
], PrefixFileReader.prototype, "availablePhonePrefixMaps", void 0);
__decorate([
    measure_1.default
], PrefixFileReader.prototype, "getDescriptionForNumber", null);
__decorate([
    measure_1.default
], PrefixFileReader.prototype, "getPhonePrefixDescriptions", null);
exports.PrefixFileReader = PrefixFileReader;
exports.default = PrefixFileReader;
