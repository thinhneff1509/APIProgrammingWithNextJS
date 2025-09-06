import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../config/security/authService';
import { ContactDto } from '../dto/contactDto';
import { CreateContactDto } from '../dto/createContactDto';
import { UpdateContactDto } from '../dto/updateContactDto';

type BxResp<T> = { result: T };

type BxPhone = { VALUE: string; TYPE?: string };
type BxEmail = { VALUE: string; TYPE?: string };
type BxWeb   = { VALUE: string; TYPE?: string };

type BxContact = {
    ID: string;
    NAME?: string;
    ADDRESS?: string;
    ADDRESS_CITY?: string;
    ADDRESS_REGION?: string;
    ADDRESS_PROVINCE?: string;
    PHONE?: BxPhone[];
    EMAIL?: BxEmail[];
    WEB?: BxWeb[];
};

@Injectable()
export class ContactsService {
    constructor(
        private readonly http: HttpService,
        private readonly cfg: ConfigService,
        private readonly auth: AuthService,
    ) {}

    /** Bitrix REST base URL */
    private base(): string {
        return `${this.cfg.getOrThrow<string>('BITRIX24_DOMAIN')}/rest`;
    }

    /**
     * Gọi API Bitrix generic
     * @param method example: 'crm.contact.list'
     * @param payload body send (fields, filter, id, ...)
     */
    private async call<T>(method: string, payload: any): Promise<T> {
        const accessToken = await this.auth.getValidAccessToken();
        const url = `${this.base()}/${method}.json`;

        const { data } = await firstValueFrom(
            this.http.post<BxResp<T>>(url, { ...payload, auth: accessToken }),
        );

        return data.result as T;
    }

    /** Map DTO -> fields Bitrix */
    private toBxFields(dto: CreateContactDto | UpdateContactDto): Record<string, any> {
        const fields: Record<string, any> = {};

        if (dto.name       !== undefined) fields.NAME = dto.name;
        if (dto.address    !== undefined) fields.ADDRESS = dto.address;
        if (dto.city       !== undefined) fields.ADDRESS_CITY = dto.city;
        if (dto.region     !== undefined) fields.ADDRESS_REGION = dto.region;
        if (dto.state      !== undefined) fields.ADDRESS_PROVINCE = dto.state;

        // PHONE/EMAIL/WEB in Bitrix is an array
        if (dto.phone   !== undefined) fields.PHONE = [{ VALUE: dto.phone, TYPE: 'MOBILE' }];
        if (dto.email   !== undefined) fields.EMAIL = [{ VALUE: dto.email, TYPE: 'WORK' }];
        if (dto.website !== undefined) fields.WEB   = [{ VALUE: dto.website, TYPE: 'WORK' }];

        return fields;
    }

    /** Map Bitrix contact -> ContactDto */
    private fromBx(c: BxContact): ContactDto {
        return {
            id: c.ID,
            name: c.NAME ?? '',
            address: c.ADDRESS ?? undefined,
            city: c.ADDRESS_CITY ?? undefined,
            region: c.ADDRESS_REGION ?? undefined,
            state: c.ADDRESS_PROVINCE ?? undefined,
            phone: c.PHONE?.[0]?.VALUE ?? undefined,
            email: c.EMAIL?.[0]?.VALUE ?? undefined,
            website: c.WEB?.[0]?.VALUE ?? undefined,
        };
    }

    /** GET /contacts -> ContactDto[] */
    async list(): Promise<ContactDto[]> {
        const res = await this.call<{ items: BxContact[] }>('crm.contact.list', {
            order: { ID: 'DESC' },
            select: [
                'ID',
                'NAME',
                'ADDRESS',
                'ADDRESS_CITY',
                'ADDRESS_REGION',
                'ADDRESS_PROVINCE',
                'PHONE',
                'EMAIL',
                'WEB',
            ],
        });

        return (res.items ?? []).map((i) => this.fromBx(i));
    }

    /** GET /contacts/:id -> ContactDto */
    async getById(id: number): Promise<ContactDto> {
        // crm.contact.get trả thẳng object contact trong field "result"
        const contact = await this.call<BxContact>('crm.contact.get', { id });
        return this.fromBx(contact);
    }

    /** POST /contacts -> return ContactDto  */
    async create(dto: CreateContactDto): Promise<ContactDto> {
        const id = await this.call<number>('crm.contact.add', {
            fields: this.toBxFields(dto),
            params: { REGISTER_SONET_EVENT: 'Y' },
        });

        return this.getById(id);
    }

    /** PUT /contacts/:id -> return ContactDto after update */
    async update(id: number, dto: UpdateContactDto): Promise<ContactDto> {
        await this.call<boolean>('crm.contact.update', {
            id,
            fields: this.toBxFields(dto),
        });

        return this.getById(id);
    }

    /** DELETE /contacts/:id -> return { ok } */
    async remove(id: number): Promise<{ ok: boolean }> {
        const ok = await this.call<boolean>('crm.contact.delete', { id });
        return { ok };
    }

    // If you want to manage Requisite later (ngân hàng)
    /*
    private async upsertRequisite(contactId: number, bankName?: string, bankAccount?: string) {
      const ENTITY_TYPE_ID = 3; // CONTACT
      const exist = await this.call<any[]>('crm.requisite.list', {
        filter: { ENTITY_TYPE_ID, ENTITY_ID: contactId },
        select: ['ID', 'NAME', 'RQ_BANK_NAME', 'RQ_ACC_NUM'],
      });

      if ((!bankName && !bankAccount) && exist.length) {
        await this.call<boolean>('crm.requisite.delete', { id: exist[0].ID });
        return;
      }
      if (!bankName && !bankAccount) return;

      const fields = {
        ENTITY_TYPE_ID,
        ENTITY_ID: contactId,
        NAME: bankName || 'Bank info',
        RQ_BANK_NAME: bankName || '',
        RQ_ACC_NUM: bankAccount || '',
      };

      if (exist.length) {
        await this.call<boolean>('crm.requisite.update', { id: exist[0].ID, fields });
      } else {
        await this.call<number>('crm.requisite.add', { fields });
      }
    }
    */
}
