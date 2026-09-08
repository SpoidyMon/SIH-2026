import { Router } from "express";
import multer from "multer";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import {
  handleSendAiMessage,
  handleSendAiVoiceMessage,
  handleGetAiConversation,
} from "../controllers/ai.controller.js";
import { Role } from "@prisma/client";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB audio file limit
});

const router: Router = Router();

// Protect all AI routes with farmer authentication
router.use(authenticate, requireRole(Role.FARMER));

router.post("/message", handleSendAiMessage);
router.post("/voice", upload.single("audio"), handleSendAiVoiceMessage);
router.get("/conversations/:id", handleGetAiConversation);

export default router;
