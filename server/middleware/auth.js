// import { clerkClient } from "@clerk/express";

// export const protectAdmin=async (req,res,next)=>{
//     try {
//         const {userId}=req.auth;

//         const user=await new ClerkClient().users.getUser(userId);
//         if(user.publicMetadata.role!=='admin'){ 
//             return res.json({success:false, message:'Access Denied'})
//         }
// next();

//     } catch (error) {
//         return res.json({success:false, message:'Authentication Failed'})
//     }
// }

import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
  try {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    const { userId } = auth || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const user = await clerkClient.users.getUser(userId);

    if (user.publicMetadata.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied"
      });
    }

    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication Failed"
    });
  }
};
