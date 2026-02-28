import express from 'express';
import { requireAuth } from '@clerk/express';
import { getUserBookings,updateFavoriteMovie,getFavoriteMovies } from '../controller/userController.js';

const userRouter = express.Router();

userRouter.get('/bookings',requireAuth(),getUserBookings);
userRouter.post('/update-favorite',requireAuth(),updateFavoriteMovie);
userRouter.get('/favorites',requireAuth(),getFavoriteMovies);

export default userRouter;
