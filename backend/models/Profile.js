import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    age: {
      type: Number,
      min: 18,
      max: 100,
    },

    gender: {
      type: String,
      enum: ["female", "male", "non_binary"],
    },

    occupation: {
      type: String,
      trim: true,
    },

    collegeOrCompany: {
      type: String,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    currentLocation: {
      type: String,
      trim: true,
    },

    preferredLocations: [
      {
        type: String,
        trim: true,
      },
    ],

    monthlyBudget: {
      type: Number,
      min: 0,
    },

    moveInDate: {
      type: Date,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    languages: [
      {
        type: String,
        trim: true,
      },
    ],

    interests: [
      {
        type: String,
        trim: true,
      },
    ],

    hasRoom: {
      type: Boolean,
      default: false,
    },

    lifestyle: {
      sleep: {
        type: String,
        enum: ["early_bird", "flexible", "night_owl"],
      },

      cleanliness: {
        type: String,
        enum: ["very_tidy", "tidy", "relaxed"],
      },

      social: {
        type: String,
        enum: ["homebody", "balanced", "very_social"],
      },

      food: {
        type: String,
        enum: [
          "vegetarian",
          "eggetarian",
          "non_vegetarian",
          "jain",
        ],
      },

      smoking: {
        type: String,
        enum: ["no", "occasionally", "yes"],
      },

      pets: {
        type: Boolean,
      },

      guests: {
        type: String,
        enum: ["rarely", "sometimes", "often"],
      },

      workFromHome: {
        type: Boolean,
      },

      music: {
        type: String,
        enum: ["headphones", "low_speaker", "loud"],
      },

      fitness: {
        type: String,
        enum: ["gym_daily", "sometimes", "not_really"],
      },
    },

    quizCompleted: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;