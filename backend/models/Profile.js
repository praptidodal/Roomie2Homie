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
      trim: true,
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