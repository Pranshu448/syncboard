const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ SAFE pre-save hook (NO next)
userSchema.pre("save", function () {
  if (this.isModified("username")) {
    this.username =
      this.username.charAt(0).toUpperCase() + this.username.slice(1);
  }
});

module.exports = mongoose.model("User", userSchema);
