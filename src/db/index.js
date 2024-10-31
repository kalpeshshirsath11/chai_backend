import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB = async()=>{
    try{
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       console.log(`\n MongoDb connect !! DB HOST:${connectionInstance.connection.host}`)//read this in console
    }
    catch(error){
        console.log("MONGODB CONNECTION ERROR",error);
        process.exit(1)
    }
}

export default connectDB