import { authenticate, UserLoginData } from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/login - User login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate user using our model function
    const loginData: UserLoginData = { email, password };
    const result = await authenticate(loginData);
 
    if (!result) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Return user data and token
    return NextResponse.json(
      {
        user: result.user,
        token: result.token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
