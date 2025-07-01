import { exec } from "child_process";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import os from "os";
import path from "path";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { base64Image ,isCut} = body;
    
    if (!base64Image) {
      return NextResponse.json(
        { error: "Missing base64 image" },
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      `temp_print_${Date.now()}.png`
    );

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Write file asynchronously
    await fs.writeFile(filePath, buffer);

    // Detect the operating system
    const platform = os.platform();
    let printCommand;
    
    if (platform === 'win32') {
      // Windows-specific printing command
      printCommand = `rundll32 C:\\\\Windows\\\\System32\\\\shimgvw.dll,ImageView_PrintTo /pt "${filePath}" ${isCut ? "DS-RX1" : "DS-RX1-Cut"}`;
    } else {
      // For Linux/VPS environment: Save the file to a designated print folder for later processing
      // The actual printing will need to be handled by a separate process on the server
      const printFolderPath = path.join(process.cwd(), "public", "uploads", "print_queue");
      
      try {
        await fs.mkdir(printFolderPath, { recursive: true });
      } catch (err) {
        console.log("Print folder already exists or could not be created",err);
      }
      
      const printInfoPath = path.join(printFolderPath, `print_info_${Date.now()}.json`);
      await fs.writeFile(printInfoPath, JSON.stringify({
        filePath: filePath,
        timestamp: new Date().toISOString(),
        printer: isCut ? "DS-RX1" : "DS-RX1-Cut"
      }));
      
      // Log that file is queued for printing
      console.log(`Image saved to print queue: ${filePath}`);
      return NextResponse.json(
        { message: "Ảnh đã được lưu vào hàng đợi in", queuedForPrinting: true },
        { status: 200 }
      );
    }
    
    console.log("Executing print command:", printCommand);
    try {
      if (!printCommand) {
        throw new Error("Không thể tạo lệnh in cho hệ điều hành này");
      }
      
      // We need to create a Promise to properly handle the exec callback
      return new Promise<NextResponse>((resolve) => {
        exec(printCommand, (error) => {
          if (error) {
            console.error("Print error:", error);
            resolve(NextResponse.json({ error: "Lỗi in: " + error.message }, { status: 500 }));
          } else {
            // Clean up temporary file
            fs.unlink(filePath).catch(() => {});
            resolve(NextResponse.json(
              { message: "In thành công khổ 6x4" },
              { status: 200 }
            ));
          }
        });
      });
    } catch (error) {
       await fs.unlink(filePath).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error("Lỗi in:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý ảnh: " + (error || "Unknown error") },
      { status: 500 }
    );
  }
}
