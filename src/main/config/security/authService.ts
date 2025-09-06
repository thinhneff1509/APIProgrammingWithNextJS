import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../token/tokenService';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
    constructor(
        private http: HttpService,
        private cfg: ConfigService,
        private tokens: TokenService,
    ) {}

    private domain() {
        return this.cfg.getOrThrow<string>('BITRIX24_DOMAIN');
    }

    async exchangeCode(code: string, redirectUri: string) {
        const params = {
            grant_type: 'authorization_code',
            client_id: this.cfg.getOrThrow<string>('BITRIX24_CLIENT_ID'),
            client_secret: this.cfg.getOrThrow<string>('BITRIX24_CLIENT_SECRET'),
            code,
            redirect_uri: redirectUri,
        };

        const { data } = await firstValueFrom(
            this.http.get(`${this.domain()}/oauth/token/`, { params }),
        );
        await this.tokens.setTokens(data.access_token, data.refresh_token, data.expires_in);
        return data;
    }

    async refreshToken() {
        const saved = await this.tokens.load();
        if (!saved.refresh_token) throw new Error('No refresh token');

        const params = {
            grant_type: 'refresh_token',
            client_id: this.cfg.getOrThrow<string>('BITRIX24_CLIENT_ID'),
            client_secret: this.cfg.getOrThrow<string>('BITRIX24_CLIENT_SECRET'),
            refresh_token: saved.refresh_token,
        };

        const { data } = await firstValueFrom(
            this.http.get(`${this.domain()}/oauth/token/`, { params }),
        );
        await this.tokens.setTokens(data.access_token, data.refresh_token, data.expires_in);
        return data;
    }

    async setTokens(access: string, refresh: string, expiresIn: number) {
        await this.tokens.setTokens(access, refresh, expiresIn);
    }

    async getValidAccessToken(): Promise<string> {
        const saved = await this.tokens.load();
        if (!saved.access_token || !saved.expires_at || saved.expires_at <= Date.now()) {
            const d = await this.refreshToken();
            return d.access_token;
        }
        return saved.access_token;
    }

}
