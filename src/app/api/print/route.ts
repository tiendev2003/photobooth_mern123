import { exec } from "child_process";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(req: NextRequest) {
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

    const printCommand = `rundll32 C:\\\\Windows\\\\System32\\\\shimgvw.dll,ImageView_PrintTo /pt "${filePath}" ${isCut ? "DS-RX1" : "DS-RX1-Cut"}`;
    console.log("Executing print command:", printCommand);
    try {
      exec(printCommand, (error) => {
        if (error) {
          console.error("Print error:", error);
          return NextResponse.json({ error: "Lỗi in: " }, { status: 500 });
        }

        // Clean up temporary file
        fs.unlink(filePath).catch(() => {});
        return NextResponse.json(
          { message: "In thành công khổ 6x4" },
          { status: 200 }
        );
      });

      return NextResponse.json(
        { message: "In thành công khổ 6x4" },
        { status: 200 }
      );
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
