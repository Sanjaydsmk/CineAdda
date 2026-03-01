import Booking from "../models/Bookings.js";
import Show from "../models/Show.js";
import stripe from 'stripe';

//func to check availability of selected seats
const checkSeatsAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId)
        if (!showData) return false

        const OccupiedSeats = showData.occupiedSeats

        const isAnySeatOccupied = selectedSeats.some(seat => OccupiedSeats[seat])

        return !isAnySeatOccupied;


    }
    catch (error) {
        console.error("Error checking seat availability:", error);
        throw error;
        

    }
}
export const createBooking = async (req, res) => {
    try{
        const { userId } = req.auth();
        const { showId, selectedSeats: bodySelectedSeats, seats } = req.body;
        const selectedSeats = bodySelectedSeats || seats || [];
        const {origin}=req.headers;
        const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            return res.status(400).json({ success: false, message: "showId and seats are required" });
        }
        if (!stripeSecret) {
            return res.status(500).json({ success: false, message: "Stripe is not configured on server" });
        }

        //check if seats are available
        const isAvailable=await checkSeatsAvailability(showId,selectedSeats);
        if(!isAvailable){
            return res.json({success:false, message:'Selected seats are already booked'})
        }
        //get shows details

        const showData=await Show.findById(showId).populate('movie');

        //create booking in db

        const booking= await Booking.create({
            user:userId,
            show:showId,
            amount:showData.showPrice*selectedSeats.length,
            bookedSeats:selectedSeats,
        })
        selectedSeats.map((seat)=>{
            showData.occupiedSeats[seat]=userId;
        })

        showData.markModified('occupiedSeats');
        await showData.save();

        //stripe gateway
        const stripeInstance=new stripe(stripeSecret)

        //creating line items to for stripe
        const line_items=[{
            price_data:{
                currency:'usd',
                product_data:{
                    name:showData.movie.title
                },
                unit_amount:Math.floor(booking.amount)*100
            },
            quantity:1
        }]
        const session=await stripeInstance.checkout.sessions.create({
            success_url:`${origin}/my-bookings?payment=success`,
            cancel_url:`${origin}/my-bookings`,
            line_items:line_items,
            mode:'payment',
            metadata:{
                bookingId:booking._id.toString()
            },
            expires_at:Math.floor(Date.now()/1000)+30*60,
        })
        const checkoutUrl = session.url || null;
        booking.paymentLink = checkoutUrl;
        await booking.save()

        if (!checkoutUrl) {
            return res.status(500).json({
                success: false,
                message: "Stripe checkout URL was not generated",
                sessionId: session.id,
            });
        }

        res.json({
            success: true,
            url: checkoutUrl,
            paymentLink: checkoutUrl,
            sessionId: session.id,
        })
          

    }catch(error){

        console.error("Error creating booking:", error);
        res.json({success:false, message:error.message})

    }
}


export const getOccupiedSeats=async(req,res)=>{
    try{

        const {showId}=req.params;
        const showData=await Show.findById(showId);

        const occupiedSeats=showData.occupiedSeats;
        
        res.json({success:true, occupiedSeats })

    }
    catch(error){
         console.error("Error getting occupied seats:", error);
        res.json({success:false, message:error.message});
    }
}
