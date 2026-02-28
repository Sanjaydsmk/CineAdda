import React, { useEffect, useState } from 'react';
import Title from '../components/admin/title';
import Loading from '../components/Loading';
import dateFormat from '../lib/dateFormat';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';

const ListBookings = () => {
  const { axios, getToken, user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const currency = '$';
  const getAllBookings = async () => {
    try {
      const { data } = await axios.get('/api/admin/all-bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        toast.error(data.message || 'Failed to load bookings');
      }
    } catch (err) {
      console.log(err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      getAllBookings();
    } else {
      setLoading(false);
    }
  }, [user]);
  return !loading ? (
    <>
      <Title text1="List" text2="Bookings" />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-3 pl-5 font-medium">User Name</th>
              <th className="p-3 font-medium">Movie Name</th>
              <th className="p-3 font-medium">Show Time</th>
              <th className="p-3 font-medium">Seats</th>
              <th className="p-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
  {bookings.map((item, index) => (
    <tr
      key={index}
      className="border-b border-primary/20 bg-primary/5 even:bg-primary/10"
    >
      <td className="p-2 min-w-45 pl-5">{item.user.name}</td>
      <td className="p-2">{item.show.movie.title}</td>
      <td className="p-2">
        {dateFormat(item.show.showDateTime)}
      </td>
      <td className="p-2">
        {item.bookedSeats.join(', ')}
      </td>
      <td className="p-2">
        {currency} {item.amount}
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default ListBookings;
