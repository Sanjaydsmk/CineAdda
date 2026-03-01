import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [shows, setShows] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const image_base_url =
    import.meta.env.VITE_TMDB_IMAGE_BASE_URL ||
    "https://image.tmdb.org/t/p/w500";

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchIsAdmin = async () => {
    try {
      const { data } = await axios.get('/api/admin/is-admin', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setIsAdmin(data.isAdmin);
      if (!data.isAdmin && location.pathname.startsWith('/admin')) {
        navigate('/');
        toast.error('You are not authorized to access admin page');
      }
    } catch (err) {
      console.log(err);
      setIsAdmin(false);
    }
  };
  const fetchShows = async () => {
    try {
      const { data } = await axios.get('/api/shows/all');
      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.log(err);
    }
  };
  const fetchFavoriteMovies = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get('/api/user/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setFavoriteMovies(data.favoriteMovies);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.log('FULL ERROR:', err);
    }
  };

  const toggleFavorite = async (movieId) => {
    try {
      if (!user) {
        // guest: toggle in localStorage
        // lazy-import to avoid circular
        const { toggleFavoriteMovie } = await import('../lib/favorites');
        toggleFavoriteMovie(movieId);
        // trigger any listeners
        window.dispatchEvent(new Event('favorites-updated'));
        return { success: true, source: 'local' };
      }

      const token = await getToken();
      const { data } = await axios.post(
        '/api/user/update-favorite',
        { movieId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        await fetchFavoriteMovies();
        return { success: true, source: 'server' };
      }

      return { success: false, message: data.message };
    } catch (err) {
      console.log('toggleFavorite error', err);
      return { success: false, message: err.message };
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchShows();
  }, []);
  useEffect(() => {
    if (isLoaded && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      console.log('Fetching favorites...');
      if (location.pathname.startsWith('/admin')) {
        fetchIsAdmin();
      }
      fetchFavoriteMovies();
    }
  }, [isLoaded, user?.id, location.pathname]);

  const value = {
    axios,
    fetchIsAdmin,
    user,
    getToken,
    navigate,
    isAdmin,
    shows,
    favoriteMovies,
    fetchFavoriteMovies,
    toggleFavorite,
    image_base_url,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
  
