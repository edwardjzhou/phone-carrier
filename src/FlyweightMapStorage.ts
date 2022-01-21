import PhonePrefixMapStorageStrategy from "./PhonePrefixMapStorageStrategy";
import final from "./decorators/final";

export class FlyweightMapStorage extends PhonePrefixMapStorageStrategy {
    @final private static readonly SHORT_NUM_BYTES: number = Int16Array.BYTES_PER_ELEMENT;
    @final private static readonly INT_NUM_BYTES: number = Int32Array.BYTES_PER_ELEMENT;
    private prefixSizeInBytes!: number; // bytes to store 1 index
    private descIndexSizeInBytes!: number; // bytes to store 1 carrier name
    private phoneNumberPrefixes!: Buffer;
    private descriptionIndexes!: Buffer;
    private descriptionPool!: string[];

    public override getPrefix(index: number): number {
        return FlyweightMapStorage.readWordFromBuffer(this.phoneNumberPrefixes, this.prefixSizeInBytes, index);
    }

    public override getDescription(index: number): string {
        const indexInDescriptionPool: number = FlyweightMapStorage.readWordFromBuffer(this.descriptionIndexes, this.descIndexSizeInBytes, index);
        return <string>(<string[]>this.descriptionPool)[indexInDescriptionPool];
    }

    // unused but here for interface
    public override readFromSortedMap(phonePrefixMap: Map<number, string>): void { 
        throw 'unused'
    }

    private createDescriptionPool(dewscriptionsSet: Set<string>, phonePrefixMap:  Map<number, string>): void {
        throw 'unused'
    }

    private static storeWordInBuffer(buffer: Buffer, wordSize: number, index: number, value: number): void | never {
        throw 'unused'
    }

    // could use a readableStream.read(readSize) 
    public override readExternal(objectInput: Buffer): void | never {
        let offset: number = 5;
        const chunkSize: number = objectInput.readUInt32BE(offset) // 1024 bytes until we need to change up
        offset += 4 

        const isFlyweight: boolean = !!objectInput.readUInt32LE(offset) // Little endian 
        offset += 4

        this.prefixSizeInBytes = objectInput.readUInt32LE(offset); // 4
        offset += 4

        this.descIndexSizeInBytes = objectInput.readUInt32LE(offset); // 2
        offset += 4

        const sizeOfLengths: number = objectInput.readUInt32LE(offset); // 6 differeng lengths for rus phone numbs
        offset += 4
        this.possibleLengths.clear();
        for (let i = 0; i < sizeOfLengths; i++) {
            this.possibleLengths.add(objectInput.readUInt32LE(offset)); // 3-8
            offset += 4
        }

        const descriptionPoolSize = objectInput.readUInt8(offset); // 3
        offset += 1

        if (!this.descriptionPool || this.descriptionPool.length < descriptionPoolSize) {
            this.descriptionPool = Array(descriptionPoolSize);
        }
        for (let i = 0; i < descriptionPoolSize; i++) {
            const descriptionByteLength = objectInput.readUInt16BE(offset)
            offset += 2
            const description = objectInput.slice(offset, offset + descriptionByteLength).toString();
            offset += descriptionByteLength
            this.descriptionPool[i] = description;
        }
        this.readEntries(objectInput, offset);
    }

