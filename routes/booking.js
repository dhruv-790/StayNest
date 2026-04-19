const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const { isLoggedIn } = require("../middleware");
const Listing = require("../models/listing");

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const razorpay = require("../utils/payment");




router.get("/", isLoggedIn, async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing");

    res.render("bookings/index.ejs", { bookings });
});


router.get("/:id/confirmation", isLoggedIn, async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate("listing")
        .populate("user");

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/listings");
    }

    res.render("bookings/confirmation.ejs", { booking });
});



//pdf ticket


router.get("/:id/ticket", isLoggedIn, async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate("listing")
        .populate("user");

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/listings");
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=ticket_${booking._id}.pdf`
    );

    doc.pipe(res);

    // 🧾 HEADER
    doc
        .fontSize(22)
        .text("HOTEL BOOKING TICKET", { align: "center", underline: true });

    doc.moveDown(2);

    // 🧾 stamp
    doc.save();
    doc.rotate(-30, { origin: [300, 300] });

    doc.fontSize(40)
   .fillColor("red")
   .opacity(0.25)
   .text("PAID", 180, 250, { align: "center" });

   doc.restore();
    doc.opacity(1).fillColor("black");


    // QR CODE DATA
    const qrData = JSON.stringify({
        bookingId: booking._id,
        user: booking.user.username,
        listing: booking.listing.title
    });

    const qrImage = await QRCode.toDataURL(qrData);

    // Convert base64 to image buffer
    const base64Data = qrImage.replace(/^data:image\/png;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");

    // 📌 Draw QR code
    doc.image(imgBuffer, 400, 120, { width: 120 });

    // 🟦 BOX STYLE (simple border)
    doc.rect(50, 120, 500, 250).stroke();

    // 📌 Booking Info
    doc.fontSize(14);

    doc.text(`Booking ID: ${booking._id}`, 70, 140);
    doc.text(`Guest Name: ${booking.user.username}`, 70, 165);
    doc.text(`Email: ${booking.user.email}`, 70, 190);

    doc.text(`Hotel: ${booking.listing.title}`, 70, 215);
    doc.text(`Location: ${booking.listing.location}`, 70, 240);

    doc.text(`Price: Rs.${booking.listing.price}`, 70, 265);

    doc.text(
        `Booked On: ${new Date(booking.createdAt).toLocaleDateString()}`,
        70,
        290
    )
    doc.text(
    `Payment Mode: ${booking.status === "paid" ? "Online (Paid)" : "Cash at Hotel"}`,
    70,
    315
);
    

    doc.moveDown(2);

    // 💬 FOOTER
    doc
        .fontSize(12)
        .text(
            "Thank you for booking with us! Please show this ticket at check-in.",
            50,
            400,
            { align: "center" }
        );

    doc.end();
});


//payment
router.get("/:id/payment", isLoggedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    req.session.bookingData = {
    checkIn: req.query.checkIn,
    checkOut: req.query.checkOut,
    guests: req.query.guests
};

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const gst = listing.price * 0.18;
    const total = listing.price + gst;

    res.render("bookings/payment.ejs", {
        listing,
        gst,
        total
    });
});


router.post("/:id/confirm", isLoggedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // 💰 GST CALCULATION
    const basePrice = listing.price;
    const gst = basePrice * 0.18;
    const totalPrice = basePrice + gst;

    // 📦 CREATE BOOKING
    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        
         checkIn: new Date(req.body.checkIn),
         checkOut: new Date(req.body.checkOut),
         guests: Number(req.body.guests),

        price: totalPrice, // ✅ IMPORTANT FIX
        status: "pending"
    });

    // console.log("BODY:", req.body);
    await booking.save();

    res.redirect(`/bookings/${booking._id}/success`);
});


router.get("/:id/success", isLoggedIn, async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate("listing");

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/listings");
    }

    res.render("bookings/success.ejs", { booking });
});


//razorpay
router.post("/:id/create-order", isLoggedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    const basePrice = listing.price;
    const gst = basePrice * 0.18;
    const total = basePrice + gst;

    const options = {
        amount: total * 100, // paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.json({
        order,
        listing,
        amount: total
    });
});

router.post("/:id/verify-payment", isLoggedIn, async (req, res) => {
    const { razorpay_payment_id } = req.body;

    const listing = await Listing.findById(req.params.id);

    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        price: listing.price * 1.18,
        status: "paid",
        paymentId: razorpay_payment_id
    });

    await booking.save();

    res.json({ success: true });
});


//if payment cancel cod

router.post("/:id/cod", isLoggedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    const data = req.session.bookingData;

    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        guests: Number(data.guests),
        price: listing.price,
        status: "pending"
    });

    if (!req.session.bookingData) {
    return res.status(400).send("Booking data missing");
}

    await booking.save();

    res.json({ success: true });
});


router.get("/cod-success", isLoggedIn, (req, res) => {
    res.render("bookings/cod-success.ejs");
});

module.exports = router;
