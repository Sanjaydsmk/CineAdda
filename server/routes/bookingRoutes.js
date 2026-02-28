import express from "express";
import { createBooking, getOccupiedSeats } from "../controller/bookingController.js";
import { protectAdmin } from "../middleware/auth.js";

const bookingRouter =express.Router();


bookingRouter.post('/create',protectAdmin,createBooking)
bookingRouter.get('/seats/:showId',protectAdmin,getOccupiedSeats)

export default bookingRouter;
