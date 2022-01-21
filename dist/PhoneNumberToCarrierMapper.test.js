"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const libphonenumber_js_1 = require("libphonenumber-js");
const PhoneNumberToCarrierMapper_1 = __importDefault(require("./PhoneNumberToCarrierMapper"));
const assert_1 = __importDefault(require("assert"));
describe("PhoneNumberToCarrierMapper#getNameForValidNumber", function () {
    const carrierMapper = PhoneNumberToCarrierMapper_1.default.getInstance();
    it("should return a carrier name", async function () {
        {
            const ch1_phone = (0, libphonenumber_js_1.parsePhoneNumber)(`+41798765432`);
            const CH_Swisscom = await carrierMapper.getNameForValidNumber(ch1_phone);
            assert_1.default.deepStrictEqual(CH_Swisscom, "Swisscom");
        }
        {
            const in1_phone = (0, libphonenumber_js_1.parsePhoneNumber)(`+918369110173`);
            const IN_Reliance_Jio = await carrierMapper.getNameForValidNumber(in1_phone);
            assert_1.default.deepStrictEqual(IN_Reliance_Jio, "Reliance Jio");
        }
        {
            const IN_Vodafone = await carrierMapper.getNameForValidNumber((0, libphonenumber_js_1.parsePhoneNumber)(`+919825098250`));
            assert_1.default.deepStrictEqual(IN_Vodafone, "Vodafone");
        }
        {
            const GB_Vodafone = await carrierMapper.getNameForValidNumber((0, libphonenumber_js_1.parsePhoneNumber)(`+447444111111`));
            assert_1.default.deepStrictEqual(GB_Vodafone, "Vodafone");
        }
        {
            const cn1_phone = (0, libphonenumber_js_1.parsePhoneNumber)(`+8618216318527`);
            {
                const CN_中国移动 = await carrierMapper.getNameForValidNumber(cn1_phone, "zh_Hant");
                assert_1.default.deepStrictEqual(CN_中国移动.normalize("NFD"), "中國移動");
            }
            {
                const CN_ChinaMobile = await carrierMapper.getNameForValidNumber(cn1_phone, "en");
                assert_1.default.deepStrictEqual(CN_ChinaMobile, "China Mobile");
            }
        }
        {
            const cn2_phone = (0, libphonenumber_js_1.parsePhoneNumber)(`+8619912345678`);
            {
                const CN_中国电信 = await carrierMapper.getNameForValidNumber(cn2_phone, "zh");
                assert_1.default.deepStrictEqual(CN_中国电信.normalize("NFD"), "中国电信");
            }
            {
                const CN_ChinaTelecom = await carrierMapper.getNameForValidNumber(cn2_phone, "en");
                assert_1.default.deepStrictEqual(CN_ChinaTelecom, "China Telecom");
            }
        }
    });
});
