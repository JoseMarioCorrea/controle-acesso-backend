import { IsBase64, IsNotEmpty } from 'class-validator';

export class UploadVpnFileDto {
  @IsBase64()
  @IsNotEmpty()
  file: string;
}
