import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '+237600000000' })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
