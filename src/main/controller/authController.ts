import { Controller, All, Get, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../config/security/authService';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AuthController {
    constructor(
        private readonly auth: AuthService,
        private readonly cfg: ConfigService,
    ) {}

    // Bitrix call endpoint when INSTALL/REINSTALL app
    @All('install')
    async install(
        @Body() body: any,
        @Query() query: any,
        @Res() res: Response,
    ) {
        try {
            // log debug
            // console.log('[install] body=', body);
            // console.log('[install] query=', query);

            // --- Case A: New type: body.AUTH.{access_token, refresh_token, expires_in}
            const a = body?.AUTH ?? body?.auth;
            if (a?.access_token) {
                await this.auth.setTokens(a.access_token, a.refresh_token, Number(a.expires_in ?? 3600));
                return res.send('Installed: tokens saved from AUTH.*');
            }

            // --- Case B: Local App type: AUTH_ID / REFRESH_ID / AUTH_EXPIRES
            if (body?.AUTH_ID) {
                await this.auth.setTokens(
                    String(body.AUTH_ID),
                    String(body.REFRESH_ID ?? ''),
                    Number(body.AUTH_EXPIRES ?? 3600),
                );
                return res.send('Installed: tokens saved from AUTH_ID/REFRESH_ID.');
            }

            // --- Case C: OAuth code flow
            const code = body?.code ?? query?.code;
            if (code) {
                const redirectUri = `${this.cfg.getOrThrow('PUBLIC_URL')}/install`;
                await this.auth.exchangeCode(code, redirectUri);
                return res.send('Installed via code: tokens saved.');
            }

            return res.status(400).send('Missing code or tokens');
        } catch (e: any) {
            return res.status(500).send(e?.message ?? 'Install error');
        }
    }

    @Get('oauth/callback')
    async callback(@Query('code') code: string, @Res() res: Response) {
        try {
            if (!code) return res.status(400).send('Missing code');
            const redirectUri = `${this.cfg.getOrThrow('PUBLIC_URL')}/oauth/callback`;
            await this.auth.exchangeCode(code, redirectUri);
            return res.send('OAuth callback OK. Tokens saved.');
        } catch (e: any) {
            return res.status(500).send(e?.message ?? 'Callback error');
        }
    }
}
