# Hướng dẫn sử dụng Docker với Photobooth MERN

## Yêu cầu
- Đã cài đặt [Docker](https://www.docker.com/get-started)
- Đã cài đặt [Docker Compose](https://docs.docker.com/compose/install/) (thường đã được bao gồm trong Docker Desktop)

## Các bước chuẩn bị

1. Sao chép file `.env.example` thành `.env` và cập nhật các thông tin cần thiết:
```
cp .env.example .env
```

2. Đảm bảo các thư mục uploads tồn tại:
```
mkdir -p public/uploads/gifs
mkdir -p public/uploads/images
mkdir -p public/uploads/type
mkdir -p public/uploads/videos
```

## Khởi động ứng dụng

### Sử dụng script tự động (Windows)
Chạy file `docker-deploy.bat` và chọn tùy chọn 1 để build và khởi động:
```
docker-deploy.bat
```

### Sử dụng Docker Compose (thủ công)
Build và khởi động các container:
```
docker-compose up -d --build
```

Ứng dụng sẽ khả dụng tại địa chỉ: http://localhost:3000

## Quản lý ứng dụng

### Xem logs
```
docker-compose logs -f app
```

### Dừng ứng dụng
```
docker-compose down
```

### Khởi động lại ứng dụng
```
docker-compose restart
```

## Cấu trúc Docker

Môi trường Docker bao gồm hai container chính:

1. **app**: Ứng dụng Next.js
   - Được build từ Dockerfile
   - Chạy trên cổng 3000

2. **mysql**: Cơ sở dữ liệu MySQL
   - Sử dụng image MySQL 8
   - Dữ liệu được lưu trữ trong volume Docker để đảm bảo tính bền vững
   - Chạy trên cổng 3306

## Biến môi trường

Các biến môi trường quan trọng:

- `DATABASE_URL`: Chuỗi kết nối đến MySQL
- `NODE_ENV`: Môi trường chạy ứng dụng

## Lưu ý

- Sau khi khởi động lần đầu, bạn có thể cần chạy migrations để thiết lập cơ sở dữ liệu:
```
docker-compose exec app npx prisma migrate deploy
```

- Để chạy seed data:
```
docker-compose exec app npm run db:seed
```
