import React, { useEffect, useState } from 'react';
import { Heart, PlayCircleIcon, StarIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import BlurCircle from '../components/BlurCircle';
import DateSelect from '../components/DateSelect';
import MovieCard from '../components/MovieCard';
import { dummyDateTimeData, dummyShowsData } from '../assets/assets';
import timeFormat from '../lib/timeFormat';
import { isFavoriteMovie, toggleFavoriteMovie } from '../lib/favorites';

const MovieDetails = () => {

  const navigate = useNavigate();

  const { id } = useParams();
  const movieId = Number(id);
  const movie = dummyShowsData.find((show) => show.id === movieId);
  const shows = dummyShowsData.filter((show) => show.id !== movieId);
  const [isFavorite, setIsFavorite] = useState(false);
  const languageLabel =
    movie?.original_language?.toLowerCase() === 'en'
      ? 'ENGLISH'
      : movie?.original_language?.toUpperCase();
  const castMembers = movie?.casts || movie?.cast || [];

  

  useEffect(() => {
    if (!movie) {
      return;
    }

    setIsFavorite(isFavoriteMovie(movie.id));
  }, [movie]);

  const handleFavoriteClick = () => {
    if (!movie) {
      return;
    }

    setIsFavorite(toggleFavoriteMovie(movie.id));
  };

  if (!movie) {
    return (
      <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[60vh]">
        <h1 className="text-2xl font-semibold">Movie not found</h1>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={movie.poster_path || movie.backdrop_path}
          alt={movie.title}
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />
        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">{languageLabel}</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {movie.title}
          </h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {movie.vote_average?.toFixed(1)} User Rating
          </div>
          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
            {movie.overview}
          </p>
          <p>
            {timeFormat(movie.runtime)} •{' '}
            {movie.genres?.map((genre) => genre.name).join(', ')} •{' '}
            {movie.release_date?.split('-')[0]}
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
              onClick={handleFavoriteClick}
              className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95"
              aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
              type="button"
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
      <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
        <div className="flex items-center gap-6 w-max px-4">
          {castMembers.slice(0, 12).map((castItem, index) => {
            const castName =
              typeof castItem === 'string' ? castItem : castItem?.name || 'Unknown';
            const castImage =
              typeof castItem === 'string' ? '' : castItem?.profile_path || '';

            return (
              <div key={`${castName}-${index}`} className="flex items-center flex-col text-center">
                {castImage ? (
                  <img
                    src={castImage}
                    alt={castName}
                    className="rounded-full h-20 w-20 object-cover"
                  />
                ) : (
                  <div className="rounded-full h-20 w-20 bg-gray-700 flex items-center justify-center text-white text-xl font-semibold">
                    {castName.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="font-medium text-xs mt-3 w-20 truncate">{castName}</p>
              </div>
            );
          })}
        </div>
      </div>

      <DateSelect dateTime={dummyDateTimeData} id={movie.id} />
      <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {shows.slice(0, 4).map((show, index) => (
          <MovieCard key={index} movie={show} />
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
  )
};
export default MovieDetails;
