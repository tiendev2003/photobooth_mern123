import { prisma } from "../prisma";

export async function cleanExpiredMedia() {
  try {
    // Lấy thời gian hiện tại - 3 ngày
    const now = new Date();
    now.setDate(now.getDate() - 3);
    const formattedDate = `${now.getDate()}_${
      now.getMonth() + 1
    }_${now.getFullYear()}`;
    console.log(`Đang xóa media hết hạn trước ngày: ${formattedDate}`);

    // Tìm tất cả media đã hết hạn
    const expiredMedia = await prisma.mediaSession.findMany({
      where: {
        expiresAt: {
          lt: now, // Các media có expiresAt nhỏ hơn thời gian hiện tại
        },
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    if (expiredMedia.length === 0) {
      console.log("Không có media nào hết hạn cần xử lý");
      return {
        success: true,
        cleanedCount: 0,
        message: "Không có media nào hết hạn cần xử lý",
      };
    }
    // fetch gọi api  cloud để xóa media với url như sau process.env.NEXT_PUBLIC_EXTERNAL_DOMAIN + api.php?action=delete_files_by_date&date=17_07_2025

    await fetch(
      `${process.env.NEXT_PUBLIC_EXTERNAL_DOMAIN}/api.php?action=delete_files_by_date&date=${formattedDate}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Đã gửi yêu cầu xóa media hết hạn đến cloud với ngày: ${now}`);

    // Lấy danh sách ID của các media hết hạn
    const expiredIds = expiredMedia.map((media) => media.id);

    // Xóa tất cả media hết hạn
    const deleteResult = await prisma.mediaSession.deleteMany({
      where: {
        id: {
          in: expiredIds,
        },
      },
    });

    console.log(`Đã xóa ${deleteResult.count} media hết hạn`);

    return {
      success: true,
      cleanedCount: deleteResult.count,
      message: `Đã xóa ${deleteResult.count} media hết hạn`,
      affectedMedia: expiredMedia.map((m) => ({
        id: m.id,
        expiresAt: m.expiresAt,
      })),
    };
  } catch (error) {
    console.error("Lỗi khi xóa media hết hạn:", error);
    return {
      success: false,
    };
  }
}
