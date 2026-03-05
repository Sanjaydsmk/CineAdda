import { clerkClient } from "@clerk/express";
import Booking from "../models/Bookings.js";
import User from "../models/User.js";
import connectDB from "../configs/db.js";
import sendEmail from "../configs/nodeMailer.js";

const getPrimaryEmail = (clerkUser) => {
  const primaryId = clerkUser?.primaryEmailAddressId;
  const emails = clerkUser?.emailAddresses || [];

  if (primaryId) {
    const primary = emails.find((entry) => entry?.id === primaryId);
    if (primary?.emailAddress) return primary.emailAddress;
  }

  return emails[0]?.emailAddress || null;
};

export const sendBookingConfirmationEmailById = async (bookingId) => {
  if (!bookingId) return;

  await connectDB();

  const booking = await Booking.findById(bookingId).populate({
    path: "show",
    populate: { path: "movie", model: "Movie", select: "title showDateTime" },
  });

  if (!booking) return;

  let clerkUser = null;
  let email = null;
  try {
    clerkUser = await clerkClient.users.getUser(booking.user);
    email = getPrimaryEmail(clerkUser);
  } catch (clerkError) {
    console.error("Failed to fetch Clerk user for booking email:", clerkError);
  }

  if (!email) {
    const appUser = await User.findById(booking.user).select("email name");
    email = appUser?.email || null;
  }

  if (!email) return;

  const name = clerkUser?.firstName || "User";
  const showTime = new Date(booking.show.showDateTime).toLocaleString("en-IN", {
    timeZone: process.env.SHOW_TIMEZONE || "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  await sendEmail({
    to: email,
    subject: `Booking Confirmed - ${booking.show.movie.title}`,
    body: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2>Booking Confirmed</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your tickets for <strong>${booking.show.movie.title}</strong> have been booked.</p>
        <p><strong>Show Time:</strong> ${showTime}</p>
        <p><strong>Seats:</strong> ${booking.bookedSeats.join(", ")}</p>
        <p><strong>Total Amount:</strong> $${booking.amount}</p>
        <p>Enjoy your movie.</p>
      </div>
    `,
  });
};
