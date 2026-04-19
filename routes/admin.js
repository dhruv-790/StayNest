const express = require("express");
const router = express.Router();

const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/review");
const User = require("../models/user");



router.get("/dashboard", async (req, res) => {

    const totalListings = await Listing.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalUsers = await User.countDocuments();

    res.render("admin/dashboard", {
        totalListings,
        totalBookings,
        totalReviews,
        totalUsers
    });
});

router.get("/listings", async (req, res) => {
    const listings = await Listing.find({ owner: req.user._id });
    res.render("admin/listings", { listings });
});

router.get("/bookings", async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing user");

    res.render("admin/bookings", { bookings });
});

router.get("/reviews", async (req, res) => {
    const reviews = await Review.find({ author: req.user._id })
        .populate("author");

    res.render("admin/reviews", { reviews });
});

router.get("/users", async (req, res) => {

    const userListings = await Listing.find({ owner: req.user._id });
    const listingIds = userListings.map(l => l._id);

    const bookings = await Booking.find({
        listing: { $in: listingIds }
    }).populate("user");

    const userStats = {};

    bookings.forEach(b => {
        const id = b.user._id.toString();

        if (!userStats[id]) {
            userStats[id] = {
                user: b.user,
                count: 0
            };
        }

        userStats[id].count++;
    });

    const users = Object.values(userStats);

    res.render("admin/users", { users });
});



module.exports = router;