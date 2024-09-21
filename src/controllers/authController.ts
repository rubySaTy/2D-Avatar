import type { Request, Response } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../utils/db.ts";
import { users, type NewUser } from "../utils/schema.ts";

export class AuthController {
  static async register(req: Request, res: Response) {
    const { username, password, role } = req.body;

    if (role !== "admin" && role !== "psychologist") {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (existingUser.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await argon2.hash(password);

    const newUser: NewUser = {
      username,
      passwordHash,
      role,
    };

    await db.insert(users).values(newUser);

    res.status(201).json({ message: "User created" });
  }

  static async login(req: Request, res: Response) {
    const { username, password } = req.body;
    const secret = process.env.JWT_SECRET || "your_jwt_secret";

    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (userRecords.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = userRecords[0];

    const validPassword = await argon2.verify(user.passwordHash, password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.userId, role: user.role }, secret, {
      expiresIn: "1h",
    });

    res.json({ token });
  }
}
