import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly bucket: string;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL');
    // Prefer the service-role key so uploads bypass bucket RLS policies.
    // Falls back to the anon key if SUPABASE_SERVICE_KEY is not set.
    const key =
      config.get<string>('SUPABASE_SERVICE_KEY') ??
      config.getOrThrow<string>('SUPABASE_ANON_KEY');

    this.client = createClient(url, key);
    this.bucket = config.getOrThrow<string>('SUPABASE_BUCKET');
  }

  async upload(objectKey: string, data: Buffer, mimeType: string): Promise<string> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(objectKey, data, { contentType: mimeType, upsert: true });

    if (error) {
      this.logger.error(`Supabase upload failed [${objectKey}]: ${error.message}`);
      throw new InternalServerErrorException(
        `File storage failed: ${error.message}`,
      );
    }

    const { data: urlData } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(objectKey);

    return urlData.publicUrl;
  }

  async download(objectKey: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(objectKey);

    if (error || !data) {
      this.logger.error(`Supabase download failed [${objectKey}]: ${error?.message}`);
      throw new InternalServerErrorException(
        `File retrieval failed: ${error?.message ?? 'unknown'}`,
      );
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async delete(objectKey: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([objectKey]);
    if (error) {
      this.logger.warn(`Supabase delete failed [${objectKey}]: ${error.message}`);
    }
  }
}
