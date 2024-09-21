import { Router, type Response } from "express";
import { PsychologistController } from "../controllers/psychologistController.ts";
import {
  authenticateJWT,
  type AuthenticatedRequest,
} from "../middlewares/authenticateJWT.ts";

const router = Router();

const psychologistOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
) => {
  if (req.user.role !== "psychologist") {
    return res.sendStatus(403);
  }
  next();
};

router.post(
  "/avatars",
  authenticateJWT,
  psychologistOnly,
  PsychologistController.createAvatar
);
router.post(
  "/sessions",
  authenticateJWT,
  psychologistOnly,
  PsychologistController.createSession
);

export default router;
