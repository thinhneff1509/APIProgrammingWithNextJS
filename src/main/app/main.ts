import { NestFactory } from '@nestjs/core';
import { AppModule } from './module';
import { ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { cors: true });

    // Global prefix for all APIs
    app.setGlobalPrefix('api');

    // Enable graceful shutdown
    app.enableShutdownHooks();

    // Auto-validate DTO
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,            // remove fields excess
            forbidNonWhitelisted: true, // error if there is field excess
            transform: true,            // parse type query/param
        }),
    );
    // If you need to read form-urlencoded from Bitrix
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    // Swagger
    const config = new DocumentBuilder()
        .setTitle('Contacts API')
        .setDescription('NestJS + Bitrix24 demo')
        .setVersion('1.0.0')
        .addTag('contacts')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(process.env.PORT || 3000);
    console.log(`[server] ${await app.getUrl()}`);
    console.log(`[docs]   ${await app.getUrl()}/api/docs`);
}
bootstrap();
