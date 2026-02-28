import { clerkClient } from "@clerk/express";
import Booking from "../models/Bookings.js";
import Movie from "../models/Movie.js";
import connectDB from "../configs/db.js";

// API Controller Functions to Get User Bookings
export const getUserBookings = async (req, res) => {
    try
    {
      await connectDB();

        const {userId}=req.auth();
        const bookings=await Booking.find({user:userId}).populate({
            path:'show',
            populate:{ 
                path:'movie'
            }
        }).sort({createdAt:-1});
        res.json({ success: true, bookings})
    }
    catch (err) {
        console.error("Get User Bookings Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// API Controller Function to Update Favorite Movie in Clerk User Metadata
export const updateFavoriteMovie = async (req, res) => {
  try {
    await connectDB();
    const { userId } = req.auth();
    const { movieId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const user = await clerkClient.users.getUser(userId);

    let favorites = user.privateMetadata?.favorites || [];

    // Toggle logic
    if (favorites.includes(movieId)) {
      favorites = favorites.filter(id => id !== movieId);
    } else {
      favorites.push(movieId);
    }

    await clerkClient.users.updateUser(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        favorites
      }
    });

    res.json({
      success: true,
      message: "Favorites updated successfully"
    });

  } catch (err) {
    console.error("Update Favorite Movie Error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// API Controller Function to Get Favorite Movies from Clerk User Metadata
export const getFavoriteMovies = async (req, res) => {
  try {
    await connectDB();
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const user = await clerkClient.users.getUser(userId);

    const favorites = user.privateMetadata?.favorites || [];

    if (!favorites.length) {
      return res.json({
        success: true,
        favoriteMovies: []
      });
    }

    const movies = await Movie.find({
      _id: { $in: favorites }
    });

    res.json({
      success: true,
      favoriteMovies: movies
    });

  } catch (err) {
    console.error("Get Favorite Movies Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
