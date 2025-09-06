import { PartialType } from '@nestjs/mapped-types';
import { CreateContactDto } from './createContactDto';

export class UpdateContactDto extends PartialType(CreateContactDto) {}
