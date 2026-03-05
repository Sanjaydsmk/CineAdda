import Stripe from 'stripe';
import Booking from '../models/Bookings.js';
import { sendBookingConfirmationEmailById } from '../utils/sendBookingConfirmationEmail.js';

const markBookingPaid = async (bookingId) => {
  if (!bookingId) return;

  await Booking.findByIdAndUpdate(bookingId, {
    isPaid: true,
    paymentLink: '',
  });

  try {
    await sendBookingConfirmationEmailById(bookingId);
  } catch (mailError) {
    console.error('Booking confirmation email failed:', mailError);
  }
};

export const stripeWebhook = async (req, res) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe Webhook Error:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session?.metadata?.bookingId;

        if (!bookingId) {
          console.log('No bookingId found in checkout.session.completed');
          break;
        }

        await markBookingPaid(bookingId);
        console.log('Payment updated from checkout.session.completed:', bookingId);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;

        const sessions = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessions.data[0];

        const bookingId = session?.metadata?.bookingId;

        if (!bookingId) {
          console.log('No bookingId found');
          break;
        }

        await markBookingPaid(bookingId);

        console.log('Payment updated:', bookingId);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe Webhook Processing Error:', err);
    return res.status(500).send(`Webhook Processing Error: ${err.message}`);
  }
};
