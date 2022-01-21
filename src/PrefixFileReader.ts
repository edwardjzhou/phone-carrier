import fs from 'fs';
import path from 'path';
import { type PhoneNumber } from 'libphonenumber-js/mobile';
import PhonePrefixMap from './PhonePrefixMap';
import MappingFileProvider from './MappingFileProvider';
import final from './decorators/final';
import measure from './decorators/measure';

export class PrefixFileReader {
  @final private phonePrefixDataDirectory: string;
  @final private loadingMappingFile: Promise<void>;
  @final private mappingFileProvider: MappingFileProvider = new MappingFileProvider();
  @final private availablePhonePrefixMaps: Map<string, PhonePrefixMap> = new Map(); 

  public constructor(phonePrefixDataDirectory: string){
      this.phonePrefixDataDirectory = phonePrefixDataDirectory;
      this.loadingMappingFile = this.loadMappingFileProvider();
  }

  private loadMappingFileProvider(): Promise<void> {
    return new Promise((res) => {
      const configPath = path.join(this.phonePrefixDataDirectory, 'config');
      const source = fs.createReadStream(configPath);
      const configSize = fs.statSync(configPath).size;
      const bufs: Buffer[] = []
      source.on('data', (buf: Buffer) => {
        bufs.push(buf)
      }).on('end', () => {    
        this.mappingFileProvider.readExternal(Buffer.concat(bufs, configSize));
        res()
      })
    })
  }

  @measure
  public async getDescriptionForNumber(number: PhoneNumber, language: string = 'en', script: string = "", region: string = ""): Promise<"" | string>{
    const countryCallingCode: number = parseInt(<string>number.countryCallingCode);
    const phonePrefix = countryCallingCode !== 1
        ? countryCallingCode : (1000 + (+number.nationalNumber / 10000000)|0);
    const phonePrefixDescriptions: PhonePrefixMap | null | undefined = await this.getPhonePrefixDescriptions(phonePrefix, language, script, region);
    let description = phonePrefixDescriptions ? phonePrefixDescriptions.lookup(number) : null;

    if ((description == null || description.length == 0) && this.mayFallBackToEnglish(language)) {
      const defaultMap: PhonePrefixMap | null | undefined = await this.getPhonePrefixDescriptions(phonePrefix, "en", "", "");
      if (!defaultMap) return "";
      description = defaultMap.lookup(number);
    }
    return description != null ? description : "";
  }

  private mayFallBackToEnglish(lang: string): boolean {
    return lang !== "zh" && lang !== "ja" && lang !== "ko";
  }

  @measure
  private async getPhonePrefixDescriptions(prefixMapKey: number, language: string, script: string, region: string): Promise<null | PhonePrefixMap | undefined> {
    await this.loadingMappingFile;
    const fileName: string = this.mappingFileProvider.getFileName(prefixMapKey, language, script, region);

    if (fileName.length === 0) return null;
    if (!this.availablePhonePrefixMaps.has(fileName)) await this.loadPhonePrefixMapFromFile(fileName);
    return this.availablePhonePrefixMaps.get(fileName);
  }

  private loadPhonePrefixMapFromFile(fileName: string): Promise<void> {
    return new Promise((res) => {
      const rs = fs.createReadStream(path.join(this.phonePrefixDataDirectory, fileName));
      let bufs = Buffer.alloc(0);
      rs.on('data', (buf: Buffer) => {
        bufs = Buffer.concat([bufs, buf])
      }).on('end', () => {
        const prefixMap: PhonePrefixMap = new PhonePrefixMap();
        prefixMap.readExternal(bufs);
        this.availablePhonePrefixMaps.set(fileName, prefixMap);
        res()
      })
    })
  }
}

export default PrefixFileReader;
