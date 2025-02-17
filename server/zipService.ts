import nodeFs from "node:fs";
import nodePath from "node:path";
import zlib from "node:zlib";

/**
 * Zip up a write stream.
 *
 * const zipper = new ZipWriteStream(someOutputPath);
 * zipper.write(someData);
 * zipper.write(moreData);
 * await zipper.end();
 */
export class ZipWriteStream {
  private writeStream: nodeFs.WriteStream;
  private compressedChunks: Buffer[];
  private fileName: string;

  constructor(outputPath: string) {
    this.writeStream = nodeFs.createWriteStream(outputPath);
    this.compressedChunks = [];
    this.fileName = nodePath.basename(outputPath);
  }

  // eslint-disable-next-line
  write(data: any): void {
    this.compressedChunks.push(zlib.deflateRawSync(data));
  }

  async end(): Promise<void> {
    const compressedData = Buffer.concat(this.compressedChunks);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // Local file header signature
    header.writeUInt16LE(20, 4); // Version needed to extract
    header.writeUInt16LE(0, 6); // General purpose bit flag
    header.writeUInt16LE(8, 8); // Compression method (Deflate)
    header.writeUInt16LE(0, 10); // File last modification time
    header.writeUInt16LE(0, 12); // File last modification date
    header.writeUInt32LE(0, 14); // CRC-32 (not calculated)
    header.writeUInt32LE(compressedData.length, 18); // Compressed size
    header.writeUInt32LE(Buffer.concat(this.compressedChunks).length, 22); // Uncompressed size
    header.writeUInt16LE(this.fileName.length, 26); // File name length
    header.writeUInt16LE(0, 28); // Extra field length

    const centralDir = Buffer.alloc(46);
    centralDir.writeUInt32LE(0x02014b50, 0); // Central directory signature
    centralDir.writeUInt16LE(20, 4); // Version made by
    centralDir.writeUInt16LE(20, 6); // Version needed to extract
    centralDir.writeUInt16LE(0, 8); // General purpose bit flag
    centralDir.writeUInt16LE(8, 10); // Compression method
    centralDir.writeUInt16LE(0, 12); // File last modification time
    centralDir.writeUInt16LE(0, 14); // File last modification date
    centralDir.writeUInt32LE(0, 16); // CRC-32
    centralDir.writeUInt32LE(compressedData.length, 20); // Compressed size
    centralDir.writeUInt32LE(compressedData.length, 24); // Uncompressed size
    centralDir.writeUInt16LE(this.fileName.length, 28); // File name length
    centralDir.writeUInt16LE(0, 30); // Extra field length
    centralDir.writeUInt16LE(0, 32); // File comment length
    centralDir.writeUInt16LE(0, 34); // Disk number start
    centralDir.writeUInt16LE(0, 36); // Internal file attributes
    centralDir.writeUInt32LE(32, 38); // External file attributes
    centralDir.writeUInt32LE(0, 42); // Relative offset of local file header

    const endOfCentralDir = Buffer.alloc(22);
    endOfCentralDir.writeUInt32LE(0x06054b50, 0); // End of central directory signature
    endOfCentralDir.writeUInt16LE(0, 4); // Number of this disk
    endOfCentralDir.writeUInt16LE(0, 6); // Number of the disk with the start of the central directory
    endOfCentralDir.writeUInt16LE(1, 8); // Total number of entries in the central directory
    endOfCentralDir.writeUInt16LE(1, 10); // Total number of entries in the central directory
    endOfCentralDir.writeUInt32LE(centralDir.length + header.length + this.fileName.length + compressedData.length, 12); // Central directory size
    endOfCentralDir.writeUInt32LE(header.length + this.fileName.length + compressedData.length, 16); // Offset of start of central directory
    endOfCentralDir.writeUInt16LE(0, 20); // ZIP file comment length

    this.writeStream.write(Buffer.concat([header, Buffer.from(this.fileName, "utf-8"), compressedData, centralDir, Buffer.from(this.fileName, "utf-8"), endOfCentralDir]));
    this.writeStream.end();

    return new Promise((resolve, reject) => {
      this.writeStream.on("finish", resolve);
      this.writeStream.on("error", reject);
    });
  }
}

export function unzipFile(zipFilePath: string, outputFilePath: string): void {
  const zipContent = nodeFs.readFileSync(zipFilePath);
  const fileNameLength = zipContent.readUInt16LE(26);
  const compressedDataStart = 30 + fileNameLength;
  const compressedDataEnd = zipContent.indexOf(Buffer.from("PK\x01\x02"), compressedDataStart);
  const compressedData = zipContent.slice(compressedDataStart, compressedDataEnd !== -1 ? compressedDataEnd : undefined);
  const decompressedData = zlib.inflateRawSync(compressedData);
  nodeFs.writeFileSync(outputFilePath, decompressedData);
}
