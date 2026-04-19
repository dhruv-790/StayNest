if(process.env.NODE_ENV!=="production"){
    require('dotenv').config();
}

// console.log(process.env.SECRET);

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const session=require("express-session");
const MongoStore = require("connect-mongo");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");
const Review=require("./models/review.js");
const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/reviews.js");
const userRouter=require("./routes/user.js");
const bookingRoutes = require("./routes/booking");
const adminRoutes = require("./routes/admin");

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

// const MONGO_URL="mongodb://localhost:27017/wanderlust";
const dbUrl=process.env.ATLASDB_URL;

if (!process.env.SECRET) {
    throw new Error("SECRET is missing ❌");
}

if (!dbUrl) {
    throw new Error("ATLASDB_URL is missing ❌");
}




// async function main (){
//     // await mongoose.connect(MONGO_URL);
//     await mongoose.connect(dbUrl);
// }

app.use((req,res,next)=>{
    res.locals.mapToken = process.env.MAP_TOKEN;
    next();
});

// app.get("/testListing",async(req,res)=>{
//     let sampleListings= new Listing({
//         title:"my new home",
//         description:"my new home description",
//         price:1000,
//         image:"https://unsplash.com/photos/view-of-a-mountain-lake-from-inside-a-vehicle--Y91Wmtb1Gc",
//         location:"New York",
//         country:"USA"
//     })
//     // await sampleListings.save();
//     // res.send("Listings added");
// });

const store = MongoStore.create({
    mongoUrl: dbUrl,
     dbName: "staynest",
    collectionName: "sessions",
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
});

const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false,

    cookie: {
    expires: new Date(Date.now() + 7*24*60*60*1000),
    maxAge: 7*24*60*60*1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "lax"
}
};

// const sessionOptions = {
//     secret: "mysupersecret",
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//         expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//         httpOnly: true,
//     }
// };

app.set("trust proxy", 1);
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//creating middleware(for flash)
app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser = req.user||null;

    next();
});


app.get("/", (req, res) => {
    res.redirect("/listings");
});


app.use("/bookings", bookingRoutes);
// app.get("/demoUser",async(req,res)=>{
//     let fakeUser=new User({email:"dhruv@example.com",username:"demoUser"});
//     let newuser=await User.register(fakeUser,"password123");
//     res.send(newuser);
//     console.log(newuser);
// })

app.use("/admin", adminRoutes);

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);

app.use("/",userRouter);

app.use((req,res,next)=>{
    next(new ExpressError(404,"Page not found babyy"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;

    if (res.headersSent) {
        return next(err);
    }

    return res.status(statusCode).render("error.ejs", { message });
});



const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await mongoose.connect(dbUrl);
        console.log(" DB Connected");

        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });

    } catch (err) {
        console.log(" DB Error:", err);
    }
}

startServer();