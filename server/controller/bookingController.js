import Booking from "../models/Bookings.js";
import Show from "../models/Show.js";

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
        const {userId}=req.auth;
        const{showId,selectedSeats}=req.body;
        const {origin}=req.headers;

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

        res.json({success:true, message:'Booking created successfully'})
          

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