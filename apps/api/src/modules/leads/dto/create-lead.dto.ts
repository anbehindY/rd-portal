import { Transform } from 'class-transformer';
import { IsEmail, IsISO31661Alpha2, IsString, Length } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @Length(1, 120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsEmail()
  @Length(3, 254)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  businessEmail!: string;

  @IsISO31661Alpha2()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  country!: string;

  @IsString()
  @Length(1, 2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  message!: string;
}
