import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CryptoService } from '@common/services/crypto.service';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async upload(opts: {
    buffer: Buffer;
    originalFilename: string;
    mimeType: string;
    uploadedByUserId?: string;
    providerProfileId?: string;
    documentPurpose?: string;
  }) {
    if (opts.buffer.length > MAX_BYTES) {
      throw new PayloadTooLargeException('File exceeds 10 MB limit');
    }
    if (!ALLOWED_MIME_TYPES.has(opts.mimeType)) {
      throw new UnsupportedMediaTypeException(
        'Only JPEG, PNG, WebP, and PDF files are allowed',
      );
    }

    const fileId = randomUUID();

    const checksum = crypto
      .createHash('sha256')
      .update(opts.buffer)
      .digest('hex');

    const { ciphertext, iv } = this.crypto.encrypt(opts.buffer);

    const record = await this.prisma.uploadedFile.create({
      data: {
        id: fileId,
        uploadedByUserId: opts.uploadedByUserId ?? null,
        providerProfileId: opts.providerProfileId ?? null,
        storageProvider: 'database',
        originalFilename: opts.originalFilename,
        mimeType: opts.mimeType,
        fileSizeBytes: BigInt(opts.buffer.length),
        visibility: 'private',
        checksum,
        isEncrypted: true,
        encryptionIv: iv,
        encryptedData: new Uint8Array(ciphertext),
        documentPurpose: opts.documentPurpose ?? null,
      },
    });

    return record;
  }

  async getFileContent(fileId: string, requestingUserId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const file = await this.prisma.uploadedFile.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt) throw new NotFoundException('File not found');

    // Item photos uploaded anonymously (no uploadedByUserId) are accessible to any authenticated user
    const isPublicItemPhoto = !file.uploadedByUserId && file.documentPurpose === 'item_photo';
    const isOwner = file.uploadedByUserId === requestingUserId;

    if (!isPublicItemPhoto && !isOwner) {
      throw new ForbiddenException('Access denied');
    }

    if (!file.encryptedData) throw new NotFoundException('File content not found');

    const encryptedBuffer = Buffer.from(file.encryptedData as Uint8Array);

    const plainBuffer = file.isEncrypted && file.encryptionIv
      ? this.crypto.decrypt(encryptedBuffer, file.encryptionIv)
      : encryptedBuffer;

    return { buffer: plainBuffer, mimeType: file.mimeType ?? 'application/octet-stream' };
  }

  async getFileRecord(fileId: string) {
    const file = await this.prisma.uploadedFile.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt) throw new NotFoundException('File not found');
    return file;
  }
}
