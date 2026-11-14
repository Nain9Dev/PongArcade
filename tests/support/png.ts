import { inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Samples per pixel of the colour types `decodePng` reads: truecolour without and with alpha. */
const SAMPLES: Readonly<Record<number, number>> = { 2: 3, 6: 4 };

export interface PngHeader {
  readonly width: number;
  readonly height: number;
  readonly bitDepth: number;
  readonly colourType: number;
  readonly interlaced: boolean;
}

export interface Bitmap {
  readonly width: number;
  readonly height: number;
  /** Four bytes per pixel (red, green, blue, alpha), row by row from the top. */
  readonly rgba: Buffer;
}

/** Reads the IHDR chunk, which the PNG format puts right after the signature. */
export function readPngHeader(file: Buffer): PngHeader {
  if (!file.subarray(0, 8).equals(SIGNATURE) || file.toString('latin1', 12, 16) !== 'IHDR') {
    throw new Error('not a PNG file');
  }
  return {
    width: file.readUInt32BE(16),
    height: file.readUInt32BE(20),
    bitDepth: file.readUInt8(24),
    colourType: file.readUInt8(25),
    interlaced: file.readUInt8(28) !== 0,
  };
}

/** The value a scanline filter predicts for a byte from its already decoded neighbours. */
function predict(filter: number, left: number, up: number, upLeft: number): number {
  switch (filter) {
    case 0:
      return 0;
    case 1:
      return left;
    case 2:
      return up;
    case 3:
      return (left + up) >> 1;
    case 4: {
      // Paeth: whichever neighbour is closest to the linear estimate, ties in this order.
      const estimate = left + up - upLeft;
      const fromLeft = Math.abs(estimate - left);
      const fromUp = Math.abs(estimate - up);
      const fromUpLeft = Math.abs(estimate - upLeft);
      if (fromLeft <= fromUp && fromLeft <= fromUpLeft) return left;
      return fromUp <= fromUpLeft ? up : upLeft;
    }
    default:
      throw new Error(`unknown PNG scanline filter ${filter}`);
  }
}

/**
 * Decodes the pixels of a PNG with `node:zlib` alone, so the icon tests need no image library.
 *
 * It reads what the install icons are saved as: 8 bits per sample, truecolour with or without
 * alpha, not interlaced. Any other encoding throws instead of being read wrongly.
 */
export function decodePng(file: Buffer): Bitmap {
  const { width, height, bitDepth, colourType, interlaced } = readPngHeader(file);
  const samples = SAMPLES[colourType];
  if (bitDepth !== 8 || samples === undefined || interlaced) {
    throw new Error(
      `unsupported PNG encoding (bit depth ${bitDepth}, colour type ${colourType}, ` +
        `interlaced ${interlaced}): save the icon as 8-bit truecolour, not interlaced`,
    );
  }

  const compressed: Buffer[] = [];
  for (let at = 8; at < file.length; ) {
    const length = file.readUInt32BE(at);
    if (file.toString('latin1', at + 4, at + 8) === 'IDAT') {
      compressed.push(file.subarray(at + 8, at + 8 + length));
    }
    at += 12 + length;
  }
  const filtered = inflateSync(Buffer.concat(compressed));

  // Every scanline is one filter byte followed by the filtered samples of the row.
  const stride = width * samples;
  if (filtered.length !== height * (stride + 1)) throw new Error('truncated PNG pixel data');
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y += 1) {
    const row = y * (stride + 1);
    const filter = filtered.readUInt8(row);
    for (let x = 0; x < stride; x += 1) {
      const at = y * stride + x;
      const left = x >= samples ? pixels.readUInt8(at - samples) : 0;
      const up = y > 0 ? pixels.readUInt8(at - stride) : 0;
      const upLeft = x >= samples && y > 0 ? pixels.readUInt8(at - stride - samples) : 0;
      const value = filtered.readUInt8(row + 1 + x) + predict(filter, left, up, upLeft);
      pixels.writeUInt8(value & 0xff, at);
    }
  }

  if (samples === 4) return { width, height, rgba: pixels };
  const rgba = Buffer.alloc(width * height * 4, 0xff);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    pixels.copy(rgba, pixel * 4, pixel * 3, pixel * 3 + 3);
  }
  return { width, height, rgba };
}
