const mongoose = require("mongoose");
const STATUS = ["Active", "Complete"];

const bookingSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    checkInDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    checkOutDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: STATUS,
      required: true,
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);