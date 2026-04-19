const express=require("express");
const router=express.Router();

const wrapAsync=require("../utils/wrapAsync.js");


const Listing=require("../models/listing.js");


const {isLoggedIn,isOwner,validateListing}=require("../middleware.js");


const listingController=require("../controllers/listing.js");

const multer  = require('multer')

const { storage } = require('../cloudConfig.js')
const upload = multer({ storage }) 


const Booking = require("../models/booking.js");


// //index route & create route
router
.route("/")
.get(wrapAsync(listingController.index))
.post(isLoggedIn,
    validateListing,
    upload.single('listing[image]'),
    wrapAsync(listingController.create)
)


//new route
router.get("/new",
    isLoggedIn,
    wrapAsync(listingController.new)
);




//show route & update route & delete route
router
.route("/:id")
.get(wrapAsync(listingController.show))
.put(isLoggedIn,
    isOwner,
    upload.single('image'),
    validateListing,
    wrapAsync(listingController.update)
)
.delete(isLoggedIn,
    isOwner,
    wrapAsync(listingController.delete)
);




//edit route

router.get("/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.edit)
);


//book route
router.get("/:id/book",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const listing = await Listing.findById(req.params.id);
        res.render("bookings/book.ejs", { listing });
    })
);

router.post("/:id/book",
    isLoggedIn,
    wrapAsync(async (req, res) => {

        if (!req.isAuthenticated()) {
            return res.redirect("/login");
        }

        console.log("USER:", req.user);
        console.log("BODY:", req.body);

        const newBooking = new Booking({
            listing: req.params.id,
            user: req.user._id,
            checkIn: req.body.checkIn,
            checkOut: req.body.checkOut,
            guests: Number(req.body.guests)
        });

        await newBooking.save();

       res.redirect(`/bookings/${newBooking._id}/confirmation`);
    })
);



// //index route
// router.get("/",wrapAsync(listingController.index)
// );




//show route 
// router.get("/:id",wrapAsync(listingController.show));



//create route
// router.post("/",
//     isLoggedIn,
//     validateListing,
//     wrapAsync(listingController.create)
// );



//update route
// router.put("/:id",
//     isLoggedIn,
//     isOwner,
//     validateListing,
//     wrapAsync(listingController.update)
// );


//delete route
// router.delete("/:id",
//     isLoggedIn,
//     isOwner,
//     wrapAsync(listingController.delete)
// );



module.exports=router;












