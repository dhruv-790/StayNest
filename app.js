if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const ExpressError = require("./utils/ExpressError.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");
const bookingRoutes = require("./routes/booking");
const adminRoutes = require("./routes/admin");



app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));



const dbUrl = process.env.ATLASDB_URL;

if (!process.env.SECRET) {
    throw new Error("SECRET is missing ❌");
}

if (!dbUrl) {
    throw new Error("ATLASDB_URL is missing ❌");
}



app.use((req, res, next) => {
    res.locals.mapToken = process.env.MAP_TOKEN;
    next();
});


app.get("/", (req, res) => {
    res.redirect("/listings");
});


const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        //. Connect DB FIRST
        await mongoose.connect(dbUrl);
        console.log(" DB Connected");

       
   const store = MongoStore.create({
    client: mongoose.connection.getClient(),  
    dbName: "staynest",
    collectionName: "sessions",
    crypto: {
        secret: process.env.SECRET,
    },
});

        store.on("error", (e) => {
            console.error("SESSION STORE ERROR:", e);
        });

        // . Session middleware
        app.set("trust proxy", 1);

        app.use(session({
          store: store,
            secret: process.env.SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                maxAge: 7 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            }
        }));

        // Passport AFTER session
        app.use(flash());
        app.use(passport.initialize());
        app.use(passport.session());

        passport.use(new LocalStrategy(User.authenticate()));
        passport.serializeUser(User.serializeUser());
        passport.deserializeUser(User.deserializeUser());

        //  Flash + locals
        app.use((req, res, next) => {
            res.locals.success = req.flash("success");
            res.locals.error = req.flash("error");
            res.locals.currUser = req.user || null;
            next();
        });

        //  MAIN ROUTES

        app.use("/bookings", bookingRoutes);
        app.use("/admin", adminRoutes);
        app.use("/listings", listingRouter);
        app.use("/listings/:id/reviews", reviewRouter);
        app.use("/", userRouter);

        

        app.use((req, res, next) => {
            next(new ExpressError(404, "Page not found babyy"));
        });



        app.use((err, req, res, next) => {
            let { statusCode = 500, message = "Something went wrong!" } = err;

            if (res.headersSent) {
                return next(err);
            }

            res.status(statusCode).render("error.ejs", { message });
        });

        
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });

    } catch (err) {
        console.log(" DB Error:", err);
    }
}

startServer();