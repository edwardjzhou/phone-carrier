import { parsePhoneNumber } from "libphonenumber-js";
import PhoneNumberToCarrierMapper from "./PhoneNumberToCarrierMapper";
import assert from "assert";

describe("PhoneNumberToCarrierMapper#getNameForValidNumber", function () {
  const carrierMapper = PhoneNumberToCarrierMapper.getInstance();

  it("should return a carrier name", async function () {
    {
      const ch1_phone = parsePhoneNumber(`+41798765432`);
      const CH_Swisscom = await carrierMapper.getNameForValidNumber(ch1_phone);
      assert.deepStrictEqual(CH_Swisscom, "Swisscom");
    }

    {
      const in1_phone = parsePhoneNumber(`+918369110173`);
      const IN_Reliance_Jio = await carrierMapper.getNameForValidNumber(
        in1_phone
      );
      assert.deepStrictEqual(IN_Reliance_Jio, "Reliance Jio");
    }

    {
      const IN_Vodafone = await carrierMapper.getNameForValidNumber(
        parsePhoneNumber(`+919825098250`)
      );
      assert.deepStrictEqual(IN_Vodafone, "Vodafone");
    }

    {
      const GB_Vodafone = await carrierMapper.getNameForValidNumber(
        parsePhoneNumber(`+447444111111`)
      );
      assert.deepStrictEqual(GB_Vodafone, "Vodafone");
    }

    {
      const cn1_phone = parsePhoneNumber(`+8618216318527`);
      {
        // traditional characters
        const CN_中国移动 = await carrierMapper.getNameForValidNumber(
          cn1_phone,
          "zh_Hant"
        );
        assert.deepStrictEqual(CN_中国移动.normalize("NFD"), "中國移動");
      }
      {
        // english
        const CN_ChinaMobile = await carrierMapper.getNameForValidNumber(
          cn1_phone,
          "en"
        );
        assert.deepStrictEqual(CN_ChinaMobile, "China Mobile");
      }
    }

    {
      const cn2_phone = parsePhoneNumber(`+8619912345678`);
      {
        // simplified characters
        const CN_中国电信 = await carrierMapper.getNameForValidNumber(
          cn2_phone,
          "zh"
        );
        assert.deepStrictEqual(CN_中国电信.normalize("NFD"), "中国电信");
      }
      {
        // english
        const CN_ChinaTelecom = await carrierMapper.getNameForValidNumber(
          cn2_phone,
          "en"
        );
        assert.deepStrictEqual(CN_ChinaTelecom, "China Telecom");
      }
    }
  });
});
