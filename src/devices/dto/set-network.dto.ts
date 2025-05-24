// src/devices/dto/set-network.dto.ts
import { IsIP, IsString } from 'class-validator';

export class SetNetworkDto {
  @IsIP()
  ip: string;

  @IsIP()
  netmask: string; // ✅ corrigido de "mask" para "netmask"

  @IsIP()
  gateway: string;

  @IsIP()
  dns: string;

  @IsString()
  hostname: string;
}
