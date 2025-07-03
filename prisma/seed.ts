import { FileType, PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  
  // Seed Users
  console.log('Seeding Users...')
  
  // Hash password once
  const passwordHash = await bcrypt.hash('123123123', 10)
  
  const users = [
    {
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: passwordHash,
      role: Role.ADMIN,
      phone: '0901234567',
      address: 'Da Nang, Vietnam'
    },
    {
      name: 'Nguyen Van A',
      email: 'nguyenvana@example.com',
      password: passwordHash,
      role: Role.USER,
      phone: '0901234569',
      address: 'Hanoi, Vietnam'
    },
    {
      name: 'Tran Thi B',
      email: 'tranthib@example.com',
      password: passwordHash,
      role: Role.USER,
      phone: '0901234570',
      address: 'Hue, Vietnam'
    },
    {
      name: 'Le Van C',
      email: 'levanc@example.com',
      password: passwordHash,
      role: Role.USER,
      phone: '0901234571',
      address: 'Nha Trang, Vietnam'
    }
  ]
  
  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
    console.log(`Created/Updated User: ${userData.name}`)
  }
  
  // Get all users for coupon assignment
  const allUsers = await prisma.user.findMany({ 
    where: { role: Role.USER }
  })
  
  // Get admin user for brand assignment
  const adminUser = await prisma.user.findFirst({
    where: { role: Role.ADMIN }
  })

  // Seed Brand for Admin
  if (adminUser) {
    console.log('Seeding Brand for Admin...')
    await prisma.brand.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        name: 'Admin Photobooth',
        userId: adminUser.id,
        logo: '/uploads/images/logo.png',
        background: '/uploads/images/background.png',
        primaryColor: '#0066CC',
        secondaryColor: '#FF9900',
        socialFacebook: 'https://facebook.com/adminphotobooth',
        socialInstagram: 'https://instagram.com/adminphotobooth'
      }
    })
    console.log('Created/Updated Brand for Admin')
  }
  
  // Seed Coupons
  console.log('Seeding Coupons...')
  
  const coupons = [
    {
      code: '1111111111',
      discount: 200,
      expires_at: new Date(2025, 11, 31), // December 31, 2025
      user_id: null, // Unassigned coupon
      usageLimit: 100
    },
    {
      code: '2222222222',
      discount: 200,
      expires_at: new Date(2025, 8, 30), // September 30, 2025
      user_id: allUsers[0]?.id, // Assigned to first user if exists
      usageLimit: 50
    },
    {
      code: '3333333333',
      discount: 200,
      expires_at: new Date(2025, 11, 25), // December 25, 2025
      user_id: allUsers[1]?.id, // Assigned to second user if exists
      usageLimit: 10
    },
    {
      code: '4444444444',
      discount: 200,
      expires_at: new Date(2025, 9, 15), // October 15, 2025
      user_id: allUsers[2]?.id, // Assigned to third user if exists
      usageLimit: 30
    },
    {
      code: '5555555555',
      discount: 200,
      expires_at: new Date(2026, 0, 1), // January 1, 2026
      user_id: null, // Unassigned coupon
      usageLimit: 20
    },
    {
      code: '6666666666',
      discount: 200,
      expires_at: new Date(2025, 11, 31), // December 31, 2025
      user_id: null, // Unassigned coupon
      usageLimit: 40
    }
  ]
  
  for (const couponData of coupons) {
    await prisma.coupon.upsert({
      where: { code: couponData.code },
      update: {},
      create: couponData,
    })
    console.log(`Created/Updated Coupon: ${couponData.code}`)
  }
  
  // Seed Images
  console.log('Seeding Images...')
  
  const images = [
    {
      filename: 'sample_image_1.png',
      path: '/uploads/images/sample_image_1.png',
      fileType: FileType.IMAGE,
      size: 1024 * 1024 * 2, // 2MB
    },
    {
      filename: 'sample_image_2.png',
      path: '/uploads/images/sample_image_2.png',
      fileType: FileType.IMAGE,
      size: 1024 * 1024 * 1.5, // 1.5MB
    },
    {
      filename: 'sample_gif_1.gif',
      path: '/uploads/images/sample_gif_1.gif',
      fileType: FileType.GIF,
      size: 1024 * 1024 * 3, // 3MB
    },
    {
      filename: 'sample_video_1.mp4',
      path: '/uploads/videos/sample_video_1.mp4',
      fileType: FileType.VIDEO,
      size: 1024 * 1024 * 5, // 5MB
      duration: 15, // 15 seconds
    },
    {
      filename: 'sample_video_2.mp4',
      path: '/uploads/videos/sample_video_2.mp4',
      fileType: FileType.VIDEO,
      size: 1024 * 1024 * 8, // 8MB
      duration: 30, // 30 seconds
    }
  ]
  
  for (const imageData of images) {
    await prisma.image.upsert({
      where: { filename: imageData.filename },
      update: {},
      create: imageData,
    })
    console.log(`Created/Updated Image: ${imageData.filename}`)
  }
  
  console.log('Seeding FrameTypes và FrameTemplates...')

  // Tạo các loại frame với ID tùy chỉnh
  const frameTypes = [
    {
      id: '1',
      name: '1 tấm',
      description: 'Frame đơn giản với 1 ảnh',
      image: '/uploads/type/1x1.png',
      columns: 1,
      rows: 1,
      totalImages: 1,
    },
    {
      id: '2',
      name: '1x2',
      description: 'Frame ngang với 2 ảnh trên 1 hàng',
      image: '/uploads/type/2x1.png',
      columns: 2,
      rows: 1,
      totalImages: 2,
    },
    {
      id: '3',
      name: '2x2',
      description: 'Frame vuông với 4 ảnh (2x2)',
      image: '/uploads/type/2x2.png',
      columns: 2,
      rows: 2,
      totalImages: 4,
    },
    {
      id: '4',
      name: '2x3',
      description: 'Frame chữ nhật với 6 ảnh (3 hàng x 2 cột)',
      image: '/uploads/type/2x3.png',
      columns: 3,
      rows: 2,
      totalImages: 6,
    },
    {
      id: '5',
      name: '1x4',
      description: 'Frame dài với 4 ảnh trên 1 hàng',
      image: '/uploads/type/1x4.png',
      columns: 4,
      rows: 1,
      isHot: true,
      totalImages: 4,
    },
    {
      id: '6',
      name: '3x2',
      description: 'Frame chữ nhật với 6 ảnh (3 hàng x 2 cột)',
      image: '/uploads/type/3x2.png',
      columns: 2,
      rows: 3,
      totalImages: 6,
    },
    {
      id: '7',
      name: 'Khung hình tròn',
      description: 'Frame hình tròn đặc biệt',
      image: '/uploads/type/1x1_circle.png',
      columns: 1,
      rows: 1,
      totalImages: 1,
      isCircle: true,
    },
    {
      id: '8',
      name: 'Khung hình 1x2',
      description: 'Frame dọc với 2 ảnh xếp dọc',
      image: '/uploads/type/1x2.png',
      columns: 1,
      rows: 2,
      totalImages: 2,
      isCustom: true,
    }
  ]

  for (const frameTypeData of frameTypes) {
    const frameType = await prisma.frameType.upsert({
      where: { id: frameTypeData.id },
      update: {},
      create: frameTypeData,
    })
    console.log(`Created/Updated FrameType: ${frameType.name} with ID: ${frameType.id}`)

    // Tạo templates mẫu tùy chỉnh cho từng loại frame
    if (frameTypeData.id === '7') {
      // Tạo templates đặc biệt cho khung hình tròn
      for (let i = 1; i <= 10; i++) {
        const circleTemplateData: any = {
          name: `Template tròn ${i}`,
          filename: `template_circle_${i}.png`,
          background: `/templates/circle/bg_${i}.png`,
          overlay: `/templates/circle/overlay_${i}.png`,
          frameTypeId: frameType.id,
          isActive: true
        }

        await prisma.frameTemplate.upsert({
          where: { filename: circleTemplateData.filename },
          update: {},
          create: circleTemplateData,
        })
        console.log(`Created/Updated Circle FrameTemplate: ${circleTemplateData.name}`)
      }
    } 
    else if (frameTypeData.id === '8') {
      // Tạo templates đặc biệt cho khung hình 1x2
      for (let i = 1; i <= 10; i++) {
        const custom1x2TemplateData: any = {
          name: `Template 1x2 ${i}`,
          filename: `template_1x2_${i}.png`,
          background: `/templates/1x2/bg_${i}.png`,
          overlay: `/templates/1x2/overlay_${i}.png`,
          frameTypeId: frameType.id,
          isActive: true
        }

        await prisma.frameTemplate.upsert({
          where: { filename: custom1x2TemplateData.filename },
          update: {},
          create: custom1x2TemplateData,
        })
        console.log(`Created/Updated 1x2 FrameTemplate: ${custom1x2TemplateData.name}`)
      }
    }
    else {
      // Tạo 10 template mẫu cho các frame type khác
      for (let i = 1; i <= 10; i++) {
        // Type cast to avoid TypeScript errors
        const templateData: any = {
          name: `Template ${i} cho ${frameTypeData.name}`,
          filename: `template_${frameTypeData.id}_${i}.png`,
          background: `/templates/${frameTypeData.id}/bg_${i}.png`,
          overlay: `/templates/${frameTypeData.id}/overlay_${i}.png`,
          frameTypeId: frameType.id,
          isActive: true
        }

        await prisma.frameTemplate.upsert({
          where: { filename: templateData.filename },
          update: {},
          create: templateData,
        })
        console.log(`Created/Updated FrameTemplate: ${templateData.name}`)
      }
    }
  }

  console.log('Seeding hoàn thành!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
