import express from "express";
import prisma from "../../lib/prisma.js";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { UserRole } from "../generated/prisma/enums.js";

const userRoles = [UserRole.ADMIN, UserRole.STAFF, UserRole.DOCTOR, UserRole.PATIENT] as const;
type UserRoleValue = (typeof userRoles)[number];
const isUserRole = (value: unknown): value is UserRoleValue =>
  typeof value === "string" && userRoles.includes(value.toUpperCase() as UserRoleValue);

export const authRegister = async (
  req: express.Request,
  res: express.Response,
) => {
  const {
    name,
    licenceNumber,
    email,
    phone,
    password,
    role,
    gender,
    DOB,
    department,
  } = req.body;
  try {
    const normalizedRole = typeof role === "string" ? role.toUpperCase() : role;
    if (!name || !email || !phone || !password || !isUserRole(normalizedRole)) {
      return res
        .status(400)
        .json({ message: "Name, email, phone, password, and a valid role are required." });
    }
    if (normalizedRole === "DOCTOR" && !licenceNumber) return res.status(400).json({ message: "A licence number is required for doctors." });
    const birthDate = DOB ? new Date(DOB) : undefined;
    if (birthDate && Number.isNaN(birthDate.getTime())) return res.status(400).json({ message: "A valid date of birth is required." });
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "JWT secret is not configured." });

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");

    const user = await prisma.user.create({
      data: {
        name,
        licenceNumber,
        email: normalizedEmail,
        gender,
        department,
        ...(birthDate ? { DOB: birthDate } : {}),
        phoneNumber: phone.trim(),
        hashedPassword: `${salt}:${passwordHash}`,
        role: normalizedRole,
      },
    });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Error registering user:", error);
    return res.status(500).json({ message: "Server issue." });
  }
};

export const authLogin = async (
  req: express.Request,
  res: express.Response,
) => {
    const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const [salt, storedHash] = user.hashedPassword.split(":");
    if (!salt || !storedHash) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordHash = crypto.scryptSync(password, salt, 64);
    const storedHashBuffer = Buffer.from(storedHash, "hex");
    const passwordMatches =
      passwordHash.length === storedHashBuffer.length &&
      crypto.timingSafeEqual(passwordHash, storedHashBuffer);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT secret is not configured." });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server issue." });
  }
};
