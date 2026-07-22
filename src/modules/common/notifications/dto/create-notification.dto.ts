import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DeviceTypes } from 'src/enums/notification.enum';

export class EnableNotificationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(DeviceTypes)
  deviceType: DeviceTypes;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isActivate: boolean;
}

export class SendNotificationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  body: string;
}
