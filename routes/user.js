const express=require("express");
const router = express.Router({ mergeParams: true });
const User=require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport=require("passport");
const { saveRedirectUrl } = require("../middleware.js");

const user = require("../models/user.js");

const userController=require("../controllers/users.js");


router
.route("/signup")
.get(userController.renderSignupForm)
.post( userController.signup);


// router.get("/signup",userController.renderSignupForm);  
// router.post("/signup", userController.signup);



router
.route("/login")
.get(userController.renderLoginForm)
.post(saveRedirectUrl,
    passport.authenticate('local', { failureRedirect: '/login' ,
     failureFlash: true 
    }),
    wrapAsync(userController.login)
);


router.get("/logout",userController.logout);

// router.get("/login",userController.renderLoginForm);
// router.post("/login",
//     saveRedirectUrl,
//     passport.authenticate('local', { failureRedirect: '/login' ,
//      failureFlash: true 
//     }),
//     wrapAsync(userController.login)
// );














module.exports=router;