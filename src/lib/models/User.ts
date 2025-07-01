import { User as PrismaUser, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { prisma } from "../prisma";

// Use Prisma-generated User type
type User = PrismaUser;

// Omit là một utility type của TypeScript để tạo một type mới bằng cách loại bỏ một số trường của type gốc
export type UserWithoutPassword = Omit<User, "password">;

export interface UserLoginData {
  email: string;
  password: string;
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  role?: Role;
  phone?: string | null;
  address?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function generateToken(user: User): Promise<string> {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const secretKey = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-key"
  );

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
}

export function sanitizeUser(user: User): UserWithoutPassword {
  // Tạo một bản sao của user và loại bỏ password
  const { password , ...sanitizedUser } = user;
  console.log("Sanitized User:", password);
  return sanitizedUser;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(
  data: UserRegistrationData
): Promise<UserWithoutPassword> {
  const hashedPassword = await hashPassword(data.password);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || "USER",
      phone: data.phone,
      address: data.address,
    },
  });

  return sanitizeUser(newUser);
}

export async function updateUser(
  id: string,
  data: Partial<UserRegistrationData>
): Promise<UserWithoutPassword | null> {
  const updateData: Partial<{
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    phone?: string | null;
    address?: string | null;
  }> = { ...data };

  // Nếu có password thì hash trước khi lưu
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return sanitizeUser(updatedUser);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function authenticate(
  loginData: UserLoginData
): Promise<{ user: UserWithoutPassword; token: string } | null> {
  const user = await findUserByEmail(loginData.email);

  if (!user) {
    return null;
  }

  const passwordMatch = await comparePasswords(
    loginData.password,
    user.password
  );
  if (!passwordMatch) {
    return null;
  }

  // Generate a new token for this login session
  const token = await generateToken(user);
  
  // Update the user's currentToken in the database
  // This will invalidate any previous tokens from other devices
  await prisma.user.update({
    where: { id: user.id },
    data: { currentToken: token },
  });
  return {
    user: sanitizeUser(user),
    token,
  };
}
