import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

type TokenFile = {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number; // epoch ms
};

@Injectable()
export class TokenService {
    private file = path.resolve(__dirname, 'tokens.json');

    async load(): Promise<TokenFile> {
        try {
            const raw = await fs.readFile(this.file, 'utf8');
            return JSON.parse(raw || '{}');
        } catch {
            return {};
        }
    }

    async save(data: TokenFile) {
        await fs.writeFile(this.file, JSON.stringify(data, null, 2), 'utf8');
    }


    async setTokens(access: string, refresh: string, expiresInSec: number) {
        const expires_at = Date.now() + (expiresInSec - 60) * 1000; // -60s an toàn
        await this.save({ access_token: access, refresh_token: refresh, expires_at });
    }
}