    // where the 0x7a are:
    // 0x80e = second 0x7a = 2062 = 1033+1024+5
    // 4, 1033, 2062, 3091, 4120
     // problem: 1024 byte space per block
    // for example india 91_en has 2 byte indexes and 4 byte prefixes 
    // so we write 170 (2bytes, 4bytes) for 1020 bytes total and then we write 2bytes for 1022 
    // so now we are about to write 4 bytes: so we write another 2 byte for 1022-1024 and then we have 2 bytes of prefix overlapping with the first 2 bytes of the next 1024 block
    // writes to instance member buffers 
    // can refactor into readexternalword that I sorta removed because of offset checking 
    private readEntries(objectInput: Buffer, offset: number): void | never {
        this.numOfEntries = objectInput.readInt32BE(offset);
        offset += 4

        if (!this.phoneNumberPrefixes || this.phoneNumberPrefixes.byteLength < this.numOfEntries * this.prefixSizeInBytes) {
            this.phoneNumberPrefixes = Buffer.alloc(this.numOfEntries * this.prefixSizeInBytes);
        }
        if (!this.descriptionIndexes || this.descriptionIndexes.length < this.numOfEntries * this.descIndexSizeInBytes) {
            this.descriptionIndexes = Buffer.alloc(this.numOfEntries * this.descIndexSizeInBytes);
        }

        let blockLimit = objectInput.readInt32BE(5) + 8 + 1 // 1024+8+1;
        for (let i = 0; i < this.numOfEntries; i++) {

            if (offset + this.prefixSizeInBytes > blockLimit) {
                const needed = this.prefixSizeInBytes // 4
                const given = blockLimit - offset // 1033 - 1033 = 0
                const remainder = needed - given  // 2 - 0 = 2
                const buf = Buffer.alloc(needed)
                const leftNumBytes = objectInput.copy(buf, 0, offset, blockLimit)
                const rightNumBytes = objectInput.copy(buf, leftNumBytes, blockLimit + 5, blockLimit + 5 + remainder) // slice(1033,1033), slice(1038, 1040)
                offset += given

                // verify offset is at new block size const
                // and update new blocklimit
                if (objectInput.readUInt8(offset) === 0x7a) {
                    offset += 1 // get past the 0x77 or 0x7a descriptor byte
                    blockLimit = objectInput.readUInt32BE(offset) + blockLimit + 5
                    // console.log(blockLimit, '0x7a new block limit')
                    offset += 4
                }
                else if (objectInput.readUInt8(offset) === 0x77) {
                    offset += 1 // get past the 0x77 or 0x7a descriptor byte
                    blockLimit = objectInput.readUInt8(offset) + blockLimit + 5
                    // console.log(blockLimit, '0x77 new block limit')
                    offset += 1
                }
                
                // jump past old remainder in the new block
                offset += remainder

                // write overlapping buffer into instance data 
                const wordIndex = i * this.prefixSizeInBytes
                if (this.prefixSizeInBytes === FlyweightMapStorage.SHORT_NUM_BYTES) {
                    this.phoneNumberPrefixes.writeUInt16BE(buf.readUInt16BE(), wordIndex);
                }
                else if (this.prefixSizeInBytes === FlyweightMapStorage.INT_NUM_BYTES) {
                    this.phoneNumberPrefixes.writeUInt32BE(buf.readUInt32BE(), wordIndex);
                }


            } else {

                if (this.prefixSizeInBytes === FlyweightMapStorage.SHORT_NUM_BYTES) {
                    const wordIndex = i * FlyweightMapStorage.SHORT_NUM_BYTES;
                    this.phoneNumberPrefixes.writeUInt16BE(objectInput.readUInt16BE(offset), wordIndex);
                    offset += 2
                } else if (this.prefixSizeInBytes === FlyweightMapStorage.INT_NUM_BYTES) {
                    const wordIndex = i * FlyweightMapStorage.INT_NUM_BYTES;
                    this.phoneNumberPrefixes.writeUInt32BE(objectInput.readUInt32BE(offset), wordIndex);
                    offset += 4
                }

            }

            // 19769 bytes 91_en
            if (offset + this.descIndexSizeInBytes > blockLimit) {
                const needed = this.descIndexSizeInBytes // 2
                const given = blockLimit - offset // 1033 - 1033 = 0
                const remainder = needed - given  // 2 - 0 = 2
                const buf = Buffer.alloc(needed)
                const leftNumBytes = objectInput.copy(buf, 0, offset, blockLimit)
                const rightNumBytes = objectInput.copy(buf, leftNumBytes, blockLimit + 5, blockLimit + 5 + remainder) // slice(1033,1033), slice(1038, 1040)
                offset += given

                // verify offset is at new block size const
                // and update new blocklimit index
                if (objectInput.readUInt8(offset) === 0x7a) {
                    offset += 1 // get past the 0x77 or 0x7a descriptor byte
                    blockLimit = objectInput.readUInt32BE(offset) + blockLimit + 5
                    // console.log(blockLimit, '0x7a new block limit')
                    offset += 4
                }
                else if (objectInput.readUInt8(offset) === 0x77) {
                    offset += 1 // get past the 0x77 or 0x7a descriptor byte
                    blockLimit = objectInput.readUInt8(offset) + blockLimit + 5
                    // console.log(blockLimit, '0x77 new block limit')
                    offset += 1
                }

                // jump past old remainder in the new block
                offset += remainder

                // write overlapping buffer into instance data 
                const wordIndex = i * this.descIndexSizeInBytes;
                if (this.descIndexSizeInBytes === FlyweightMapStorage.SHORT_NUM_BYTES) {
                    this.descriptionIndexes.writeUInt16BE(buf.readUInt16BE(), wordIndex);
                } 
                else if (this.descIndexSizeInBytes === FlyweightMapStorage.INT_NUM_BYTES) {
                    this.descriptionIndexes.writeUInt32BE(buf.readUInt32BE(), wordIndex);
                }

            } else {

                if (this.descIndexSizeInBytes === FlyweightMapStorage.SHORT_NUM_BYTES) {
                    const wordIndex = i * FlyweightMapStorage.SHORT_NUM_BYTES;
                    this.descriptionIndexes.writeUInt16BE(objectInput.readUInt16BE(offset), wordIndex);
                    offset += 2
                } 
                else if (this.descIndexSizeInBytes === FlyweightMapStorage.INT_NUM_BYTES) {
                    const wordIndex = i * FlyweightMapStorage.INT_NUM_BYTES;
                    this.descriptionIndexes.writeUInt32BE(objectInput.readUInt32BE(offset), wordIndex);
                    offset += 4
                }
            }

        }
        
    }

    private static readWordFromBuffer(buffer: Buffer, wordSize: number, index: number): number {
        const wordIndex = index * wordSize;
        return wordSize === this.SHORT_NUM_BYTES ? buffer.readInt16BE(wordIndex) : buffer.readInt32BE(wordIndex);
    }

    // unused but here for helping implement interface
    private static getOptimalNumberOfBytesForValue(value: number): typeof FlyweightMapStorage.SHORT_NUM_BYTES | typeof FlyweightMapStorage.INT_NUM_BYTES {
        throw 'unused'
        return value <= 0x7FFFFFFF ? this.SHORT_NUM_BYTES : this.INT_NUM_BYTES;
    }

    // unused but here for interface
    public override writeExternal(objectOutput: Buffer): void | never {
        throw 'unimplemented'
    }

    // unused but here for interface
    private static writeExternalWord(objectOutput: Buffer, wordSize: number, inputBuffer: Buffer, index: number): void | never {
        throw 'unimplemented'
    }

}

export default FlyweightMapStorage
