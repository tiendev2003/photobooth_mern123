import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
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
