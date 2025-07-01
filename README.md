# Photobooth MERN Application

Đây là ứng dụng fullstack sử dụng Next.js và Prisma.

## API Documentation

### Authentication API

#### Đăng ký người dùng
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password123"
  }
  ```

#### Đăng nhập
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Users API

#### Lấy danh sách Users
- **URL**: `/api/users`
- **Method**: `GET`
- **Authorization**: Bearer Token

#### Tạo User mới (Admin only)
- **URL**: `/api/users`
- **Method**: `POST`
- **Authorization**: Bearer Token (Admin/Ketoan)
- **Body**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password123",
    "role": "USER", // ADMIN, KETOAN, USER
    "phone": "0123456789", // optional
    "address": "User Address" // optional
  }
  ```

### Coupons API

#### Lấy danh sách Coupons
- **URL**: `/api/coupons`
- **Method**: `GET`
- **Authorization**: Bearer Token

#### Tạo Coupon mới
- **URL**: `/api/coupons`
- **Method**: `POST`
- **Authorization**: Bearer Token (Admin/Ketoan)
- **Body**:
  ```json
  {
    "code": "DISCOUNT20",
    "discount": 20.0,
    "expires_at": "2025-12-31T23:59:59Z",
    "user_id": "user-uuid" // optional
  }
  ```

### Images API

#### Lấy danh sách Images
- **URL**: `/api/images`
- **Method**: `GET`
- **Authorization**: Bearer Token

#### Upload ảnh mới
- **URL**: `/api/images`
- **Method**: `POST`
- **Authorization**: Bearer Token
- **Body**: FormData với key 'file' chứa file ảnh

## Getting Started

First, run the development server:

## Cấu hình môi trường

File `.env` cần chứa các thông tin sau:

```
DATABASE_URL="mongodb://localhost:27017/photobooth_db"
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Database Setup

1. Cấu hình database URL trong file `.env`

2. Sử dụng MongoDB compass hoặc MongoDB shell để tạo database với tên `photobooth_db`

3. Đẩy Prisma schema lên MongoDB:
   ```
   npx prisma db push
   ```

3. Generate Prisma client:
   ```
   npx prisma generate
   ```

## Những API bổ sung

1. Lấy thông tin User theo ID
   - **URL**: `/api/users/{id}`
   - **Method**: `GET`
   - **Authorization**: Bearer Token

2. Cập nhật User theo ID
   - **URL**: `/api/users/{id}`
   - **Method**: `PUT`
   - **Authorization**: Bearer Token (Admin/Ketoan)

3. Xóa User theo ID
   - **URL**: `/api/users/{id}`
   - **Method**: `DELETE`
   - **Authorization**: Bearer Token (Admin/Ketoan)

4. Lấy thông tin Coupon theo ID
   - **URL**: `/api/coupons/{id}`
   - **Method**: `GET`
   - **Authorization**: Bearer Token

5. Cập nhật Coupon theo ID
   - **URL**: `/api/coupons/{id}`
   - **Method**: `PUT`
   - **Authorization**: Bearer Token (Admin/Ketoan)

6. Xóa Coupon theo ID
   - **URL**: `/api/coupons/{id}`
   - **Method**: `DELETE`
   - **Authorization**: Bearer Token (Admin/Ketoan)

7. Lấy thông tin ảnh theo ID
   - **URL**: `/api/images/{id}`
   - **Method**: `GET`
   - **Authorization**: Bearer Token

8. Xóa ảnh theo ID
   - **URL**: `/api/images/{id}`
   - **Method**: `DELETE`
   - **Authorization**: Bearer Token (Admin/Ketoan)
