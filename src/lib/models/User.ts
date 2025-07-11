import { User as PrismaUser, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { prisma } from "../prisma";

// Use Prisma-generated User type
type User = PrismaUser;

// Omit là một utility type của TypeScript để tạo một type mới bằng cách loại bỏ một số trường của type gốc
export type UserWithoutPassword = Omit<User, "password">;

export interface UserLoginData {
  username: string;
  password: string;
}

export interface UserRegistrationData {
  name: string;
  username: string;
  email?: string;
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
    username: user.username,
    role: user.role,
  };

  const secretKey = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-key"
  );

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(secretKey);
}

export function sanitizeUser(user: User): UserWithoutPassword {
  const { password, ...sanitizedUser } = user;
  console.log("Sanitized user:", password);
  return sanitizedUser;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
    include: {
      store: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}

export async function createUser(
  data: UserRegistrationData
): Promise<UserWithoutPassword> {
  const hashedPassword = await hashPassword(data.password);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email || null,
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
    username?: string;
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
  const user = await findUserByUsername(loginData.username);

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

  const token = await generateToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { currentToken: token },
  });
  return {
    user: sanitizeUser(user),
    token,
  };
}
