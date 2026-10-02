import Profile from "../models/Profile.js";

const profileFields = [
  "phone",
  "age",
  "gender",
  "occupation",
  "collegeOrCompany",
  "bio",
  "currentLocation",
  "preferredLocations",
  "monthlyBudget",
  "moveInDate",
  "profilePhoto",
  "languages",
  "interests",
  "hasRoom",
];

const lifestyleFields = [
  "sleep",
  "cleanliness",
  "social",
  "food",
  "smoking",
  "pets",
  "guests",
  "workFromHome",
  "music",
  "fitness",
];

const handleError = (res, error, message) => {
  console.error(message, error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message,
  });
};

export const getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
      },
      profile,
    });
  } catch (error) {
    return handleError(res, error, "Unable to fetch profile");
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      profile = new Profile({
        user: req.user._id,
      });
    }

    for (const field of profileFields) {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    }

    if (req.body.fullName !== undefined) {
      const fullName = req.body.fullName.trim();

      if (!fullName) {
        return res.status(400).json({
          success: false,
          message: "Full name cannot be empty",
        });
      }

      req.user.fullName = fullName;
      await req.user.save();
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    return handleError(res, error, "Unable to update profile");
  }
};

export const updateMyLifestyle = async (req, res) => {
  try {
    let profile = await Profile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      profile = new Profile({
        user: req.user._id,
      });
    }

    const answers = {};

    for (const field of lifestyleFields) {
      if (req.body[field] !== undefined) {
        answers[field] = req.body[field];
      }
    }

    profile.lifestyle = {
      ...(profile.lifestyle?.toObject?.() || {}),
      ...answers,
    };

    const missingFields = lifestyleFields.filter(
      (field) =>
        profile.lifestyle[field] === undefined ||
        profile.lifestyle[field] === null ||
        profile.lifestyle[field] === ""
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please answer every lifestyle question",
        missingFields,
      });
    }

    profile.quizCompleted = true;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Lifestyle quiz saved successfully",
      lifestyle: profile.lifestyle,
      quizCompleted: profile.quizCompleted,
    });
  } catch (error) {
    return handleError(res, error, "Unable to save lifestyle quiz");
  }
};
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