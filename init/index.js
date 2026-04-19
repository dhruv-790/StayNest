const mongoose=require("mongoose");
const Listing=require("../models/listing.js");
const initData=require("./data.js");

const MONGO_URL="mongodb://localhost:27017/wanderlust";


main().then(()=>{
    console.log("Database connected");
}).catch((err)=>{
  console.log(err);
});


async function main (){
    await mongoose.connect(MONGO_URL);
    
}

const initDB=async()=>{
   await  Listing.deleteMany({});

   initData.data=initData.data.map((obj)=>({...obj,owner:'699bca13a29aec97032e2398'
   } ));

   await Listing.insertMany(initData.data);
   console.log("data was initialised");
}
// initDB();