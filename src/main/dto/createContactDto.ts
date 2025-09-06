import { IsEmail, IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateContactDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsOptional() @IsString() @MaxLength(255)
    address?: string;

    @IsOptional() @IsString() @MaxLength(80)
    city?: string;

    @IsOptional() @IsString() @MaxLength(80)
    region?: string;

    @IsOptional() @IsString() @MaxLength(80)
    state?: string;

    @IsOptional() @IsString() @MaxLength(30)
    phone?: string;

    @IsOptional() @IsEmail()
    email?: string;

    @IsOptional() @IsString() @MaxLength(120)
    website?: string;
}
