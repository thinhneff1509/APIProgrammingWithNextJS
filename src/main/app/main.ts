import { NestFactory } from '@nestjs/core';
import { AppModule } from './module';
import { ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import * as express from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { cors: true });

    // Global prefix for all APIs
    app.setGlobalPrefix('api');

    // Enable graceful shutdown (for Docker/K8s)
    app.enableShutdownHooks();

    // Auto-validation if you use DTOs
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

    app.use(express.urlencoded({ extended: true })); // để đọc body x-www-form-urlencoded
    app.use(express.json());

    await app.listen(process.env.PORT || 3000);
    console.log(`[server] ${await app.getUrl()}`);
}
bootstrap();
