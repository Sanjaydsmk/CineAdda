import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowRightIcon, ClockIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import isoTimeFormat from '../lib/isoTimeFormat';
import { assets } from '../assets/assets';
import BlurCircle from '../components/BlurCircle';

const SeatLayout = () => {

  const groupRows = [
    ['A', 'B'],
    ['C', 'D'],
    ['E', 'F'],
    ['G', 'H'],
    ['I', 'J'],
  ]; 

  const { id, date } = useParams();
  const navigate = useNavigate();

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats,setOccupiedSeats]=useState([])

  const { axios, getToken, user } = useAppContext();

  const getShow = async () => {
    try {
      const token = user ? await getToken() : null;
      const { data } = await axios.get(`/api/shows/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (data.success) {
        setShow(data);
      } else {
        setShow(null);
      }
    } catch (err) {
      console.log(err);
      setShow(null);
    }
  };
  const handleSeatClick = (seatId) => {
  if (!selectedTime) {
    return toast("Please select time first")
  }

  if (!selectedSeats.includes(seatId) && selectedSeats.length > 9) {
    return toast("You can only select 10 seats")
  }
  if(occupiedSeats.includes(seatId)){
    return toast("This seat is already booked")
  }

  setSelectedSeats(prev =>
    prev.includes(seatId)
      ? prev.filter(seat => seat !== seatId)
      : [...prev, seatId]
  )
}
const renderSeats = (row, count = 9) => (
  <div key={row} className="flex gap-2 mt-2">
   <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }, (_, i) => {
        const seatId = `${row}${i + 1}`;
        return (
          <button
            key={seatId}
            onClick={() => handleSeatClick(seatId)}
            className={`h-8 w-8 rounded border border-primary/60 cursor-pointer
            ${selectedSeats.includes(seatId) && "bg-primary text-white"}
            ${occupiedSeats.includes(seatId) && "opacity-50"}`}
          >
            {seatId}
          </button>
        );
      })}
    </div>
  </div>
);

// const bookTickets = () => {
//   if (!selectedTime) {
//     return toast('Please select a timing first');
//   }

//   if (selectedSeats.length === 0) {
//     return toast('Please select at least 1 seat');
//   }

//   toast.success(`Selected ${selectedSeats.length} seat(s)`);
//   navigate('/my-bookings');
//   scrollTo(0, 0);
// };

const getOccupiedSeats=async()=>{
  try{
    const {data}=await axios.get(`/api/booking/seats/${selectedTime.showId}`)
    if(data.success){
      const seatMap = data.occupiedSeats || {};
      setOccupiedSeats(Array.isArray(seatMap) ? seatMap : Object.keys(seatMap))
    }else{
      toast.error(data.message)
    }
  }catch(error){
    console.log(error)
  }
}
const bookTickets = async () => {
  try {
    if (!user) return toast.error("Please login to proceed");

    if (!selectedTime || !selectedSeats.length)
      return toast.error("Please select time and seats");

    const { data } = await axios.post(
      "/api/booking/create",
      {
        showId: selectedTime.showId,
        selectedSeats,
      },
      {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      }
    );

    const paymentUrl = data?.url || data?.paymentLink;
    if (data.success && paymentUrl) {
     window.location.href = paymentUrl;
    } else if (data.success) {
      // Fallback: fetch latest booking and try stored payment link.
      const bookingsRes = await axios.get('/api/user/bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      const latestBooking = bookingsRes?.data?.bookings?.[0];
      const fallbackPaymentUrl = latestBooking?.paymentLink;

      if (fallbackPaymentUrl) {
        window.location.href = fallbackPaymentUrl;
        return;
      }

      console.error("Booking response missing payment URL:", data);
      toast.error(`Checkout created but payment URL missing. ${data?.message ? `API: ${data.message}` : ''}`);
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || error.message);
  }
};

  useEffect(() => {
    if (id) getShow();
  }, [id, user]);

  useEffect(()=>{
    if(selectedTime){
      getOccupiedSeats();
      setSelectedSeats([]);
     }

  },[selectedTime])
  if (!show) return <Loading />;

  const timings = show?.dateTime?.[date] || [];

  return (
    <div className="flex flex-col md:flex-row items-start gap-8 px-3 md:pl-2 md:pr-16 lg:pr-24 py-30 md:pt-50">
      <div className="w-60 md:w-64 bg-primary/10 rounded-lg h-max border border-primary/20 py-10 md:sticky md:top-20 md:shrink-0 md:self-start md:ml-0">
        <p className="text-lg font-semibold px-6">Available Timings</p>

        <div className="mt-5 space-y-1">
          {timings.map((item) => (
            <div
              key={item.showId}
              onClick={() => setSelectedTime(item)}
              className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition ${
                selectedTime?.time === item.time
                  ? 'bg-primary text-white'
                  : 'hover:bg-primary/20'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
             <p className="text-sm">{isoTimeFormat  (item.time)}</p>
            </div>
          ))}
        </div>
      </div>
{/* Seating Layout */}
      <div className="relative flex-1 flex flex-col items-center max-md:mt-16 max-w-5xl">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0" />
        <h1 className="text-2xl font-semibold mb-4">Select your seat</h1>
        <img src={assets.screenImage} alt="screen" />
        <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>
        <div className="flex flex-col items-center mt-10 text-xs text-gray-300 gap-12">

  {/* A & B centered */}
  <div className="flex flex-col items-center gap-4">
    {groupRows[0].map((row) => renderSeats(row))}
  </div>

  {/* Remaining rows in left-right blocks */}
  <div className="grid grid-cols-2 gap-16">
    {groupRows.slice(1).map((group, idx) => (
      <div key={idx} className="flex flex-col items-center gap-4">
        {group.map((row) => renderSeats(row))}
      </div>
    ))}
  </div>

</div>

<button
          className="flex items-center gap-1 mt-20 px-10 py-3 text-sm
             bg-primary hover:bg-primary-dull transition
             rounded-full font-medium cursor-pointer
             active:scale-95"
          onClick={bookTickets}
        >
          Proceed to Checkout
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>

         </div>
    </div>
  );
};

export default SeatLayout;
