import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const filterType = formData.get('filterType') as string;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Base sharp instance
    let sharpInstance = sharp(buffer);
    
    console.log(`Applying filter: ${filterType}`); // Log which filter we're applying

    // Apply filter based on filter type
    switch (filterType) {
      case 'none':
        // No filter, keep as is
        break;
      case 'grayscale':
        sharpInstance = sharpInstance.grayscale();
        break;
      case 'sepia':
        // Sepia effect using modulate
        sharpInstance = sharpInstance.modulate({ saturation: 0.7 }).tint('#f0e6d2');
        break;
        
      // Skin filters based on the skinFilters array
      case 'soft':
        // Da mềm mịn (brightness-105 contrast-95 saturate-95)
        sharpInstance = sharpInstance
          .modulate({ brightness: 1.05, saturation: 0.95 })
          .normalise(); // Using normalise instead of gamma for contrast adjustment
        break;
      case 'bright':
        // Da sáng (brightness-110 contrast-90 saturate-105)
        sharpInstance = sharpInstance
          .modulate({ brightness: 1.10, saturation: 1.05 })
          .normalise(); // Using normalise instead of gamma for low contrast
        break;
      case 'glow':
        // Da rạng rỡ (brightness-110 contrast-110 saturate-110)
        sharpInstance = sharpInstance
          .modulate({ brightness: 1.10, saturation: 1.10 })
          .gamma(1.10) // For contrast effect (within valid range)
          .convolve({
            width: 3,
            height: 3,
            kernel: [1, 1, 1, 1, 1, 1, 1, 1, 1],
            scale: 9,
          });
        break;
      case 'smooth':
        // Da mượt (brightness-105 contrast-90 saturate-95 blur-[0.2px])
        sharpInstance = sharpInstance
          .modulate({ brightness: 1.05, saturation: 0.95 })
          .normalise() // Using normalise instead of gamma for low contrast
          .blur(0.2);
        break;
      case 'vintage':
        // Hoài cổ (sepia brightness-90 contrast-110)
        sharpInstance = sharpInstance
          .modulate({ saturation: 0.7, brightness: 0.9 })
          .tint('#f0e6d2') // sepia tone
          .normalise() // Use normalise instead of gamma for contrast
          .recomb([ // Enhance vintage look with color matrix
            [0.9, 0.1, 0.0],
            [0.3, 0.8, 0.1],
            [0.2, 0.1, 0.7]
          ]);
        break;
        
      // Advanced beauty filters
      case 'beauty':
        // Làm đẹp da - kết hợp làm mịn, tăng sáng nhẹ, và điều chỉnh tông màu
        sharpInstance = sharpInstance
          // Làm mịn da với gaussian blur nhẹ
          .blur(0.5)
          // Tăng sáng và độ ấm nhẹ
          .modulate({ brightness: 1.08, saturation: 1.05 })
          // Cân bằng tông màu da
          .tint('#fff5e6')
          // Tăng độ tương phản nhẹ để giữ chi tiết
          .normalise()
          // Làm mềm ảnh nhưng giữ lại các cạnh (high pass filter)
          .convolve({
            width: 3,
            height: 3,
            kernel: [
              0, -1, 0,
              -1, 5, -1,
              0, -1, 0
            ],
            scale: 1
          });
        break;
        
      case 'brightSkin':
        // Làm sáng da
        sharpInstance = sharpInstance
          // Tăng độ sáng chung
          .modulate({ brightness: 1.15, saturation: 1.0 })
          // Tinh chỉnh màu sắc da
          .tint('#fff8f0')
          // Làm mềm các khuyết điểm
          .blur(0.3)
          // Tăng cường độ sáng cho vùng sáng
          .linear(1.05, -3)
          // Giữ lại chi tiết với normalise
          .normalise();
        break;
        
      case 'pinkLips':
        // Môi hồng - Lưu ý: đây là filter đơn giản, không thể nhận diện môi
        // Filter thực sự cho môi hồng cần AI để nhận diện vùng môi
        sharpInstance = sharpInstance
          // Tăng độ đậm của màu đỏ trong ảnh
          .modulate({ saturation: 1.15 })
          // Tạo hiệu ứng hồng cho môi và má
          .tint('#ffddee')
          // Tăng độ sáng
          .modulate({ brightness: 1.05 })
          // Tăng độ tương phản nhẹ
          .linear(1.05, 0);
        break;
        
      // Original filters
      case 'warm':
        // Warm filter
        sharpInstance = sharpInstance
          .modulate({ saturation: 1.25 })
          .tint('#ffe0b2');
        break;
      case 'cool':
        // Cool filter
        sharpInstance = sharpInstance
          .modulate({ brightness: 1.05 })
          .tint('#cfd8dc');
        break;
      case 'saturate':
        // Saturation increase
        sharpInstance = sharpInstance.modulate({ saturation: 1.5 });
        break;
      case 'contrast':
        // Contrast increase
        sharpInstance = sharpInstance
          .modulate({ brightness: 1.0 }) // Keep brightness unchanged
          .normalise(); // Enhance contrast by normalising the image
        break;
      case 'blur':
        // Slight blur
        sharpInstance = sharpInstance.blur(0.5);
        break;
        
      case 'slimFace':
        // Giả lập hiệu ứng "bóp mặt" đơn giản
        // Lưu ý: Bóp mặt thực sự yêu cầu nhận dạng khuôn mặt và biến đổi hình học
        // Đây chỉ là hiệu ứng gần giống
        sharpInstance = sharpInstance
          // Tăng độ tương phản để làm nổi bật cấu trúc khuôn mặt
          .modulate({ brightness: 1.05 })
          .normalise()
          // Làm mềm da
          .blur(0.4)
          // Tạo hiệu ứng chiều sâu cho gò má bằng màu sắc
          .recomb([
            [1.1, -0.1, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0]
          ])
          // Tạo hiệu ứng bóng nhẹ
          .linear(1.05, -5);
        break;
        
      default:
        console.log("Unknown filter type:", filterType);
        // Default - no filter
        break;
    }

    // Process the image
    try {
      const processedImageBuffer = await sharpInstance
        .jpeg({ quality: 90 })
        .toBuffer();
        
      console.log(`Filter ${filterType} applied successfully`);

      // Return the processed image
      return new NextResponse(processedImageBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': 'inline',
        },
      });
    } catch (sharpError) {
      console.error(`Sharp error applying filter ${filterType}:`, sharpError);
      
      // Fallback: return the original image without filters if Sharp processing fails
      const fallbackBuffer = await sharp(buffer)
        .jpeg({ quality: 90 })
        .toBuffer();
        
      console.log("Returning unfiltered image as fallback");
      
      return new NextResponse(fallbackBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': 'inline',
        },
      });
    }
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
