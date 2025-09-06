export class ContactDto {
    id!: string;             // ID contact in Bitrix24
    name!: string;
    address?: string;        // địa chỉ
    city?: string;
    region?: string;         // quận/huyện
    state?: string;          // tỉnh/thành
    phone?: string;
    email?: string;
    website?: string;
}
