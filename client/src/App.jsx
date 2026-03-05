import React from 'react';
import Navbar from './components/Navbar';
import { Route, Routes,useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import MyBookings from './pages/MyBookings';
import Favourite from './pages/Favourite';
import Moodify from './pages/Moodify';
import MLLab from './pages/MLLab';
import { Toaster} from 'react-hot-toast';
import Footer from './components/Footer';
import Layout from './admin/Layout';
import Dashboard from './admin/Dashboard';
import AddShows from './admin/AddShows';
import ListShows from './admin/ListShows';
import ListBookings from './admin/ListBookings';
import { useAppContext } from './context/AppContext';
import { SignIn, useClerk } from '@clerk/clerk-react';
import Loading from './components/Loading';
const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith('/admin');
  const { signOut } = useClerk();

  const { user, isAdmin }=useAppContext()
  const switchToAdminAccount = async () => {
    await signOut();
    window.location.href = '/admin';
  };
  const adminElement = !user ? (
    <div className="min-h-screen flex justify-center items-center">
      <SignIn fallbackRedirectUrl={'/admin'} />
    </div>
  ) : isAdmin === null ? (
    <div className="min-h-screen flex justify-center items-center">
      <Loading />
    </div>
  ) : isAdmin === false ? (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-lg font-medium">This account is not an admin account.</p>
      <button
        onClick={switchToAdminAccount}
        className="bg-primary px-5 py-2 rounded-full text-sm font-medium cursor-pointer"
      >
        Sign out and login as admin
      </button>
    </div>
  ) : (
    <Layout />
  );
  return (
    <>
    <Toaster/>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/movies' element={<Movies />} />
        <Route path='/movie/:id' element={<MovieDetails />} />
        <Route path='/movies/:id' element={<MovieDetails />} />
        <Route path='/movie/:id/:date' element={<SeatLayout />} />
        <Route path='/movies/:id/:date' element={<SeatLayout />} />
        <Route path='/my-bookings' element={<MyBookings />} />
         <Route path='/loading/:nextUrl' element={<Loading />} />
        <Route path='/favourites' element={<Favourite />} />
        <Route path='/moodify' element={<Moodify />} />
        <Route path='/ml-lab' element={<MLLab />} />
        
        <Route path='/admin/*' element={adminElement} >
         <Route index element={<Dashboard />} />
          <Route path="add-shows" element={<AddShows />} />
          <Route path="list-shows" element={<ListShows />} />
          <Route path="list-bookings" element={<ListBookings />} />

    </Route>
         </Routes>
         {!isAdminRoute && <Footer />}
      
    </>
  );
}
export default App;
