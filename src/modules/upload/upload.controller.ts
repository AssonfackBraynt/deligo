import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { ok } from '@common/dto/api-response.dto';
import { RoleCode } from '@common/enums/role-code.enum';
import { AuthenticatedUser } from '@common/types/authenticated-user.type';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('Files')
@Controller('files')
export class UploadController {
  constructor(private readonly service: UploadService) {}

  @Post('upload')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider, RoleCode.Admin)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file. Encrypted at rest in Supabase.' })
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

  @Get(':id/content')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider, RoleCode.Admin)
  @ApiOperation({ summary: 'Stream decrypted file content. Provider can only access own files.' })
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
