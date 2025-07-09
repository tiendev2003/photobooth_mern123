import { authenticate, UserLoginData } from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/login - User login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, isAdminLogin = false } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Authenticate user using our model function
    const loginData: UserLoginData = { username, password };
    const result = await authenticate(loginData);
 
    if (!result) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // If this is an admin login, check if the user has admin privileges
    if (isAdminLogin && !['ADMIN', 'KETOAN'].includes(result.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions for admin access" },
        { status: 403 }
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
