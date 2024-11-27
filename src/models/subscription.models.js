import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,//one who is suscribing
        // required:true,
        ref:"User"

    },
    channel:{
        type:Schema.Types.ObjectId,
        //one to whom is subscriber is subscribed
        ref:"User  "
    }
},{
    timestamps:true
})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)