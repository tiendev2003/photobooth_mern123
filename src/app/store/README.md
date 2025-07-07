# Store Dashboard Components

Trang quản lý cửa hàng đã được chia thành nhiều component riêng biệt để dễ quản lý và bảo trì.

## Cấu trúc thư mục

```
src/app/store/
├── components/           # Các component UI
│   ├── StoreSidebar.tsx     # Sidebar navigation
│   ├── OverviewTab.tsx      # Tab tổng quan
│   ├── RevenuesTab.tsx      # Tab doanh thu máy
│   ├── MachineRevenuesTab.tsx # Tab chi tiết doanh thu máy
│   ├── CouponsTab.tsx       # Tab quản lý mã giảm giá
│   ├── EmployeesTab.tsx     # Tab quản lý nhân viên
│   ├── SettingsTab.tsx      # Tab xem thông tin cửa hàng
│   ├── EditStoreTab.tsx     # Tab chỉnh sửa cửa hàng
│   ├── Toast.tsx            # Component thông báo
│   ├── EmployeeWelcome.tsx  # Component chào mừng nhân viên
│   └── index.ts             # Export tất cả components
├── utils/                # Utilities
│   └── formatters.ts        # Các hàm format dữ liệu
├── page.tsx             # Component chính
└── README.md            # File này
```

## Các Component

### 1. StoreSidebar
- Hiển thị navigation sidebar
- Quản lý việc chuyển đổi giữa các tab
- Hiển thị thông tin người dùng và logout

### 2. OverviewTab
- Hiển thị tổng quan về cửa hàng (chỉ cho STORE_OWNER)
- Thống kê doanh thu, nhân viên, giao dịch
- Danh sách giao dịch gần đây

### 3. RevenuesTab
- Hiển thị doanh thu theo từng máy
- Có thể xem chi tiết giao dịch của từng máy
- Hỗ trợ chế độ overview và detail view

### 4. MachineRevenuesTab
- Hiển thị chi tiết doanh thu tất cả máy
- Grid layout với thông tin tổng quan từng máy
- Có button refresh để tải lại dữ liệu

### 5. CouponsTab
- Quản lý mã giảm giá
- Tạo mã giảm giá nhanh với template có sẵn
- Modal tạo mã giảm giá tùy chỉnh
- Hiển thị trạng thái và thống kê mã giảm giá

### 6. EmployeesTab
- Quản lý danh sách nhân viên
- Hiển thị thông tin chi tiết từng nhân viên
- Thống kê về số lượng và trạng thái nhân viên

### 7. SettingsTab
- Hiển thị thông tin cửa hàng (read-only)
- Button chuyển sang chế độ chỉnh sửa

### 8. EditStoreTab
- Form chỉnh sửa thông tin cửa hàng
- Upload logo và hình nền
- Validation và xử lý lỗi

### 9. Toast
- Component thông báo popup
- Hỗ trợ success và error message
- Auto hide sau 3 giây

### 10. EmployeeWelcome
- Thông báo chào mừng cho nhân viên
- Chỉ hiển thị cho USER và MACHINE roles

## Utils

### formatters.ts
- `formatCurrency()`: Format số tiền theo định dạng VND
- `formatDateTime()`: Format ngày tháng theo định dạng Việt Nam
- `generateRandomCode()`: Tạo mã ngẫu nhiên 4 chữ số

## Quyền truy cập

### STORE_OWNER
- Truy cập tất cả các tab
- Có thể chỉnh sửa thông tin cửa hàng
- Xem tổng quan và quản lý nhân viên

### USER (Nhân viên)
- Truy cập: revenues, machine-revenues, coupons
- Có thể tạo mã giảm giá
- Không thể chỉnh sửa thông tin cửa hàng

### MACHINE
- Truy cập: revenues, machine-revenues
- Không thể tạo mã giảm giá
- Chỉ xem dữ liệu

## Features

### Responsive Design
- Tất cả components đều responsive
- Hỗ trợ mobile và desktop

### Loading States
- Skeleton loading cho các API calls
- Loading indicators cho các thao tác

### Error Handling
- Toast notifications cho lỗi
- Graceful fallbacks

### Performance
- Lazy loading cho data
- Component-based architecture giúp tối ưu re-rendering

## Cách sử dụng

1. **Thêm component mới:**
   ```tsx
   // Tạo file mới trong components/
   // Export trong index.ts
   // Import và sử dụng trong page.tsx
   ```

2. **Cập nhật logic:**
   ```tsx
   // Logic chính vẫn trong page.tsx
   // Components chỉ nhận props và render UI
   // Callbacks được truyền từ parent
   ```

3. **Styling:**
   ```tsx
   // Sử dụng Tailwind CSS
   // Consistent design patterns
   // Reusable utility classes
   ```

## Lợi ích của cấu trúc mới

1. **Dễ bảo trì:** Mỗi component có trách nhiệm riêng biệt
2. **Tái sử dụng:** Components có thể dùng ở nhiều nơi
3. **Testing:** Dễ dàng test từng component riêng lẻ
4. **Performance:** Tối ưu re-rendering
5. **Readability:** Code dễ đọc và hiểu hơn
6. **Scalability:** Dễ mở rộng và thêm tính năng mới
