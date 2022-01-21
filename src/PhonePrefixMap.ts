import { type PhoneNumber } from 'libphonenumber-js/mobile';
import PhonePrefixMapStorageStrategy from './PhonePrefixMapStorageStrategy';
import FlyweightMapStorage from './FlyweightMapStorage';
interface Externalizable {
    writeExternal(output: Buffer): void | never;
    readExternal(input: Buffer): void | never;
}

export class PhonePrefixMap implements Externalizable {
  private phonePrefixMapStorage!: PhonePrefixMapStorageStrategy;

  private constructor(){}

  public getPhonePrefixMapStorage() {
    return this.phonePrefixMapStorage;
  }

  public createDefaultMapStorage(): PhonePrefixMapStorageStrategy {
    throw 'unused';
    return new DefaultMapStorage();
  }

  private createFlyweightMapStorage(): PhonePrefixMapStorageStrategy {
    return new FlyweightMapStorage();
  }

  private static getSizeOfPhonePrefixMapStorage(mapStorage: PhonePrefixMapStorageStrategy, phonePrefixMap: Map<number, string>): never | number {
    // mapStorage.readFromSortedMap(phonePrefixMap);
    // // const objectOutputStream = new Writable({write: (a,b,cb) => ()=>{}});
    // mapStorage.writeExternal(objectOutputStream);
    // // objectOutputStream.flush();
    // const sizeOfStorage: number = byteArrayOutputStream.size();
    // objectOutputStream.close();
    // return sizeOfStorage;
    return 1;
  }

  public getSmallerMapStorage(phonePrefixMap: Map<number, string>): PhonePrefixMapStorageStrategy {
    try {
      const flyweightMapStorage: PhonePrefixMapStorageStrategy = this.createFlyweightMapStorage();
      const sizeOfFlyweightMapStorage = PhonePrefixMap.getSizeOfPhonePrefixMapStorage(flyweightMapStorage,
                                                                     phonePrefixMap);

      // const defaultMapStorage: PhonePrefixMapStorageStrategy = this.createDefaultMapStorage();
      // const sizeOfDefaultMapStorage = PhonePrefixMap.getSizeOfPhonePrefixMapStorage(defaultMapStorage,
      //                                                              phonePrefixMap);

      // return sizeOfFlyweightMapStorage < sizeOfDefaultMapStorage
      //     ? flyweightMapStorage : defaultMapStorage;
      return flyweightMapStorage
    } catch (e) {
      return this.createFlyweightMapStorage();
    }
  }

  public readPhonePrefixMap(sortedPhonePrefixMap: Map<number, string> ) {
    this.phonePrefixMapStorage = this.getSmallerMapStorage(sortedPhonePrefixMap);
  }

  public readExternal(objectInput: Buffer): void | never {
    // this.phonePrefixMapStorage = new DefaultMapStorage();
    this.phonePrefixMapStorage ||= new FlyweightMapStorage();

    // java version reads a boolean here to see if it is flyweight or default storage
    // console.log('read external phoneprefixmap')
    this.phonePrefixMapStorage.readExternal(objectInput);
  }

  // unused
  public writeExternal(objectOutput: Buffer): void | never  {
    throw 'unimplemented'
    // objectOutput.writeInt32LE(~~(this.phonePrefixMapStorage instanceof FlyweightMapStorage), 5);
    // this.phonePrefixMapStorage.writeExternal(objectOutput);
  }

  public lookup(number: PhoneNumber | number):  null | string | "" {
    if (typeof number !== 'number') {
      let phonePrefix: number = parseInt(`${number.countryCallingCode}${number.nationalNumber}`);
      return this.lookup(phonePrefix);
    }
    const numOfEntries = this.phonePrefixMapStorage.getNumOfEntries();
    // console.log(`phonePrefixMap.lookup numOfEntries`,numOfEntries)
    if (numOfEntries === 0) return null;
    let phonePrefix = number; 
    let currentIndex = numOfEntries - 1;
    let currentSetOfLengths: Set<number> = this.phonePrefixMapStorage.getPossibleLengths();
    const arrayOfLengths = [...currentSetOfLengths]
    while (arrayOfLengths.length > 0) {
      const possibleLength = <number>arrayOfLengths.pop()!;
      let phonePrefixStr = `${phonePrefix}`;
      if (phonePrefixStr.length > possibleLength) phonePrefix = parseInt(phonePrefixStr.slice(0, possibleLength));
      currentIndex = this.binarySearch(0, currentIndex, phonePrefix);
      if (currentIndex < 0) return null;
      const currentPrefix = this.phonePrefixMapStorage.getPrefix(currentIndex);
      if (phonePrefix === currentPrefix) return this.phonePrefixMapStorage.getDescription(currentIndex);
    }
    return null;
  }

  private binarySearch(start: number, end: number, value: number): number {
      let mid = 0;
      while (start <= end) {
        mid = start + end >>> 1;
        let currentValue = this.phonePrefixMapStorage.getPrefix(mid);
        if (currentValue === value) {
            return mid;
        } else if (currentValue > value) {
            mid--;
            end = mid;
        } else {
            start = mid + 1;
        }
      }
      return mid;
  }

  public toString() {
      return this.phonePrefixMapStorage.toString();
  }

  [Symbol.toStringTag] = 'PhonePrefixMap';

}

export default PhonePrefixMap;