import assert from 'assert'
import { StringDecoder } from 'string_decoder';
import os from 'os';
import measure from './decorators/measure';

const STREAM_MAGIC = 0xaced; // short (2 bytes)
const STREAM_VERSION = 5; // short 
const TC_NULL = 0x70; // (1 byte)
const TC_REFERENCE = 0x71;
const TC_CLASSDESC = 0x72;
const TC_OBJECT = 0x73;
const TC_STRING = 0x74;
const TC_ARRAY = 0x75;
const TC_CLASS = 0x76;
const TC_BLOCKDATA = 0x77; // used
const TC_ENDBLOCKDATA = 0x78; 
const TC_RESET = 0x79;
const TC_BLOCKDATALONG = 0x7A; // used
const TC_EXCEPTION = 0x7B;
const TC_LONGSTRING =  0x7C;
const TC_PROXYCLASSDESC =  0x7D;
const TC_ENUM =  0x7E;
const baseWireHandle = 0x7E0000;
const SC_WRITE_METHOD = 0x01; 
const SC_BLOCK_DATA = 0x08;   
const SC_SERIALIZABLE = 0x02;
const SC_EXTERNALIZABLE = 0x04;
const SC_ENUM = 0x10;

export class MappingFileProvider {
  private numOfEntries = 0;
  private countryCallingCodes!: number[];
  private availableLanguages!: Set<string>[];

  private static normalizationMap: Map<string, string>
  private static LOCALE_NORMALIZATION_MAP: Map<string, string>;
  static {
    this.normalizationMap = new Map<string, string>();
    this.normalizationMap.set("zh_TW", "zh_Hant");
    this.normalizationMap.set("zh_HK", "zh_Hant");
    this.normalizationMap.set("zh_MO", "zh_Hant");
    this.LOCALE_NORMALIZATION_MAP = new Map([...this.normalizationMap]);
  }

  /*
   * @param availableDataFiles  a map from country calling codes to sets of languages in which data
   *     files are available for the specific country calling code. The map is sorted in ascending
   *     order of the country calling codes as integers.
   * 
   *  MAP( 1 (us) -> SET['en'] ; 91 (india) -> SET['en', 'zh'])
   */
  public readFileConfigs(availableDataFiles: Map<number, Set<string>>): void {
    this.numOfEntries = availableDataFiles.size;
    this.countryCallingCodes = Array(this.numOfEntries);
    this.availableLanguages = Array(this.numOfEntries);
    let index = 0;
    for (const countryCallingCode of availableDataFiles.keys()) {
      this.countryCallingCodes[index++] = countryCallingCode;
      this.availableLanguages.push(new Set(availableDataFiles.get(countryCallingCode)));
    }
  }

  // reads configfile called config encoded with java serialization
  @measure
  public readExternal(objectInput: Buffer): void | never {
    // assert.deepStrictEqual(objectInput.readUInt16BE(0), STREAM_MAGIC)
    let blockLimit = 1024+8+1 // fail for first time at 1033. so any reads from starting from 1030-1033 overlap
    this.numOfEntries = objectInput.readUInt32BE(9); // skip magic number, version serialization, and first block data
    // assert.deepStrictEqual(this.numOfEntries, 229) // post-facto knowledge
    if (!this.countryCallingCodes || this.countryCallingCodes.length < this.numOfEntries) {
      this.countryCallingCodes = Array(this.numOfEntries);
    }
    this.availableLanguages ||= [];

    let overlappedSpace = 0;
    let elementSize: number;
    let offset = 13
    for (let i = 0; i < this.numOfEntries; i++) {
        this.countryCallingCodes[i] = objectInput.readUInt32BE(offset);
        offset += 4

        // ptr=1029 np, ptr=1030 overlap=1
        if (offset + 4 > blockLimit ) { //1030 less than 1 4-byte read from block end
          overlappedSpace = offset + 4 - blockLimit
          assert.deepStrictEqual(objectInput.readUInt32BE(offset), TC_BLOCKDATALONG)
          offset += 4
          blockLimit = objectInput.readUInt32BE(offset) + blockLimit + 5
          offset += 4
        }

        let numOfLangs: number;
        if (overlappedSpace !== 0) {
          overlappedSpace = 0
          numOfLangs = objectInput.readUInt8(offset);
          offset += 1
        } else {
          numOfLangs = objectInput.readUInt32BE(offset);
          offset += 4
        }

        const setOfLangs: Set<string> = new Set<string>();
        for (let j = 0; j < numOfLangs; j++) {
          const decoder = new StringDecoder('utf8');
          elementSize = objectInput.readUInt16BE(offset)
          offset += 2
          const lang = decoder.write(objectInput.slice(offset, offset + elementSize))
          setOfLangs.add(lang);
          offset += elementSize
        }
        this.availableLanguages.push(setOfLangs);
    }
  }


