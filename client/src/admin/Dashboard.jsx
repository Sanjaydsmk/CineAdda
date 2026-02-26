import React from 'react';
import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, StarIcon, UserIcon } from 'lucide-react';
import BlurCircle from '../components/BlurCircle';
import Title from '../components/admin/title';
import dateFormat from '../lib/dateFormat';
import { dummyDashboardData } from '../assets/assets';

const dashboardData = dummyDashboardData;

const Dashboard = () => {
  const currency = '$';

  const dashboardCards = [
    {
      title: 'Total Bookings',
      value: dashboardData.totalBookings,
      icon: ChartLineIcon,
    },
    {
      title: 'Total Revenue',
      value: `${currency}${dashboardData.totalRevenue}`,
      icon: CircleDollarSignIcon,
    },
    {
      title: 'Active Shows',
      value: dashboardData.activeShows.length,
      icon: PlayCircleIcon,
    },
    {
      title: 'Total Users',
      value: dashboardData.totalUser,
      icon: UserIcon,
    },
  ];

  return (
    <>
      <Title text1="Admin" text2="Dashboard" />

      <div className="relative mt-6">
        <BlurCircle top="-100px" left="0" />
        <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => (
            <div
              key={card.title}
              className="flex w-full items-center justify-between rounded-md border border-primary/20 bg-primary/10 px-4 py-3"
            >
              <div>
                <h1 className="text-sm">{card.title}</h1>
                <p className="text-xl font-medium flex mt-1">{card.value}</p>
              </div>
              <card.icon className="w-6 h-6" />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-lg font-medium">Active Shows</p>
      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="100px" left="-10%" />
        {dashboardData.activeShows.map((show) => (
          <div
            key={show._id}
            className="w-55 rounded-lg overflow-hidden h-full pb-3 bg-primary/10 border border-primary/20 hover:-translate-y-1 transition duration-300"
          >
            <img src={show.movie.poster_path} alt={show.movie.title} className="w-full h-60 object-cover" />
            <p className="font-medium p-2 truncate">{show.movie.title}</p>
            <div className="flex items-center justify-between px-2">
              <p className="text-lg font-medium">
                {currency}
                {show.showPrice}
              </p>
              <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                <StarIcon className="w-4 h-4 text-primary fill-primary" />
                {show.movie.vote_average.toFixed(1)}
              </p>
            </div>
            <p className="px-2 pt-2 text-sm text-gray-500">{dateFormat(show.showDateTime)}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default Dashboard;
