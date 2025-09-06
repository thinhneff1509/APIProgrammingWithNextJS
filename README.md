# APIProgrammingWithNextJS

# Bài 1: Triển khai OAuth 2.0 với Bitrix24 (NestJS)

Ứng dụng backend sử dụng **NestJS** để tích hợp với Bitrix24 thông qua OAuth 2.0:
- Hỗ trợ nhận sự kiện cài đặt ứng dụng.
- Quản lý access_token và refresh_token.
- Tự động làm mới token.
- Gọi các API Bitrix24 (ví dụ: crm.contact.list).

##  1. Cài đặt & Chạy dự án

### Yêu cầu môi trường
- Node.js >= 18
- npm hoặc yarn
- Tài khoản Bitrix24
- Ngrok (dùng để expose localhost ra ngoài cho Bitrix24 gọi về)

### Các bước
Bước 1. Cấu hình dự án
```bash
# Clone project
git clone <repo_url>
cd <project_folder>

# Cài dependencies
npm install

# Tạo file cấu hình
cp .env.example .env

File .env ví dụ:
PORT=3000
BITRIX24_DOMAIN=https://<your-bitrix24>.bitrix24.vn
BITRIX24_CLIENT_ID=local.xxxxxx
BITRIX24_CLIENT_SECRET=xxxxxxxx
PUBLIC_URL=https://<your-ngrok-subdomain>.ngrok-free.app

- Chạy server
   npm run start:dev
   sau đó :  ngrok http 3000

Bước 2. Cấu hình ứng dụng trên Bitrix24

Vào trang Developer của Bitrix24 → chọn Ứng dụng cục bộ (Local Application).
    Điền các thông tin:
       Callback URL:   https://<ngrok-subdomain>.ngrok-free.app/api/oauth/callback
       Install URL:    https://<ngrok-subdomain>.ngrok-free.app/api/install
    Chọn quyền CRM.
    Lấy client_id và client_secret → cấu hình vào file .env.

Bước 3. Các Endpoint API

Base URL:    https://<ngrok-subdomain>.ngrok-free.app/api

- Auth API:

        Method  	
        GET	/install	          : Install app từ Bitrix24
        GET	/oauth/callback	    : OAuth callback lưu token
Example gọi API Bitrix24:

        Method
        GET	/contacts (custom API)      : Lấy danh sách contact (proxy tới crm.contact.list)

Bước 4. Quản lý Token

access_token và refresh_token được lưu vào file tokens.json.
Nếu access_token hết hạn → dùng refresh_token để lấy token mới.
Nếu token lỗi/hết hạn → trả lỗi 401 Unauthorized.

Bước 5. Kiểm thử

 - Postman

    Ví dụ test crm.contact.list qua API backend:
       GET https://<ngrok-subdomain>.ngrok-free.app/api/contacts
       Trả về:
          [
            {
              "id": "1",
              "name": "Alice",
              "email": "alice@example.com"
            }
          ]

Bước 6. Xử lý lỗi

Missing code or tokens: Bitrix không trả về code/token → kiểm tra callback URL.
401 Unauthorized: access_token hết hạn → hệ thống sẽ tự refresh bằng refresh_token.
Timeout hoặc 5xx: lỗi mạng Bitrix24 → thử lại hoặc log lỗi.







Bài tập số 2:
# Bitrix24 Contact Management API (NestJS)

Dự án xây dựng API RESTful bằng **NestJS** để quản lý Contact trên Bitrix24:
- Hiển thị, thêm, sửa, xóa contact.
- Tích hợp trực tiếp với Bitrix24 thông qua REST API.
- Validate dữ liệu đầu vào bằng `class-validator`.
- Sinh tài liệu API tự động bằng **Swagger**.

---

## 1. Cài đặt & Chạy dự án

### Yêu cầu môi trường
- Node.js 
- npm 
- Tài khoản Bitrix24
- Ngrok (để expose localhost ra internet cho Bitrix24 gọi về)

### Các bước
Bước 1. Cấu hình dự án
```bash
# Clone project
git clone <repo_url>
cd <project_folder>

# Cài đặt dependencies
npm install

# Tạo file cấu hình môi trường
cp .env.example .env

File .env ví dụ:
PORT=3000
BITRIX24_DOMAIN=https://<your-bitrix24>.bitrix24.vn
BITRIX24_CLIENT_ID=local.xxxxxx
BITRIX24_CLIENT_SECRET=xxxxxxxx
PUBLIC_URL=https://<your-ngrok-subdomain>.ngrok-free.app
 
Bước 2. Chạy server
   npm run start:dev
 sau đó :  ngrok http 3000

 Bước 3. Cấu hình Bitrix24 + Ngrok
    
    Vào Bitrix24 Developer
    Tạo Ứng dụng cục bộ (Local Application):
    Callback URL: https://<ngrok-subdomain>.ngrok-free.app/api/oauth/callback
    Install URL:  https://<ngrok-subdomain>.ngrok-free.app/api/install
    Thêm quyền CRM.

    Và Lưu lại client_id và client_secret, cập nhật vào file .env.

Bước 4. Danh sách Endpoint API

Base URL: https://<ngrok-subdomain>.ngrok-free.app/api

      - Contact API:

        Method
        GET	/contacts	        Lấy danh sách contact	-
        GET	/contacts/:id	    Lấy chi tiết contact theo ID	-
        POST	/contacts	    Tạo mới contact	{ "name": "...", "phone": "...", "email": "..." }
        PUT	/contacts/:id	    Cập nhật contact theo ID	{ "name": "...", "phone": "...", "email": "..." }
        DELETE	/contacts/:id	Xóa contact theo ID	-

      - Auth API:

        Method  	
        GET	/install	     : Install app từ Bitrix24
        GET	/oauth/callback	 : OAuth callback lưu token


Bước 5. Testing
     
     5.1 Swagger
       Truy cập:  https://<ngrok-subdomain>.ngrok-free.app/api/docs
       
     5.2 PostMan
       Ví dụ POST contact:
           POST /api/contacts
           Content-Type: application/json
             {
              "name": "Nguyen Van A",
              "phone": "0123456789",
              "email": "nguyenvana@demo.com",
              "address": "12 Phan Chu Trinh",
              "city": "HCM",
              "region": "District 1",
              "state": "HCM",
              "website": "https://bob.example"
             }

     5.3 Unit Test

        Sử dụng @nestjs/testing để viết test cho service ContactsService.
          
          Ví dụ:
          describe('ContactsService', () => {
           it('should map Bitrix contact -> DTO', async () => {
            const contact = { ID: '1', NAME: 'Test User' } as any;
            const dto = service['fromBx'](contact);
            expect(dto.id).toBe('1');
            expect(dto.name).toBe('Test User');
            });
           });

Bước 6. Các lỗi & Cách xử lý

Missing code or tokens: xảy ra khi Bitrix không trả token → kiểm tra callback URL.
Cannot POST /api/contacts: do route không trùng với prefix api → kiểm tra app.setGlobalPrefix('api').
400 Bad Request (Validation failed): body không hợp lệ, thiếu trường name, hoặc sai định dạng email/phone.
401 Unauthorized: token hết hạn → cần refresh token qua AuthService.refreshToken().

