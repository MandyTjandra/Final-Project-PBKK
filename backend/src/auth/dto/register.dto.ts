import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum.js';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsEnum(Role, { message: 'Role must be BREWER, ROASTER, or ADMIN' })
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
