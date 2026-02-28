import React, { useEffect, useState } from 'react';
import Title from '../components/admin/title';
import Loading from '../components/Loading';
import dateFormat from '../lib/dateFormat';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';

const ListShows = () => {
  const { axios, getToken, user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [shows, setShows] = useState([]);

  const currency = '$';
   const getAllShows = async () => {
    try {
      const { data } = await axios.get('/api/admin/all-shows', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setShows(data.shows || []);
      } else {
        toast.error(data.message || 'Failed to load shows');
      }
    } catch (err) {
      console.log(err);
      toast.error('Failed to load shows');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      getAllShows();
    } else {
      setLoading(false);
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="List" text2="Shows" />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-3 font-medium pl-5">Movie Name</th>
              <th className="p-3 font-medium">Show Time</th>
              <th className="p-3 font-medium">Total Bookings</th>
              <th className="p-3 font-medium">Earnings</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {shows.map((show, index) => (
              <tr key={index} className="border-b border-primary/10 bg-primary/5">
                <td className="p-3 min-w-45 pl-5">{show.movie.title}</td>
                <td className="p-3">{dateFormat(show.showDateTime)}</td>
                <td className="p-3">{Object.keys(show.occupiedSeats).length}</td>
                <td className="p-3">
                  {currency} {Object.keys(show.occupiedSeats).length * show.showPrice}
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

export default ListShows;
