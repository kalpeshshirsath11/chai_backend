// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";
////please handle databses in try catches
// async await

// importing approach
dotenv.config({
    path:'./env'
})


connectDB()







/*
import express from "express"
const app = express()

;(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.log("ERROR",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`APP is listening on port ${process.env.PORT}`)
        })
    }catch(error){
        console.log(error);
        throw error

    }

})()
//thhis is good approach but index got polluted

*/