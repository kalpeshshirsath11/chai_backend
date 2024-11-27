import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { upload } from "../middlewares/multer.middleware.js";
import jwt from "jsonwebtoken"
import { uploadOnCloudinary } from "../utils/cloudinary.js";



const generateAccessAndRefreshTokens = async(userId) =>{
    try{
        const user = await  User.findById(userId)
        const accessToken = user.generateAccessToken() 
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500,"smoething went wrong while generating refresh and acces token")
    }
}







const registerUser = asyncHandler(async (req, res) => {
    //get users details from frontend
    //validations
    //check if user already exist:username email
    //check for images,check for avatar
    //upload them to cloudnery,avtar
    //create user object- create entry in db
    //remove password and refresh token fields
    //check for response 
    //return response

    const { fullName, email, userName, password } = req.body;
    if ([fullName, email, userName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "all fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "user with email or username already exists");
    }


    console.log(req.files)
    const avatarLocalpath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;;
    if(req.files && Array.isArray(req.files.coverImageLocalPath) && req.files.coverImage[0].path){
         coverImageLocalPath = req.files.coverImage[0].path;
    }
    

    if (!avatarLocalpath) {
        throw new ApiError(400, "avatar file is required");
    }
   
    
    const avatar = await uploadOnCloudinary(avatarLocalpath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "avatar file is required 2 ");
    }
    
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering user");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successsfully")
    )

});

const loginUser = asyncHandler(async(req,res)=>{
    //req body ->data
    //username or email
    //find the user
    //password check
    //access and refresh ntoken
    //send cookie

    const {email,userName,password} =  req.body;


    if(!userName && !email){
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or:[{userName},{email}]
    })
    if(!user){
        throw new ApiError(404,"user does not exist");
    }

    const isPasswordValid =  await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"invalid user credentials")
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);
    
    const loggedInUser  = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.
    status(200).
    cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "User loggedinsuccessfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken:undefined
            }
        },{
            new:true
        }
        
    )
    const options = {
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

   try{
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
       const decodedToken =  jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invlaid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired")
        }
        const options={
            httpOnly:true,
            secure:true
        }
    
       const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id); 
    
       return res.status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",refreshToken,options)
       .json(
        new ApiResponse(
            200,{accessToken,refreshToken:newRefreshToken,},"access token refreshed succesfully"
        )
       )
   }
   catch(error){
    throw new ApiError(401,error?.message||"invalid refresh token");

   }


})
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword,confPassword} =  req.body
    if(newPassword !== confPassword){
        throw new ApiError(401,"password not matching")
    }
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Entered password is not correct")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))
})



const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"account details updated"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalpath =  req.file?.path
   if(!avatarLocalpath){
    throw new ApiError(400,"Avatar  file is missing")
   }

   const  avatar =  await uploadOnCloudinary(avatarLocalpath);
   if(!avatar.url){
    throw new ApiError(400,"error while uploading on avtar");

   }
//    this.avatar.url = 
    await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")
})
const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalpath =  req.file?.path
    if(!coverImageLocalpath){
     throw new ApiError(400,"Avatar  file is missing")
    }
 
    const  coverImage =  await uploadOnCloudinary(coverImageLocalpath);
    if(!coverImage.url){
     throw new ApiError(400,"error while uploading on avtar");
 
    }
 //    this.avatar.url = 
     await User.findByIdAndUpdate(req.user?._id,
         {
             $set:{
                coverImage:coverImage.url
             }
         },
         {new:true}
     ).select("-password")
 })

export { registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar };
