import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import {
  uploadProfilePhoto,
} from "../middleware/profilePhotoUpload.js";

import {
  getMyProfile,
  updateMyProfile,
  updateMyLifestyle,
  updateMyProfilePhoto,
} from "../controllers/profileController.js";

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  getMyProfile
);

router.patch(
  "/me",
  authMiddleware,
  updateMyProfile
);

router.patch(
  "/me/lifestyle",
  authMiddleware,
  updateMyLifestyle
);

router.patch(
  "/me/photo",
  authMiddleware,
  uploadProfilePhoto,
  updateMyProfilePhoto
);

export default router;