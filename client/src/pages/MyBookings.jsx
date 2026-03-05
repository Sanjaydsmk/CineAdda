import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import BlurCircle from '../components/BlurCircle';
import timeFormat from '../lib/timeFormat';
import dateFormat from '../lib/dateFormat';
import { useAppContext } from '../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyBookings = () => {

const currency = import.meta.env.VITE_CURRENCY || '$';
const {
    
    axios,
    getToken,
    user,
    image_base_url,
  } = useAppContext();
const location = useLocation();
const navigate = useNavigate();
const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMyBookings = async () => {
    try{
      const {data}=await axios.get('/api/user/bookings',{
        headers:{Authorization:`Bearer ${await getToken()}`}
      });
      if(data.success){
        setBookings(data.bookings);
      }

    }
    catch(err){
        console.log(err);
    } finally{
        setIsLoading(false);
    }
  };
  useEffect(() => {
    if(user){
      getMyBookings();
    }
  }, [user]);

  useEffect(() => {
    const syncPaymentReturn = async () => {
      if (!user) return;

      const params = new URLSearchParams(location.search);
      const payment = params.get('payment');
      const bookingId = params.get('bookingId');

      if (payment !== 'success' || !bookingId) return;

      try {
        const { data } = await axios.post(
          '/api/booking/confirm-payment',
          { bookingId },
          { headers: { Authorization: `Bearer ${await getToken()}` } }
        );
        if (data.success) {
          toast.success('Payment confirmed');
          getMyBookings();
        }
      } catch (err) {
        console.error(err);
      } finally {
        params.delete('payment');
        params.delete('bookingId');
        navigate(`/my-bookings${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
      }
    };

    syncPaymentReturn();
  }, [user, location.search]);

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <div>
        <BlurCircle bottom="0px" left="600px" />
      </div>
      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>
      {bookings.map((item, index) => (
        <div
          key={index}
          className="flex flex-col md:flex-row md:justify-between border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
        >
          <div className="flex flex-col md:flex-row">
            <img
              src={image_base_url+item.show.movie.poster_path}
              alt={item.show.movie.title}
              className="md:max-w-45 h-auto aspect-video rounded object-bottom object-cover"
            />
            <div className="flex flex-col p-4">
              <p className="text-lg font-semibold">{item.show.movie.title}</p>
              <p className="text-gray-400 text-sm">
                {timeFormat(item.show.movie.runtime)}
              </p>
              <p className="text-gray-400 text-sm mt-auto">
                {dateFormat(item.show.showDateTime)}
              </p>
            </div>
          </div>

        <div className="flex flex-col md:items-end md:text-right justify-between p-4">
            <div className="flex items-center gap-4">
              <p className="text-2xl font-semibold mb-3">
                {currency}
                {item.amount}
              </p>
              {!item.isPaid && (
                <button
                  className='bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={!item.paymentLink}
                  onClick={() => item.paymentLink && (window.location.href = item.paymentLink)}
                >
                  {item.paymentLink ? 'Pay Now' : 'Payment Link Pending'}
                </button>
              )}
              </div>
              
              <div className="text-sm">
              <p>
                <span className="text-gray-400">Total Tickets:</span>
                {item.bookedSeats.length}
              </p>
              <p>
                <span className="text-gray-400">Seat Number:</span>
                {item.bookedSeats.join(', ')}
              </p>
            </div>
            </div>
          </div>
      ))}
    </div>
  ):(
    <Loading/>
  )
}
export default MyBookings;
