import type {
  PhoneNumber,
  CarrierCode,
  CountryCode,
} from "libphonenumber-js/types";
import { parsePhoneNumber } from "libphonenumber-js";
import PrefixFileReader from "./PrefixFileReader";
import path from "path";
import measure from "./decorators/measure";
import final from "./decorators/final";

declare const __dirname: string;
export class PhoneNumberToCarrierMapper {
  private static readonly instance: PhoneNumberToCarrierMapper | null = null;
  private prefixFileReader: PrefixFileReader | null = null;
  @final private static LIB_MAPPING_DATA_DIRECTORY = path.join(
    __dirname,
    "..",
    "resources",
    "binary"
  );

  private constructor(MAPPING_DATA_DIRECTORY: string) {
    this.prefixFileReader = new PrefixFileReader(MAPPING_DATA_DIRECTORY);
  }

  // @synchronized(2)
  public static getInstance(): PhoneNumberToCarrierMapper {
    if (this.instance == null) {
      this.instance = new PhoneNumberToCarrierMapper(
        this.LIB_MAPPING_DATA_DIRECTORY
      );
    }
    return this.instance;
  }

  @measure
  async getNameForValidNumber(
    number: PhoneNumber | string,
    language: string = "en",
    script: string = "",
    region: CountryCode | undefined = number.country
  ): Promise<CarrierCode> {
    if (typeof number === "string") number = parsePhoneNumber(number);
    return this.prefixFileReader.getDescriptionForNumber(
      number,
      language,
      script,
      region
    );
  }
}

export default PhoneNumberToCarrierMapper;
