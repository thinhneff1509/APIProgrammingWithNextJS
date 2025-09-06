import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../config/token/tokenService';
import { AuthService } from '../../config/security/authService';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BitrixService {
    constructor(
        private http: HttpService,
        private cfg: ConfigService,
        private tokens: TokenService,
        private auth: AuthService,
    ) {}

    private base() {
        return `${this.cfg.getOrThrow('BITRIX24_DOMAIN')}/rest`;
    }

    private async call<T>(method: string, payload: any, accessToken: string): Promise<T> {
        const url = `${this.base()}${method}`;
        const { data } = await firstValueFrom(this.http.post(url, { ...payload, auth: accessToken }));
        if (data?.error) throw new Error(data.error_description || data.error);
        return data.result as T;
    }

    // Hàm public: tự kiểm tra token/refresh trước khi call
    async callApi<T = any>(method: string, payload: any = {}): Promise<T> {
        const saved = await this.tokens.load();
        const fresh = async () => {
            const r = await this.auth.refreshToken();
            return this.call<T>(method, payload, r.access_token);
        };

        if (saved.access_token && saved.expires_at && Date.now() < saved.expires_at) {
            try {
                return await this.call<T>(method, payload, saved.access_token);
            } catch (e: any) {
                if (/expired|invalid|401/i.test(e?.message || '')) return fresh();
                throw e;
            }
        }
        return fresh();
    }

    // ví dụ: lấy danh sách contacts
    listContacts() {
        return this.callApi('/crm.contact.list.json', {
            select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'PHONE'],
            filter: {},
            order: { ID: 'DESC' },
        });
    }
}
