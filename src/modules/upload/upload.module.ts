import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CryptoService } from '@common/services/crypto.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [UploadController],
  providers: [UploadService, CryptoService],
  exports: [UploadService, CryptoService],
})
export class UploadModule {}
