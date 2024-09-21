import { Router } from "express";
import { AuthController } from "../controllers/authController.ts";

const router = Router();

router.post("/register", AuthController.register); // For admin user creation
router.post("/login", AuthController.login);

export default router;
