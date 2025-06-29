import { FileType, PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  
  // Seed Users
  console.log('Seeding Users...')
  
  // Hash password once
  const passwordHash = await bcrypt.hash('password123', 10)
  
  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: passwordHash,
      role: Role.ADMIN,
      phone: '0901234567',
      address: 'Da Nang, Vietnam'
    },
    {
      name: 'Accountant User',
      email: 'accountant@example.com',
      password: passwordHash,
      role: Role.KETOAN,
      phone: '0901234568',
      address: 'Ho Chi Minh City, Vietnam'
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
  
  // Seed Coupons
  console.log('Seeding Coupons...')
  
  const coupons = [
    {
      code: 'WELCOME10',
      discount: 10,
      expires_at: new Date(2025, 11, 31), // December 31, 2025
      user_id: null // Unassigned coupon
    },
    {
      code: 'SUMMER25',
      discount: 25,
      expires_at: new Date(2025, 8, 30), // September 30, 2025
      user_id: allUsers[0]?.id // Assigned to first user if exists
    },
    {
      code: 'HOLIDAY50',
      discount: 50,
      expires_at: new Date(2025, 11, 25), // December 25, 2025
      user_id: allUsers[1]?.id // Assigned to second user if exists
    },
    {
      code: 'BIRTHDAY15',
      discount: 15,
      expires_at: new Date(2025, 9, 15), // October 15, 2025
      user_id: allUsers[2]?.id // Assigned to third user if exists
    },
    {
      code: 'SPECIAL30',
      discount: 30,
      expires_at: new Date(2026, 0, 1), // January 1, 2026
      user_id: null // Unassigned coupon
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

  // Tạo các loại frame
  const frameTypes = [
    {
      name: '1 tấm',
      description: 'Frame đơn giản với 1 ảnh',
      columns: 1,
      rows: 1,
      totalImages: 1,
    },
    {
      name: '1x2',
      description: 'Frame ngang với 2 ảnh trên 1 hàng',
      columns: 2,
      rows: 1,
      totalImages: 2,
    },
    {
      name: '2x2',
      description: 'Frame vuông với 4 ảnh (2x2)',
      columns: 2,
      rows: 2,
      totalImages: 4,
    },
    {
      name: '2x3',
      description: 'Frame chữ nhật với 6 ảnh (2 hàng x 3 cột)',
      columns: 3,
      rows: 2,
      totalImages: 6,
    },
    {
      name: '1x4',
      description: 'Frame dài với 4 ảnh trên 1 hàng',
      columns: 4,
      rows: 1,
      totalImages: 4,
    },
  ]

  for (const frameTypeData of frameTypes) {
    const frameType = await (prisma as any).frameType.upsert({
      where: { name: frameTypeData.name },
      update: {},
      create: frameTypeData,
    })
    console.log(`Created/Updated FrameType: ${frameType.name}`)

    // Tạo template mẫu cho mỗi frame type
    const templateData = {
      name: `Template mặc định cho ${frameTypeData.name}`,
      filename: `template_${frameTypeData.name.replace(/\s+/g, '_').toLowerCase()}.png`,
      path: `/templates/${frameTypeData.name.replace(/\s+/g, '_').toLowerCase()}/`,
      preview: `/templates/${frameTypeData.name.replace(/\s+/g, '_').toLowerCase()}/preview.jpg`,
      frameTypeId: frameType.id,
    }

    await (prisma as any).frameTemplate.upsert({
      where: { filename: templateData.filename },
      update: {},
      create: templateData,
    })
    console.log(`Created/Updated FrameTemplate: ${templateData.name}`)
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
