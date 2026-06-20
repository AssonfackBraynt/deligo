import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CryptoService } from '@common/services/crypto.service';
import { SupabaseService } from '@common/services/supabase.service';
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
    private readonly supabase: SupabaseService,
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
    const ext = opts.originalFilename.split('.').pop() ?? 'bin';
    const objectKey = `uploads/${opts.providerProfileId ?? opts.uploadedByUserId ?? 'anonymous'}/${fileId}.${ext}.enc`;

    const checksum = crypto
      .createHash('sha256')
      .update(opts.buffer)
      .digest('hex');

    const { ciphertext, iv } = this.crypto.encrypt(opts.buffer);

    const storageUrl = await this.supabase.upload(objectKey, ciphertext, 'application/octet-stream');

    const record = await this.prisma.uploadedFile.create({
      data: {
        id: fileId,
        uploadedByUserId: opts.uploadedByUserId ?? null,
        providerProfileId: opts.providerProfileId ?? null,
        storageProvider: 'supabase',
        bucketName: process.env.SUPABASE_BUCKET ?? 'deligo-documents',
        objectKey,
        storageUrl,
        originalFilename: opts.originalFilename,
        mimeType: opts.mimeType,
        fileSizeBytes: BigInt(opts.buffer.length),
        visibility: 'private',
        checksum,
        isEncrypted: true,
        encryptionIv: iv,
        documentPurpose: opts.documentPurpose ?? null,
      },
    });

    return record;
  }

  async getFileContent(fileId: string, requestingUserId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const file = await this.prisma.uploadedFile.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt) throw new NotFoundException('File not found');

    const canAccess =
      file.uploadedByUserId === requestingUserId ||
      file.providerProfileId != null; // providers' docs accessible to owner & admin — controller enforces admin check

    if (!canAccess && file.uploadedByUserId !== requestingUserId) {
      throw new ForbiddenException('Access denied');
    }

    const encryptedBuffer = await this.supabase.download(file.objectKey);

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
