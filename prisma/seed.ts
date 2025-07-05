import { FileType, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.coupon.deleteMany();
  await prisma.image.deleteMany();
  await prisma.mediaSession.deleteMany();
  await prisma.frameTemplate.deleteMany();
  await prisma.frameType.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for all users
  const defaultPassword = await bcrypt.hash('123456', 10);

  // Create Admin user
  console.log('👤 Creating Admin user...');
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: defaultPassword,
      role: Role.ADMIN,
      phone: '0123456789',
      address: 'Hà Nội, Việt Nam',
      avatar: '/uploads/avatars/admin.png',
      isActive: true,
      storeId: null, // Admin không thuộc store nào
    },
  });

  // Create Managers
  console.log('👥 Creating Managers...');
  const manager1 = await prisma.user.create({
    data: {
      name: 'Nguyễn Văn Quản',
      email: 'manager1@photobooth.com',
      password: defaultPassword,
      role: Role.MANAGER,
      phone: '0987654321',
      address: '123 Trần Duy Hưng, Hà Nội',
      avatar: '/uploads/avatars/manager1.png',
      isActive: true,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: 'Trần Thị Lan',
      email: 'manager2@photobooth.com',
      password: defaultPassword,
      role: Role.MANAGER,
      phone: '0912345678',
      address: '456 Nguyễn Văn Cừ, TP.HCM',
      avatar: '/uploads/avatars/manager2.png',
      isActive: true,
    },
  });

  // Create Stores
  console.log('🏪 Creating Stores...');
  const store1 = await prisma.store.create({
    data: {
      name: 'PhotoBooth Hà Nội',
      slogan: 'Chụp ảnh đẹp - Kỷ niệm vĩnh cửu',
      logo: '/uploads/stores/logo_hanoi.png',
      background: '/uploads/stores/background_hanoi.png',
      description: 'Cửa hàng photobooth chuyên nghiệp tại Hà Nội',
      address: '123 Trần Duy Hưng, Cầu Giấy, Hà Nội',
      phone: '024-3456-7890',
      email: 'hanoi@photobooth.com',
      accountNumber: '1234567890',
      primaryColor: '#FF6B6B',
      secondaryColor: '#4ECDC4',
      isActive: true,
      maxEmployees: 15,
      managerId: manager1.id,
    },
  });

  const store2 = await prisma.store.create({
    data: {
      name: 'PhotoBooth Sài Gòn',
      slogan: 'Nắng Sài Gòn - Ảnh đẹp mỗi ngày',
      logo: '/uploads/stores/logo_saigon.png',
      background: '/uploads/stores/background_saigon.png',
      description: 'Cửa hàng photobooth hiện đại tại TP.HCM',
      address: '456 Nguyễn Văn Cừ, Quận 5, TP.HCM',
      phone: '028-3456-7890',
      email: 'saigon@photobooth.com',
      accountNumber: '0987654321',
      primaryColor: '#FFD93D',
      secondaryColor: '#FF6B6B',
      isActive: true,
      maxEmployees: 20,
      managerId: manager2.id,
    },
  });

  // Update managers with their store
  await prisma.user.update({
    where: { id: manager1.id },
    data: { storeId: store1.id },
  });

  await prisma.user.update({
    where: { id: manager2.id },
    data: { storeId: store2.id },
  });

  // Create Users for Store 1
  console.log('👨‍💼 Creating Users for Store 1...');
  const store1Users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Nhân viên HN ${i}`,
        email: `user${i}@hanoi.photobooth.com`,
        password: defaultPassword,
        role: Role.USER,
        phone: `091234567${i}`,
        address: `Địa chỉ ${i}, Hà Nội`,
        avatar: `/uploads/avatars/user_hn_${i}.png`,
        isActive: true,
        storeId: store1.id,
      },
    });
    store1Users.push(user);
  }

  // Create Users for Store 2
  console.log('👨‍💼 Creating Users for Store 2...');
  const store2Users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Nhân viên SG ${i}`,
        email: `user${i}@saigon.photobooth.com`,
        password: defaultPassword,
        role: Role.USER,
        phone: `098765432${i}`,
        address: `Địa chỉ ${i}, TP.HCM`,
        avatar: `/uploads/avatars/user_sg_${i}.png`,
        isActive: true,
        storeId: store2.id,
      },
    });
    store2Users.push(user);
  }

  // Create Frame Types (Global)
  console.log('🖼️  Creating Frame Types...');
  const frameTypes = [
    {
      id: '1',
      name: '1x1 Vuông',
      description: 'Frame 1 ảnh vuông',
      image: '/uploads/type/1x1.png',
      columns: 1,
      rows: 1,
      totalImages: 1,
      isHot: true,
      isCircle: false,
      isCustom: false,
    },
    {
      id: '2',
      name: '1x1 Tròn',
      description: 'Frame 1 ảnh tròn',
      image: '/uploads/type/1x1_circle.png',
      columns: 1,
      rows: 1,
      totalImages: 1,
      isHot: false,
      isCircle: true,
      isCustom: false,
    },
    {
      id: '3',
      name: '1x2 Dọc',
      description: 'Frame 2 ảnh dọc',
      image: '/uploads/type/1x2.png',
      columns: 1,
      rows: 2,
      totalImages: 2,
      isHot: true,
      isCircle: false,
      isCustom: false,
    },
    {
      id: '4',
      name: '2x1 Ngang',
      description: 'Frame 2 ảnh ngang',
      image: '/uploads/type/2x1.png',
      columns: 2,
      rows: 1,
      totalImages: 2,
      isHot: false,
      isCircle: false,
      isCustom: false,
    },
    {
      id: '5',
      name: '2x2 Vuông',
      description: 'Frame 4 ảnh vuông',
      image: '/uploads/type/2x2.png',
      columns: 2,
      rows: 2,
      totalImages: 4,
      isHot: true,
      isCircle: false,
      isCustom: false,
    },
    {
      id: '6',
      name: '1x4 Dọc',
      description: 'Frame 4 ảnh dọc',
      image: '/uploads/type/1x4.png',
      columns: 1,
      rows: 4,
      totalImages: 4,
      isHot: false,
      isCircle: false,
      isCustom: false,
    },
    {
      id: '7',
      name: '2x3 Lớn',
      description: 'Frame 6 ảnh',
      image: '/uploads/type/2x3.png',
      columns: 2,
      rows: 3,
      totalImages: 6,
      isHot: false,
      isCircle: false,
      isCustom: false,
    },
    {
      id: '8',
      name: '3x2 Ngang',
      description: 'Frame 6 ảnh ngang',
      image: '/uploads/type/3x2.png',
      columns: 3,
      rows: 2,
      totalImages: 6,
      isHot: false,
      isCircle: false,
      isCustom: false,
    },
  ];

  const createdFrameTypes = [];
  for (const frameType of frameTypes) {
    const created = await prisma.frameType.create({
      data: frameType,
    });
    createdFrameTypes.push(created);
  }

  // Create Global Frame Templates
  console.log('🎨 Creating Global Frame Templates...');
  const globalTemplates = [
    {
      name: 'Template Mặc Định 1x1',
      filename: 'global_1x1_default.png',
      background: '/templates/global/bg_1x1_default.png',
      overlay: '/templates/global/overlay_1x1_default.png',
      frameTypeId: createdFrameTypes[0].id, // 1x1 Vuông
    },
    {
      name: 'Template Mặc Định 1x2',
      filename: 'global_1x2_default.png',
      background: '/templates/global/bg_1x2_default.png',
      overlay: '/templates/global/overlay_1x2_default.png',
      frameTypeId: createdFrameTypes[2].id, // 1x2 Dọc
    },
    {
      name: 'Template Mặc Định 2x2',
      filename: 'global_2x2_default.png',
      background: '/templates/global/bg_2x2_default.png',
      overlay: '/templates/global/overlay_2x2_default.png',
      frameTypeId: createdFrameTypes[4].id, // 2x2 Vuông
    },
    {
      name: 'Template Tròn Mặc Định',
      filename: 'global_circle_default.png',
      background: '/templates/global/bg_circle_default.png',
      overlay: '/templates/global/overlay_circle_default.png',
      frameTypeId: createdFrameTypes[1].id, // 1x1 Tròn
    },
  ];

  for (const template of globalTemplates) {
    await prisma.frameTemplate.create({
      data: {
        ...template,
        isGlobal: true,
        isActive: true,
        storeId: null,
      },
    });
  }

  // Create Store-specific Frame Templates for Store 1
  console.log('🎨 Creating Store 1 Frame Templates...');
  const store1Templates = [
    {
      name: 'Template Hà Nội - Mùa Xuân',
      filename: 'hanoi_spring_1x1.png',
      background: '/templates/store1/bg_spring_1x1.png',
      overlay: '/templates/store1/overlay_spring_1x1.png',
      frameTypeId: createdFrameTypes[0].id, // 1x1 Vuông
    },
    {
      name: 'Template Hà Nội - Mùa Hạ',
      filename: 'hanoi_summer_2x2.png',
      background: '/templates/store1/bg_summer_2x2.png',
      overlay: '/templates/store1/overlay_summer_2x2.png',
      frameTypeId: createdFrameTypes[4].id, // 2x2 Vuông
    },
    {
      name: 'Template Hà Nội - Thương Hiệu',
      filename: 'hanoi_brand_1x2.png',
      background: '/templates/store1/bg_brand_1x2.png',
      overlay: '/templates/store1/overlay_brand_1x2.png',
      frameTypeId: createdFrameTypes[2].id, // 1x2 Dọc
    },
  ];

  for (const template of store1Templates) {
    await prisma.frameTemplate.create({
      data: {
        ...template,
        isGlobal: false,
        isActive: true,
        storeId: store1.id,
      },
    });
  }

  // Create Store-specific Frame Templates for Store 2
  console.log('🎨 Creating Store 2 Frame Templates...');
  const store2Templates = [
    {
      name: 'Template Sài Gòn - Năng Động',
      filename: 'saigon_dynamic_1x1.png',
      background: '/templates/store2/bg_dynamic_1x1.png',
      overlay: '/templates/store2/overlay_dynamic_1x1.png',
      frameTypeId: createdFrameTypes[0].id, // 1x1 Vuông
    },
    {
      name: 'Template Sài Gòn - Hiện Đại',
      filename: 'saigon_modern_2x2.png',
      background: '/templates/store2/bg_modern_2x2.png',
      overlay: '/templates/store2/overlay_modern_2x2.png',
      frameTypeId: createdFrameTypes[4].id, // 2x2 Vuông
    },
    {
      name: 'Template Sài Gòn - Sáng Tạo',
      filename: 'saigon_creative_1x4.png',
      background: '/uploads/images/1.png',
      overlay: '',
      frameTypeId: createdFrameTypes[5].id, // 1x4 Dọc
    },
  ];

  for (const template of store2Templates) {
    await prisma.frameTemplate.create({
      data: {
        ...template,
        isGlobal: false,
        isActive: true,
        storeId: store2.id,
      },
    });
  }

  // Create Sample Media Sessions
  console.log('📸 Creating Sample Media Sessions...');
  const session1 = await prisma.mediaSession.create({
    data: {
      sessionCode: 'DEMO001',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  });

  const session2 = await prisma.mediaSession.create({
    data: {
      sessionCode: 'DEMO002',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  });

  // Create Sample Images
  console.log('🖼️  Creating Sample Images...');
  const sampleImages = [
    {
      filename: 'demo_image_1.jpg',
      path: '/uploads/images/demo_image_1.jpg',
      fileType: FileType.IMAGE,
      size: 1024000,
      sessionId: session1.id,
    },
    {
      filename: 'demo_image_2.jpg',
      path: '/uploads/images/demo_image_2.jpg',
      fileType: FileType.IMAGE,
      size: 1536000,
      sessionId: session1.id,
    },
    {
      filename: 'demo_gif_1.gif',
      path: '/uploads/gifs/demo_gif_1.gif',
      fileType: FileType.GIF,
      size: 2048000,
      sessionId: session2.id,
    },
    {
      filename: 'demo_video_1.mp4',
      path: '/uploads/videos/demo_video_1.mp4',
      fileType: FileType.VIDEO,
      size: 10240000,
      duration: 15,
      sessionId: session2.id,
    },
  ];

  for (const image of sampleImages) {
    await prisma.image.create({
      data: image,
    });
  }

  // Create Sample Coupons
  console.log('🎫 Creating Sample Coupons...');
  
  // Global coupons (not tied to any store)
  await prisma.coupon.create({
    data: {
      code: 'GLOBAL70',
      discount: 70,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      usageLimit: 100,
      isActive: true,
      currentUsage: 0,
      userId: null,
      storeId: null,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'GLOBAL120',
      discount: 120,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      usageLimit: 50,
      isActive: true,
      currentUsage: 0,
      userId: null,
      storeId: null,
    },
  });

  // Store 1 specific coupons
  await prisma.coupon.create({
    data: {
      code: 'HANOI100',
      discount: 100,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      usageLimit: 30,
      isActive: true,
      currentUsage: 0,
      userId: null,
      storeId: store1.id,
    },
  });

  // Store 2 specific coupons
  await prisma.coupon.create({
    data: {
      code: 'SAIGON80',
      discount: 80,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      usageLimit: 40,
      isActive: true,
      currentUsage: 0,
      userId: null,
      storeId: store2.id,
    },
  });

  // User-specific coupons
  await prisma.coupon.create({
    data: {
      code: 'USER50',
      discount: 50,
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      usageLimit: 1,
      isActive: true,
      currentUsage: 0,
      userId: store1Users[0].id,
      storeId: store1.id,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('- 1 Admin user created');
  console.log('- 2 Manager users created');
  console.log('- 2 Stores created');
  console.log('- 20 Employee users created (10 per store)');
  console.log('- 8 Frame types created');
  console.log('- 10 Frame templates created (4 global + 6 store-specific)');
  console.log('- 2 Media sessions created');
  console.log('- 4 Sample images/videos created');
  console.log('- 5 Sample coupons created');
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('Admin: admin@photobooth.com / 123456');
  console.log('Manager 1: manager1@photobooth.com / 123456');
  console.log('Manager 2: manager2@photobooth.com / 123456');
  console.log('Users: user1@hanoi.photobooth.com / 123456');
  console.log('       user1@saigon.photobooth.com / 123456');
  console.log('       ... (and so on)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
