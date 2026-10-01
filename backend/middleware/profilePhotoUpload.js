import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const uploadDirectory = path.join(
  currentDirectory,
  "../uploads/profile-photos"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension = extensions[file.mimetype];

    const fileName = `${req.user._id}-${Date.now()}${extension}`;

    callback(null, fileName);
  },
});

const uploader = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, callback) => {
    if (!extensions[file.mimetype]) {
      return callback(
        new Error(
          "Only JPG, PNG and WebP images are allowed"
        )
      );
    }

    callback(null, true);
  },
}).single("profilePhoto");

export function uploadProfilePhoto(req, res, next) {
  uploader(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  });
}
export const updateMyProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile photo",
      });
    }

    let profile = await Profile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      profile = new Profile({
        user: req.user._id,
      });
    }

    profile.profilePhoto =
      `/uploads/profile-photos/${req.file.filename}`;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      profilePhoto: profile.profilePhoto,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "Unable to update profile photo"
    );
  }
};