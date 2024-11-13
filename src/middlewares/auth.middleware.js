import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.models.js"


export const verifyJwt = asyncHandler(async(req,_,next)=>{
   try{
    const token = await ( req.cookies?.accessToken ||req.header("Authorization")?.replace("Bearer",""))

   if(!token){
        throw new ApiError(401,"unauthorized request ")
   }

   const decodedToken = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

   const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

   if(!user){
    //Todo : discuss about frontend
    throw new ApiError(401,"Invalid Access token")
   }
   req.user = user;
   next();
   }
   catch(error){
    throw new ApiError(401,error?.message || "invalid access token")
   }

})

