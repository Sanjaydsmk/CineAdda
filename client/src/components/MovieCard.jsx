import { StarIcon } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import timeFormat from '../lib/timeFormat';
import { useAppContext } from '../context/AppContext';

const getImageUrl = (path, baseUrl) => {
  if (!path || typeof path !== 'string') return '/no-image.svg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${baseUrl}${path}`;
};

const MovieCard = ({movie}) => {

    const navigate = useNavigate()
    const {image_base_url}=useAppContext()
    if (!movie) return null;
    const movieId = movie.id || movie._id;
    const genres = Array.isArray(movie.genres) ? movie.genres : [];
    const genreText = genres
      .slice(0, 2)
      .map((genre) => (typeof genre === 'string' ? genre : genre?.name))
      .filter(Boolean)
      .join('|') || 'Genre N/A';
    const releaseYear = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : 'N/A';
    const runtimeText = Number(movie.runtime) > 0 ? timeFormat(movie.runtime) : 'N/A';
    const ratingText =
      typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : 'N/A';
    const imagePath = movie.backdrop_path || movie.poster_path;
    const imageUrl = getImageUrl(imagePath, image_base_url);

  return (
  <div className='flex flex-col justify-between p-3 bg-gray-800
    rounded-2xl hover:-translate-y-1 transition duration-300 w-66'>

    <img onClick={()=>{
      navigate(`/movie/${movieId}`);
      scrollTo(0, 0);
    }}
    src={imageUrl}
    onError={(event) => {
      event.currentTarget.src = '/no-image.svg';
    }}
    alt={movie.title || 'Movie poster'} 
    className='w-full h-52 object-cover object-right-bottom
    rounded-lg cursor-pointer' />

    <p className='font-semibold mt-2 truncate'>{movie.title}</p>
   
    <p className='text-sm text-gray-400 mt-2'>
    {releaseYear} | {genreText} | {runtimeText}
         </p>

        <div className='flex items-center justify-between mt-4 pb-3'>
            <button onClick={()=>{
              navigate(`/movie/${movieId}`);
              scrollTo(0, 0);
            }} 
            className='px-4 py-2 text-xs bg-primary
            hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
            Buy Tickets
            </button>

            <p className='flex items-center gap-1 text-sm 
            text-gray-400 mt-1 pr-1'>
            <StarIcon className='w-4 h-4 text-primary fill-primary'/>
                {ratingText}
            </p>

        </div>
      
    </div>
  )
}
export default MovieCard;
