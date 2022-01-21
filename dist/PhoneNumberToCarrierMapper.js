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
exports.PhoneNumberToCarrierMapper = void 0;
const libphonenumber_js_1 = require("libphonenumber-js");
const PrefixFileReader_1 = __importDefault(require("./PrefixFileReader"));
const path_1 = __importDefault(require("path"));
const measure_1 = __importDefault(require("./decorators/measure"));
const final_1 = __importDefault(require("./decorators/final"));
class PhoneNumberToCarrierMapper {
    constructor(MAPPING_DATA_DIRECTORY) {
        this.prefixFileReader = null;
        this.prefixFileReader = new PrefixFileReader_1.default(MAPPING_DATA_DIRECTORY);
    }
    static getInstance() {
        if (this.instance == null) {
            this.instance = new PhoneNumberToCarrierMapper(this.LIB_MAPPING_DATA_DIRECTORY);
        }
        return this.instance;
    }
    async getNameForValidNumber(number, language = "en", script = "", region = number.country) {
        if (typeof number === "string")
            number = (0, libphonenumber_js_1.parsePhoneNumber)(number);
        return this.prefixFileReader.getDescriptionForNumber(number, language, script, region);
    }
}
PhoneNumberToCarrierMapper.instance = null;
PhoneNumberToCarrierMapper.LIB_MAPPING_DATA_DIRECTORY = path_1.default.join(__dirname, "..", "resources", "binary");
__decorate([
    measure_1.default
], PhoneNumberToCarrierMapper.prototype, "getNameForValidNumber", null);
__decorate([
    final_1.default
], PhoneNumberToCarrierMapper, "LIB_MAPPING_DATA_DIRECTORY", void 0);
exports.PhoneNumberToCarrierMapper = PhoneNumberToCarrierMapper;
exports.default = PhoneNumberToCarrierMapper;
