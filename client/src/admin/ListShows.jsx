import React from 'react';
import Title from '../components/admin/title';
import Loading from '../components/Loading';
import { dummyDashboardData } from '../assets/assets';
import dateFormat from '../lib/dateFormat';

const ListShows = () => {
  const [loading] = React.useState(false);
  const shows = dummyDashboardData.activeShows.slice(0, 1);
  const currency = '$';

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
