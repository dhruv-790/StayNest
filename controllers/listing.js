const Listing=require("../models/listing"); 



// module.exports.index=(async(req,res)=>{
//     let allListings=await Listing.find({});
//     res.render("listings/index.ejs",{allListings});
// });


module.exports.index = async (req, res) => {
  let filter = {};


  //categoryy
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // search
  if (req.query.q && req.query.q.trim() !== "") {
   filter.$or = [
  { title: { $regex: req.query.q, $options: "i" } },
  { location: { $regex: req.query.q, $options: "i" } }
   ];
  }

  const allListings = await Listing.find(filter);

  res.render("listings/index.ejs", {
    allListings,
    selectedCategory: req.query.category || null,
     q: req.query.q || ""
  });
};


module.exports.new=(async(req,res)=>{
   
    res.render("listings/new.ejs");
});


module.exports.show=(async(req,res)=>{
    let {id}=req.params;
    
    const listing=await Listing.findById(id)
    .populate({
            path:"reviews",
             populate:{path:"author"}})
    .populate("owner");

    if(!listing){
     req.flash("error","Listing not found!");
     return res.redirect("/listings");
    }
    // console.log(listing);   
    res.render("listings/show.ejs",{listing});


});


module.exports.create=(async(req,res)=>{
    let url=req.file.path;
    
   let filename=req.file.filename;

//    console.log(filename ,"   ",url);
 
     const newListing=new Listing(req.body.listing);
        newListing.owner=req.user._id;
        newListing.image={url,filename};



 // Get location from form
    const location = req.body.listing.location;

    // GEOAPIFY GEOCODING
    const geoRes = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${location}&apiKey=${process.env.MAP_TOKEN}`
    );

    const data = await geoRes.json();


    // Safety check
    if (!data.features.length  || data.features.length === 0) {
        req.flash("error", "Location not found!");
        return res.redirect("/listings/new");
    }

    const coordinates = data.features[0].geometry.coordinates;
    // console.log(coordinates);

    newListing.geometry = {
        type: "Point",
        coordinates: coordinates
    };


    await newListing.save();
    req.flash("success","New Listing added!");
    res.redirect("/listings");
    
  
  
});

module.exports.edit=(async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
     req.flash("error","Listing not found!");
     return res.redirect("/listings");
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
});


module.exports.update=(async(req,res)=>{
    
    let {id}=req.params;
    let listing= await Listing.findByIdAndUpdate(id,req.body.listing,{runValidators:true});

    if(typeof req.file!=="undefined" ){
        let url=req.file.path;
   let filename=req.file.filename;
    listing.image={url,filename};
    await listing.save();
}

    req.flash("success","Listing updated!");
    res.redirect(`/listings/${id}`);
});


module.exports.delete=(async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing deleted!");
    res.redirect("/listings");
});