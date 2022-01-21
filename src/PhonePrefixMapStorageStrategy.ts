import os from "os";
import PrefixFileReader from "./PrefixFileReader";
export abstract class PhonePrefixMapStorageStrategy {
  protected numOfEntries = 0;
  protected possibleLengths: Set<number> = new Set<number>();

  public abstract getPrefix(index: number): number;

  public abstract getDescription(
    index: number
  ): Awaited<
    ReturnType<typeof PrefixFileReader.prototype.getDescriptionForNumber>
  >;

  public abstract readFromSortedMap(
    sortedPhonePrefixMap: Map<number, string>
  ): void;

  public abstract readExternal(objectInput: Buffer): void | never;

  public abstract writeExternal(objectOutput: Buffer): void | never;

  public getNumOfEntries(): number {
    return this.numOfEntries;
  }

  public getPossibleLengths(): Set<number> {
    this.possibleLengths = new Set(
      [...this.possibleLengths].sort((a, b) => a - b)
    );
    return this.possibleLengths;
  }

  public toString(): string {
    let output = "";
    const numOfEntries = this.getNumOfEntries();

    for (let i = 0; i < numOfEntries; i++) {
      output += this.getPrefix(i).toString();
      output += "|";
      output += this.getDescription(i);
      output += os.EOL;
    }
    return output;
  }
}

export default PhonePrefixMapStorageStrategy;
