const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, "role is required"],
      enum: ["admin", "donor", "NGO"],
    },
    userName: {
      type: String,
      required: function () {
        if (this.role === "donor" || this.role === "admin") {
          return false;
        }
        return true;
      },
    },
    organisationName: {
      type: String,
      required: function () {
        if (this.role === "NGO") {
          return true;
        }
        return false;
      },
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is requied"],
    },
    website: {
      type: String,
    },
    address: {
      type: String,
      required: [true, "address is required"],
    },
    phone: {
      type: String,
      required: [true, "contact number is required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("users", userSchema);