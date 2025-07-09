import { createUser, findUserByUsername, UserRegistrationData } from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/register - User registration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, password } = body;

    // Validate required fields
    if (!name || !username || !password) {
      return NextResponse.json({ error: 'Name, username, and password are required' }, { status: 400 });
    }

    // Check if user with this username already exists
    const existingUser = await findUserByUsername(username);

    if (existingUser) {
      return NextResponse.json({ error: 'User with this username already exists' }, { status: 409 });
    }

    // Create the new user using our model function
    const userData: UserRegistrationData = {
      name,
      username,
      email,
      password
      // Default role (USER) sẽ được xử lý trong hàm createUser
    };
    
    const newUser = await createUser(userData);

    return NextResponse.json({
      message: 'Registration successful',
      user: newUser
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
