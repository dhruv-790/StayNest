const mongoose=require("mongoose"); 
const Schema=mongoose.Schema;
const Review=require("./review.js");

const listingSchema=new Schema({
    title:{type:String,required:true},
    description:{
        type:String,
        required:true},
    price:{
        type:Number,
        required:true},
 image:{
    filename:String,
    url:String,
},
    location:{type:String},
    country:{type:String},
    reviews:[{
        type:Schema.Types.ObjectId,
        ref:"Review", //model

    }],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },

    
    geometry: {
  type: {
    type: String,
    enum: ["Point"],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
},

category: {
  type: String,
  enum: [
    "Trending",
    "Rooms",
    "Iconic Cities",
    "Mountains",
    "Castles",
    "Amazing Pools",
    "Camping",
    "Farms",
    "Arctic",
    "Domes",
    "Boats"
  ],
  required: true,
  index: true
}
    
});

listingSchema.post("findOneAndDelete",async function(listing){
    if(listing.reviews.length){
        await Review.deleteMany({
            _id:{$in:listing.reviews}
        })
    }
})

const Listing=mongoose.model("Listing",listingSchema);
module.exports=Listing;