import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { ok } from '@common/dto/api-response.dto';
import { RoleCode } from '@common/enums/role-code.enum';
import { AuthenticatedUser } from '@common/types/authenticated-user.type';
import { OptionalJwtAuthGuard } from '@common/guards/optional-jwt-auth.guard';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('Files')
@Controller('files')
export class UploadController {
  constructor(private readonly service: UploadService) {}

  /** Any authenticated user may upload (customers for item photos; providers/admins for documents). */
  @Post('upload')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file. Encrypted at rest in the database.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        documentPurpose: { type: 'string' },
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const record = await this.service.upload({
      buffer: file.buffer,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      uploadedByUserId: user.id,
      documentPurpose: dto.documentPurpose,
    });

    return ok({
      id: record.id,
      originalFilename: record.originalFilename,
      mimeType: record.mimeType,
      fileSizeBytes: record.fileSizeBytes?.toString() ?? null,
      documentPurpose: record.documentPurpose,
      createdAt: record.createdAt,
    });
  }

  /** Public endpoint — no login required. Accepts images only (JPEG, PNG, WebP). Used by the delivery request item form. */
  @Post('item-photo')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an item photo without authentication. Images only, max 10 MB.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async uploadItemPhoto(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const IMAGES = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!IMAGES.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, or WebP images are allowed for item photos');
    }

    const record = await this.service.upload({
      buffer: file.buffer,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      uploadedByUserId: user?.id ?? undefined,
      documentPurpose: 'item_photo',
    });

    return ok({
      id: record.id,
      originalFilename: record.originalFilename,
      mimeType: record.mimeType,
      fileSizeBytes: record.fileSizeBytes?.toString() ?? null,
    });
  }

  @Get(':id/content')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider, RoleCode.Admin)
  @ApiOperation({ summary: 'Stream decrypted file content.' })
  async getContent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.service.getFileContent(id, user.id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-store');
    res.end(buffer);
  }

  @Get(':id/meta')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider, RoleCode.Admin)
  @ApiOperation({ summary: 'Get file metadata (no content).' })
  async getMeta(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const record = await this.service.getFileRecord(id);
    return ok({
      id: record.id,
      originalFilename: record.originalFilename,
      mimeType: record.mimeType,
      fileSizeBytes: record.fileSizeBytes?.toString() ?? null,
      documentPurpose: record.documentPurpose,
      createdAt: record.createdAt,
    });
  }
}
