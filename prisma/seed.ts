import { FileType, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.couponUsage.deleteMany();
  await prisma.revenue.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.image.deleteMany();
  await prisma.mediaSession.deleteMany();
  await prisma.frameTemplate.deleteMany();
  await prisma.frameType.deleteMany();
  await prisma.pricing.deleteMany();
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

  // Create Managers (5 managers)
  console.log('👥 Creating Managers...');
  const managers = [];
  for (let i = 1; i <= 5; i++) {
    const manager = await prisma.user.create({
      data: {
        name: `Manager ${i}`,
        email: `manager${i}@photobooth.com`,
        password: defaultPassword,
        role: Role.MANAGER,
        phone: `098765432${i}`,
        address: `123 Đường ${i}, Hà Nội`,
        avatar: `/uploads/avatars/manager${i}.png`,
        isActive: true,
      },
    });
    managers.push(manager);
  }

  // Create Stores (5 stores)
  console.log('🏪 Creating Stores...');
  const stores = [];
  const storeNames = ['Hà Nội', 'Sài Gòn', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];
  const storeColors = [
    { primary: '#FF6B6B', secondary: '#4ECDC4' },
    { primary: '#FFD93D', secondary: '#FF6B6B' },
    { primary: '#6BCF7F', secondary: '#4D96FF' },
    { primary: '#9B59B6', secondary: '#F39C12' },
    { primary: '#E74C3C', secondary: '#3498DB' },
  ];

  for (let i = 0; i < 5; i++) {
    const store = await prisma.store.create({
      data: {
        name: `PhotoBooth ${storeNames[i]}`,
        slogan: `Chụp ảnh đẹp tại ${storeNames[i]}`,
        logo: `/uploads/stores/logo_${storeNames[i].toLowerCase()}.png`,
        background: `/uploads/stores/background_${storeNames[i].toLowerCase()}.png`,
        description: `Cửa hàng photobooth chuyên nghiệp tại ${storeNames[i]}`,
        address: `${123 + i} Đường ${storeNames[i]}, ${storeNames[i]}`,
        phone: `024-345${i}-7890`,
        email: `${storeNames[i].toLowerCase()}@photobooth.com`,
        accountNumber: `12345678${i}0`,
        primaryColor: storeColors[i].primary,
        secondaryColor: storeColors[i].secondary,
        isActive: true,
        maxEmployees: 15 + i * 5,
        managerId: managers[i].id,
      },
    });
    stores.push(store);

    // Update manager with their store
    await prisma.user.update({
      where: { id: managers[i].id },
      data: { storeId: store.id },
    });
  }

  // Create Users for each Store (1 chủ + 5 nhân viên + 5 máy)
  console.log('👨‍💼 Creating Users for all Stores...');
  const allUsers = [];
  
  for (let storeIndex = 0; storeIndex < stores.length; storeIndex++) {
    const store = stores[storeIndex];
    const storeNames = ['HN', 'SG', 'DN', 'CT', 'HP'];
    const storeCode = storeNames[storeIndex];
    
    // Create Store Owner
    const storeOwner = await prisma.user.create({
      data: {
        name: `Chủ cửa hàng ${storeCode}`,
        email: `owner${storeIndex + 1}@${storeCode.toLowerCase()}.photobooth.com`,
        password: defaultPassword,
        role: Role.STORE_OWNER,
        phone: `090123456${storeIndex}`,
        address: `Địa chỉ chủ, ${store.name}`,
        avatar: `/uploads/avatars/owner_${storeCode.toLowerCase()}.png`,
        isActive: true,
        storeId: store.id,
      },
    });
    allUsers.push(storeOwner);

    // Create 5 Employees
    for (let i = 1; i <= 5; i++) {
      const employee = await prisma.user.create({
        data: {
          name: `Nhân viên ${storeCode} ${i}`,
          email: `user${i}@${storeCode.toLowerCase()}.photobooth.com`,
          password: defaultPassword,
          role: Role.USER,
          phone: `091234567${storeIndex}${i}`,
          address: `Địa chỉ ${i}, ${store.name}`,
          avatar: `/uploads/avatars/user_${storeCode.toLowerCase()}_${i}.png`,
          isActive: true,
          storeId: store.id,
        },
      });
      allUsers.push(employee);
    }

    // Create 5 Machine accounts
    for (let i = 1; i <= 5; i++) {
      const machine = await prisma.user.create({
        data: {
          name: `Máy ${storeCode} ${i}`,
          email: `machine${i}@${storeCode.toLowerCase()}.photobooth.com`,
          password: defaultPassword,
          role: Role.MACHINE,
          phone: `092345678${storeIndex}${i}`,
          address: `Vị trí máy ${i}, ${store.name}`,
          avatar: `/uploads/avatars/machine_${storeCode.toLowerCase()}_${i}.png`,
          isActive: true,
          storeId: store.id,
          machineCode: `${storeCode}_MACHINE_${i}`,
          location: `Khu vực ${i}`,
        },
      });
      allUsers.push(machine);
    }
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

  // Create Frame Templates (2 templates cho mỗi frame type)
  console.log('🎨 Creating Frame Templates...');
  
  // Tạo 2 global templates cho mỗi frame type
  for (let typeIndex = 0; typeIndex < createdFrameTypes.length; typeIndex++) {
    const frameType = createdFrameTypes[typeIndex];
    
    for (let templateIndex = 1; templateIndex <= 2; templateIndex++) {
      await prisma.frameTemplate.create({
        data: {
          name: `Template Global ${frameType.name} ${templateIndex}`,
          filename: `global_${frameType.id}_template_${templateIndex}.png`,
          background: `/templates/global/bg_${frameType.id}_${templateIndex}.png`,
          overlay: `/templates/global/overlay_${frameType.id}_${templateIndex}.png`,
          frameTypeId: frameType.id,
          isGlobal: true,
          isActive: true,
          storeId: null,
          position: typeIndex * 2 + templateIndex,
        },
      });
    }
  }

  // Create Sample Media Sessions (5 sessions)
  console.log('📸 Creating Sample Media Sessions...');
  const sessions = [];
  for (let i = 1; i <= 5; i++) {
    const session = await prisma.mediaSession.create({
      data: {
        sessionCode: `DEMO00${i}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });
    sessions.push(session);
  }

  // Create Sample Images (5 images)
  console.log('🖼️  Creating Sample Images...');
  const sampleImages = [
    {
      filename: 'demo_image_1.jpg',
      path: '/uploads/images/demo_image_1.jpg',
      fileType: FileType.IMAGE,
      size: 1024000,
      sessionId: sessions[0].id,
    },
    {
      filename: 'demo_image_2.jpg',
      path: '/uploads/images/demo_image_2.jpg',
      fileType: FileType.IMAGE,
      size: 1536000,
      sessionId: sessions[1].id,
    },
    {
      filename: 'demo_gif_1.gif',
      path: '/uploads/gifs/demo_gif_1.gif',
      fileType: FileType.GIF,
      size: 2048000,
      sessionId: sessions[2].id,
    },
    {
      filename: 'demo_video_1.mp4',
      path: '/uploads/videos/demo_video_1.mp4',
      fileType: FileType.VIDEO,
      size: 10240000,
      duration: 15,
      sessionId: sessions[3].id,
    },
    {
      filename: 'demo_image_3.png',
      path: '/uploads/images/demo_image_3.png',
      fileType: FileType.IMAGE,
      size: 2048000,
      sessionId: sessions[4].id,
    },
  ];

  for (const image of sampleImages) {
    await prisma.image.create({
      data: image,
    });
  }

  // Create Sample Coupons (5 coupons)
  console.log('🎫 Creating Sample Coupons...');
  
  // Global coupons
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

  // Store specific coupons
  for (let i = 0; i < 3; i++) {
    await prisma.coupon.create({
      data: {
        code: `STORE${i + 1}_SALE`,
        discount: 50 + i * 20,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        usageLimit: 30 + i * 10,
        isActive: true,
        currentUsage: 0,
        userId: null,
        storeId: stores[i].id,
      },
    });
  }

  // Create Sample Revenues (5 revenues)
  console.log('💰 Creating Sample Revenues...');
  const revenues = [];
  for (let i = 0; i < 5; i++) {
    const revenue = await prisma.revenue.create({
      data: {
        amount: 50000 + i * 10000,
        description: `Giao dịch mẫu ${i + 1}`,
        userId: allUsers[i * 5].id, // Lấy một số user từ danh sách
        storeId: stores[i].id,
        originalAmount: 70000 + i * 10000,
        discountAmount: 20000,
        couponId: null,
      },
    });
    revenues.push(revenue);
  }

  console.log('✅ Seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('- 1 Admin user created');
  console.log('- 5 Manager users created');
  console.log('- 5 Stores created');
  console.log('- 55 Total users created (1 Admin + 5 Managers + 5 Stores × (1 Owner + 5 Employees + 5 Machines))');
  console.log('- 8 Frame types created (unchanged)');
  console.log('- 16 Frame templates created (2 per frame type)');
  console.log('- 5 Media sessions created');
  console.log('- 5 Sample images/videos created');
  console.log('- 5 Sample coupons created');
  console.log('- 5 Sample revenues created');
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('Admin: admin@gmail.com / 123456');
  console.log('Manager 1: manager1@photobooth.com / 123456');
  console.log('Manager 2: manager2@photobooth.com / 123456');
  console.log('Store Owner 1: owner1@hn.photobooth.com / 123456');
  console.log('Employee 1: user1@hn.photobooth.com / 123456');
  console.log('Machine 1: machine1@hn.photobooth.com / 123456');
  console.log('... (and so on for all stores)');

  // Create Default Pricing
  console.log('💰 Creating default pricing...');
  await prisma.pricing.create({
    data: {
      name: 'Bảng giá mặc định',
      priceOnePhoto: 10000,    // 10,000 VND
      priceTwoPhoto: 18000,    // 18,000 VND
      priceThreePhoto: 25000,  // 25,000 VND
      isActive: true,
      isDefault: true,
    },
  });

  // Create Additional Pricing Options
  await prisma.pricing.create({
    data: {
      name: 'Bảng giá cao cấp',
      priceOnePhoto: 15000,    // 15,000 VND
      priceTwoPhoto: 25000,    // 25,000 VND
      priceThreePhoto: 35000,  // 35,000 VND
      isActive: true,
      isDefault: false,
    },
  });

  await prisma.pricing.create({
    data: {
      name: 'Bảng giá khuyến mãi',
      priceOnePhoto: 8000,     // 8,000 VND
      priceTwoPhoto: 15000,    // 15,000 VND
      priceThreePhoto: 20000,  // 20,000 VND
      isActive: false,
      isDefault: false,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('');
  console.log('📋 Default accounts created:');
  console.log('Admin: admin@gmail.com / 123456');
  console.log('Manager 1: manager1@photobooth.com / 123456');
  console.log('Store Owner 1: owner1@hn.photobooth.com / 123456');
  console.log('User 1: user1@hn.photobooth.com / 123456');
  console.log('Machine 1: machine1@hn.photobooth.com / 123456');
  console.log('... (and so on for all stores)');
  console.log('');
  console.log('💰 Default pricing created:');
  console.log('- Bảng giá mặc định: 10k/18k/25k VND (1/2/3 tấm)');
  console.log('- Bảng giá cao cấp: 15k/25k/35k VND (1/2/3 tấm)');
  console.log('- Bảng giá khuyến mãi: 8k/15k/20k VND (1/2/3 tấm) - Inactive');
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
