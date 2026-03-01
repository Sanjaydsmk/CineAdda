import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BlurCircle from '../components/BlurCircle';
import { Heart, PlayCircleIcon, StarIcon } from 'lucide-react';
import timeFormat from '../lib/timeFormat';
import DateSelect from '../components/DateSelect';
import MovieCard from '../components/MovieCard';
import Loading from '../components/Loading';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShows] = React.useState(null);
  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    toggleFavorite,
    image_base_url,
  } = useAppContext();
  const getShows = async () => {
    try {
      const token = user ? await getToken() : null;
      const { data } = await axios.get(`/api/shows/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (data.success) {
        setShows(data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleFavorite = async () => {
    const result = await toggleFavorite(id);
    if (result.success) {
      toast.success('Favorites updated');
    } else {
      toast.error(result.message || 'Could not update favorites');
    }
  };
  useEffect(() => {
    if (id) {
      getShows();
    }
  }, [id, user]);

  if (!show || !show.movie) {
    return <Loading />;
  }
  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={
            show.movie.poster_path
              ? `${image_base_url}${show.movie.poster_path}`
              : '/no-image.png'
          }
          alt={show.movie.title}
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />
        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">{show.movie.original_language}</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {show.movie.title}
          </h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {show.movie.vote_average?.toFixed(1)} User Rating
          </div>
          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
            {show.movie.overview}
          </p>
          <p>
            {timeFormat(show.movie.runtime)} • {show.movie.genres?.join(', ')} •{' '}
            {show.movie.release_date?.split('-')[0]}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95">
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>
            <a
              href="#dateSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              Buy Tickets
            </a>
            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95"
            >
              <Heart
                className={`w-5 h-5 ${
                  favoriteMovies?.find((m) => m._id.toString() === id)
                    ? 'fill-primary text-primary'
                    : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <p className="text-lg font-medium mt-20">Your Favorite Cast</p>

      <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
        <div className="flex items-center gap-6 w-max px-4">
          {show.movie.cast?.slice(0, 12).map((castMember, index) => {
            const castName =
              typeof castMember === 'string' ? castMember : castMember?.name;
            const profilePath =
              typeof castMember === 'object' ? castMember?.profile_path : null;

            return (
              <div key={index} className="flex items-center flex-col text-center">
                {profilePath ? (
                  <img
                    src={image_base_url + profilePath}
                    alt={castName || 'Cast member'}
                    className="rounded-full h-20 w-20 object-cover bg-gray-700"
                  />
                ) : (
                  <div className="rounded-full h-20 w-20 bg-gray-700 flex items-center justify-center text-white text-xl font-semibold">
                    {(castName || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="font-medium text-xs mt-3 w-20 truncate">
                  {castName || 'Unknown'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <DateSelect dateTime={show.dateTime} id={id} />

      <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {shows
          .filter((s) => s && s.movie)
          .slice(0, 4)
          .map((s, index) => (
            <MovieCard key={index} movie={s.movie} />
          ))}
      </div>
      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate('/movies');
            scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show More
        </button>
      </div>
    </div>
  );
};

export default MovieDetails;
