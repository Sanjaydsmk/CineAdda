import express from "express";
import { createBooking, getOccupiedSeats } from "../controller/bookingController.js";
import { requireAuth } from "@clerk/express";

const bookingRouter =express.Router();


bookingRouter.post('/create',requireAuth(),createBooking)
bookingRouter.get('/seats/:showId',getOccupiedSeats)

export default bookingRouter;
