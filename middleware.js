const Listing = require("./models/listing");

const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError=require("./utils/ExpressError.js");

const Review = require("./models/review");



module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        //redirect url save
         // ONLY save redirect URL for GET requests
        if (req.method === "GET") {
            req.session.redirectUrl = req.originalUrl;
        }




        req.flash("error","You must be logged in to add a listing!");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
      
    }
    next();
}


module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You're not owner of this listing!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}


//validation for schema(middleware)
module.exports.validateListing=(req,res,next)=>{

      let {error}= listingSchema.validate(req.body);


       if(error){
        let errMsg=error.details.map(el=>el.message).join(","); 
       throw new ExpressError(400,errMsg);
   }else{
       next();
   }
};


module.exports.validateReview=(req,res,next)=>{

      let {error}= reviewSchema.validate(req.body);


       if(error){
        let errMsg=error.details.map(el=>el.message).join(","); 
       throw new ExpressError(400,errMsg);
   }else{
       next();
   }
};



module.exports.isreviewAuthor = async (req, res, next) => {
    const {id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You're not author of this review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}


module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
        req.flash("error", "Access Denied!");
        return res.redirect("/listings");
    }
    next();
};