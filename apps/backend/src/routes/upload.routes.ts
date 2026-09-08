import { Router } from "express";
import multer from "multer";
import {
  uploadImageHandler,
  getImageKitAuthHandler,
  deleteImageHandler,
} from "../controllers/upload.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const uploadRouter: Router = Router();

const multerFactory = (typeof multer === "function" ? multer : (multer as any).default) as typeof multer;

// Memory storage for fast buffering before uploading to ImageKit
const upload = multerFactory({
  storage: multerFactory.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

/**
 * Public/Client auth parameters for direct upload to ImageKit
 */
uploadRouter.get("/auth", getImageKitAuthHandler);

/**
 * Authenticated upload route (multipart/form-data with "image" or "file" field, or json body with "file")
 */
uploadRouter.post(
  "/image",
  authenticate,
  upload.single("image"),
  uploadImageHandler
);

/**
 * Authenticated delete route
 */
uploadRouter.delete("/image/:fileId", authenticate, deleteImageHandler);

export { uploadRouter };
