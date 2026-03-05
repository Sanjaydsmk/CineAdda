import express from "express";
import { confirmBookingAfterPaymentReturn, createBooking, getOccupiedSeats } from "../controller/bookingController.js";
import { requireAuth } from "@clerk/express";

const bookingRouter =express.Router();


bookingRouter.post('/create',requireAuth(),createBooking)
bookingRouter.post('/confirm-payment',requireAuth(),confirmBookingAfterPaymentReturn)
bookingRouter.get('/seats/:showId',getOccupiedSeats)

export default bookingRouter;
