import { IsOptional, IsString } from 'class-validator';

/**
 * Flexible DTO for Xendit webhooks.
 * Xendit sends different payloads depending on the event and product.
 * We rely on manual extraction logic in the service rather than strict validation here.
 */
export class XenditWebhookDto {
  [key: string]: any;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  external_id?: string;

  @IsOptional()
  @IsString()
  event?: string;
}
