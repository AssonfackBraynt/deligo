import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const hex = config.getOrThrow<string>('APP_ENCRYPTION_KEY');
    this.key = Buffer.from(hex, 'hex');
    if (this.key.length !== 32) {
      throw new Error('APP_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
    }
  }

  encrypt(plaintext: Buffer): { ciphertext: Buffer; iv: string } {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGO, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Prepend 16-byte auth tag to ciphertext so we can split on decrypt
    const ciphertext = Buffer.concat([tag, encrypted]);
    return { ciphertext, iv: iv.toString('hex') };
  }

  decrypt(ciphertext: Buffer, ivHex: string): Buffer {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = ciphertext.subarray(0, TAG_BYTES);
    const data = ciphertext.subarray(TAG_BYTES);
    const decipher = crypto.createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  }
}
