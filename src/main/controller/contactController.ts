import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ContactsService } from '../service/contactService';
import { CreateContactDto } from '../dto/createContactDto';
import { UpdateContactDto } from '../dto/updateContactDto';

@Controller('contacts')
export class ContactsController {
    constructor(private readonly svc: ContactsService) {}

    @Get()
    list() {
        return this.svc.list();
    }

    @Get(':id')
    getById(@Param('id', ParseIntPipe) id: number) {
        return this.svc.getById(id);
    }

    @Post()
    create(@Body() dto: CreateContactDto) {
        return this.svc.create(dto);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateContactDto,
    ) {
        return this.svc.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.svc.remove(id);
    }
}
