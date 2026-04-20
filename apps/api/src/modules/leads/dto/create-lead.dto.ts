import { Transform } from 'class-transformer';
import { IsEmail, IsISO31661Alpha2, IsOptional, IsString, Length } from 'class-validator';
import { sanitizePlainText } from '../../../core/security/sanitize';

export class CreateLeadDto {
  @IsString()
  @Length(1, 120)
  @Transform(({ value }) => sanitizePlainText(value))
  name!: string;

  @IsEmail()
  @Length(3, 254)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  businessEmail!: string;

  @IsISO31661Alpha2()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  country!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  @Transform(({ value }) => sanitizePlainText(value))
  message?: string;
}
