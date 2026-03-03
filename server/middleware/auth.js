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

    const shouldBypassInDev =
      process.env.NODE_ENV !== "production" &&
      process.env.ADMIN_BYPASS !== "false";

    if (shouldBypassInDev) {
      return next();
    }

    const user = await clerkClient.users.getUser(userId);
    const userRole = user?.publicMetadata?.role || user?.privateMetadata?.role;
    const userEmails = (user?.emailAddresses || [])
      .map((entry) => entry?.emailAddress?.toLowerCase().trim())
      .filter(Boolean);
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.replace(/^['"]|['"]$/g, "").trim().toLowerCase())
      .filter(Boolean);
    const isAdminByEmail = userEmails.some((email) => adminEmails.includes(email));

    if (userRole !== "admin" && !isAdminByEmail) {
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