  /**
   * The string contains one line for each
   * country calling code. The country calling code is followed by a '|' and then a list of
   * comma-separated languages sorted in ascending order.
   */
  public toString(): string {
    let output = "";
    for (let i = 0; i < this.numOfEntries; i++) {
        output += this.countryCallingCodes[i];
        output += '|';
        const sortedSetOfLangs: Set<string> = new Set<string>(this.availableLanguages[i]);
        for (const lang of sortedSetOfLangs) {
            output += lang;
            output += ',';
        }
        output += os.EOL;
    }
    return output;
  }

  /**
   * Gets the name of the file that contains the mapping data for the {@code countryCallingCode} in
   * the language specified.
   *
   * @param countryCallingCode  the country calling code of phone numbers which the data file
   *     contains
   * @param language  two or three-letter lowercase ISO language codes as defined by ISO 639. Note
   *     that where two different language codes exist (e.g. 'he' and 'iw' for Hebrew) we use the
   *     one that Java/Android canonicalized on ('iw' in this case).
   * @param script  four-letter titlecase (the first letter is uppercase and the rest of the letters
   *     are lowercase) ISO script codes as defined in ISO 15924
   * @param region  two-letter uppercase ISO country codes as defined by ISO 3166-1
   * @return  the name of the file, or empty string if no such file can be found
   */
  public getFileName(countryCallingCode: number, language: string, script: string, region: string) {
    // console.log('in get filenames', this.countryCallingCodes, countryCallingCode, language,script,region)
    if (language.length === 0) return "";
    if (!this.countryCallingCodes?.length) return ''
    let index = this.countryCallingCodes.indexOf(countryCallingCode);
    if (index < 0) return "";
    const setOfLangs: Set<string> = this.availableLanguages[index];
    if (setOfLangs.size > 0) {
        const languageCode = this.findBestMatchingLanguageCode(setOfLangs, language, script, region);
        if (languageCode.length > 0) {
            let fileName = '';
            fileName += countryCallingCode + '_' + languageCode;
            return fileName
        }
    }
    return "";
  }

  private findBestMatchingLanguageCode(
    setOfLangs: Set<string>, language: string, script: string, region: string): "" | string {
    const fullLocale = this.constructFullLocale(language, script, region);
    let normalizedLocale: string | undefined  = MappingFileProvider.LOCALE_NORMALIZATION_MAP.get(fullLocale);
    if (normalizedLocale && setOfLangs.has(normalizedLocale)) return normalizedLocale;
    if (setOfLangs.has(fullLocale)) return fullLocale;

    if (this.onlyOneOfScriptOrRegionIsEmpty(script, region)) {
      if (setOfLangs.has(language)) return language;
    } else if (script.length > 0 && region.length > 0) {
      const langWithScript: string = `${language}_${script}`;
      if (setOfLangs.has(langWithScript)) return langWithScript;
      const langWithRegion: string = `${language}_${region}`
      if (setOfLangs.has(langWithRegion)) return langWithRegion;
      if (setOfLangs.has(language)) return language;
      
    }
    return "";
  }

  private onlyOneOfScriptOrRegionIsEmpty(script: string, region: string): boolean {
      return (script.length === 0 && region.length > 0) || (region.length === 0 && script.length > 0);
  }

  private constructFullLocale(language: string, script: string, region: string): string {
      let fullLocale = language;
      fullLocale = this.appendSubsequentLocalePart(script, fullLocale);
      fullLocale = this.appendSubsequentLocalePart(region, fullLocale);
      return fullLocale;
  }

  private appendSubsequentLocalePart(subsequentLocalePart: string, fullLocale: string): string {
      if (subsequentLocalePart.length > 0) {
          fullLocale += subsequentLocalePart;
      }
      return fullLocale
  }

}

export default MappingFileProvider

