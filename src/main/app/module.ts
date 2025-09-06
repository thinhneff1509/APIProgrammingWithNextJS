import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { AuthController } from '../controller/authController';
import { AuthService } from '../config/security/authService';
import { TokenService } from '../config/token/tokenService';

import { BitrixController } from '../controller/bitrix/bitrixController';
import { BitrixService } from '../service/bitrixService/bitrixService';

import { ContactsController } from '../controller/contactController';
import { ContactsService } from '../service/contactService';

@Module({
    imports: [
        // load .env
        ConfigModule.forRoot({ isGlobal: true }),
        // HttpModule global
        HttpModule.register({
            timeout: 15000,
            maxRedirects: 0,
        }),
    ],
    controllers: [AuthController, BitrixController, ContactsController],
    providers: [AuthService, TokenService, BitrixService, ContactsService],
})
export class AppModule {}
