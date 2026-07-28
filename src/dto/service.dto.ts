import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class AssignServicesDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of service IDs to subscribe the organization to',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  serviceIds: number[];
}
