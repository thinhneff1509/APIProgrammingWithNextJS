import { Controller, Get } from '@nestjs/common';
import { BitrixService } from '../../service/bitrixService/bitrixService';

@Controller()
export class BitrixController {
    constructor(private b24: BitrixService) {}

    @Get('contacts')
    async contacts() {
        const items = await this.b24.listContacts();
        return { items };
    }
}
