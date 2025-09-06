import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from '../service/contactService';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../config/security/authService';
import { of, throwError } from 'rxjs';

describe('ContactsService', () => {
    let service: ContactsService;
    let http: jest.Mocked<HttpService>;
    let cfg: jest.Mocked<ConfigService>;
    let auth: jest.Mocked<AuthService>;

    const BITRIX_DOMAIN = 'https://tenant.bitrix24.vn';
    const token = 'mock-access-token';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactsService,
                {
                    provide: HttpService,
                    useValue: {
                        post: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) =>
                            key === 'BITRIX24_DOMAIN' ? BITRIX_DOMAIN : undefined,
                        ),
                    },
                },
                {
                    provide: AuthService,
                    useValue: {
                        getValidAccessToken: jest.fn().mockResolvedValue(token),
                    },
                },
            ],
        }).compile();

        service = module.get(ContactsService);
        http = module.get(HttpService) as any;
        cfg = module.get(ConfigService) as any;
        auth = module.get(AuthService) as any;
        jest.clearAllMocks();
    });

    /** helper: mock http.post trả về { data: { result: value } } */
    const mockPostResult = (value: any) => {
        (http.post as jest.Mock).mockReturnValue(
            of({
                data: { result: value },
            } as any),
        );
    };

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('list() should call crm.contact.list and map to ContactDto[]', async () => {
        mockPostResult({
            items: [
                {
                    ID: '1',
                    NAME: 'Bob',
                    ADDRESS: '12 Street',
                    ADDRESS_CITY: 'HCM',
                    ADDRESS_REGION: 'District 1',
                    ADDRESS_PROVINCE: 'HCM',
                    PHONE: [{ VALUE: '0988888888' }],
                    EMAIL: [{ VALUE: 'bob@test.com' }],
                    WEB: [{ VALUE: 'https://bob.site' }],
                },
            ],
        });

        const res = await service.list();

        // Called once with proper URL
        expect(http.post).toHaveBeenCalledTimes(1);
        const [url, body] = (http.post as jest.Mock).mock.calls[0];
        expect(url).toBe(`${BITRIX_DOMAIN}/rest/crm.contact.list.json`);
        expect(body.auth).toBe(token);

        // Mapping
        expect(res).toEqual([
            {
                id: '1',
                name: 'Bob',
                address: '12 Street',
                city: 'HCM',
                region: 'District 1',
                state: 'HCM',
                phone: '0988888888',
                email: 'bob@test.com',
                website: 'https://bob.site',
            },
        ]);
    });

    it('getById() should call crm.contact.get and map to ContactDto', async () => {
        mockPostResult({
            ID: '9',
            NAME: 'Alice',
            EMAIL: [{ VALUE: 'alice@test.com' }],
        });

        const item = await service.getById(9);

        expect(http.post).toHaveBeenCalledTimes(1);
        const [url, body] = (http.post as jest.Mock).mock.calls[0];
        expect(url).toBe(`${BITRIX_DOMAIN}/rest/crm.contact.get.json`);
        expect(body).toMatchObject({ id: 9, auth: token });

        expect(item).toEqual({
            id: '9',
            name: 'Alice',
            address: undefined,
            city: undefined,
            region: undefined,
            state: undefined,
            phone: undefined,
            email: 'alice@test.com',
            website: undefined,
        });
    });

    it('create() should send correct fields and return fetched ContactDto', async () => {
        // 1st call: add -> id
        (http.post as jest.Mock).mockReturnValueOnce(
            of({ data: { result: 123 } } as any),
        );
        // 2nd call: get -> object
        (http.post as jest.Mock).mockReturnValueOnce(
            of({
                data: {
                    result: {
                        ID: '123',
                        NAME: 'New Guy',
                        EMAIL: [{ VALUE: 'new@x.com' }],
                    },
                },
            } as any),
        );

        const dto = {
            name: 'New Guy',
            address: '12 Nguyen Van',
            city: 'HCM',
            region: 'D1',
            state: 'HCM',
            phone: '0909090909',
            email: 'new@x.com',
            website: 'https://new.example',
        };

        const created = await service.create(dto as any);

        // Check 1st call body (add)
        const firstCall = (http.post as jest.Mock).mock.calls[0];
        expect(firstCall[0]).toBe(`${BITRIX_DOMAIN}/rest/crm.contact.add.json`);
        expect(firstCall[1].auth).toBe(token);
        expect(firstCall[1].fields).toMatchObject({
            NAME: 'New Guy',
            ADDRESS: '12 Nguyen Van',
            ADDRESS_CITY: 'HCM',
            ADDRESS_REGION: 'D1',
            ADDRESS_PROVINCE: 'HCM',
            PHONE: [{ VALUE: '0909090909', TYPE: 'MOBILE' }],
            EMAIL: [{ VALUE: 'new@x.com', TYPE: 'WORK' }],
            WEB: [{ VALUE: 'https://new.example', TYPE: 'WORK' }],
        });

        // Created object returned from getById
        expect(created).toEqual({
            id: '123',
            name: 'New Guy',
            address: undefined,
            city: undefined,
            region: undefined,
            state: undefined,
            phone: undefined,
            email: 'new@x.com',
            website: undefined,
        });
    });

    it('update() should call crm.contact.update then getById()', async () => {
        // 1st call: update -> ok
        (http.post as jest.Mock).mockReturnValueOnce(
            of({ data: { result: true } } as any),
        );
        // 2nd call: get -> contact
        (http.post as jest.Mock).mockReturnValueOnce(
            of({
                data: {
                    result: {
                        ID: '5',
                        NAME: 'Updated',
                    },
                },
            } as any),
        );

        const dto = { name: 'Updated' } as any;
        const updated = await service.update(5, dto);

        const updateCall = (http.post as jest.Mock).mock.calls[0];
        expect(updateCall[0]).toBe(`${BITRIX_DOMAIN}/rest/crm.contact.update.json`);
        expect(updateCall[1]).toMatchObject({
            id: 5,
            fields: { NAME: 'Updated' },
            auth: token,
        });

        expect(updated).toEqual({
            id: '5',
            name: 'Updated',
            address: undefined,
            city: undefined,
            region: undefined,
            state: undefined,
            phone: undefined,
            email: undefined,
            website: undefined,
        });
    });

    it('remove() should call crm.contact.delete and return { ok }', async () => {
        mockPostResult(true);
        const res = await service.remove(99);

        expect(http.post).toHaveBeenCalledTimes(1);
        const [url, body] = (http.post as jest.Mock).mock.calls[0];
        expect(url).toBe(`${BITRIX_DOMAIN}/rest/crm.contact.delete.json`);
        expect(body).toMatchObject({ id: 99, auth: token });

        expect(res).toEqual({ ok: true });
    });

    it('should propagate HTTP errors from Bitrix', async () => {
        (http.post as jest.Mock).mockReturnValueOnce(
            throwError(() => new Error('bitrix 500')),
        );

        await expect(service.list()).rejects.toThrow('bitrix 500');
    });
});
