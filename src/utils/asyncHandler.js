// asyncHandler is a higher-order function that takes a request handler function as an argument
const asyncHandler = (requestHandler) => {
    // Returns a new function that Express will use as the middleware
    return (req, res, next) => {
        // Calls the request handler function and resolves any returned promise
        // If the promise is rejected (an error occurs), catch the error
        // and pass it to the 'next' function to handle in Express
        Promise.resolve(requestHandler(req, res, next)).catch((err) => {
            next(err); // Passes any error to the next middleware (error handler)
        });
    };
};

// Exports the asyncHandler function for use in other files
export { asyncHandler };


// const asyncHandler =(func)=>{async(req,res,next)=>{
//     try{
//         await func(req,res,next)

//     }catch(error){
//         res.status(err.code||500).json()({
//             success:false,
//             message:err.message
//         })
//     }
// }

// }