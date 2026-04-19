const mongoose = require("mongoose");
const bookingSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing"
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    checkIn: {
        type: Date,
        required: true
    },

    checkOut: {
        type: Date,
        required: true
    },

    guests: {
        type: Number,
        required: true
    },

   price: Number,
     basePrice: Number,
     gst: Number,

    status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },

    paymentId: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);