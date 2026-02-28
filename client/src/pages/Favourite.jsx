import React, { useEffect, useState } from 'react'
import MovieCard from '../components/MovieCard'
import BlurCircle from '../components/BlurCircle'

import { getFavoriteMovieIds } from '../lib/favorites'
import { useAppContext } from '../context/AppContext'

const Favourite = () => {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const { favoriteMovies }=useAppContext();

  useEffect(() => {
    const syncFavorites = () => {
      setFavoriteIds(getFavoriteMovieIds());
    };

    syncFavorites();
    window.addEventListener('storage', syncFavorites);
    window.addEventListener('favorites-updated', syncFavorites);

    return () => {
      window.removeEventListener('storage', syncFavorites);
      window.removeEventListener('favorites-updated', syncFavorites);
    };
  }, []);

  const favoriteIdSet = new Set(favoriteIds.map((id) => String(id)));
  const shows = favoriteMovies.filter((movie) =>
    favoriteIdSet.has(String(movie.id || movie._id))
  );
  return shows.length > 0 ?(
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <BlurCircle top='150px' left='0px'/>
      <BlurCircle bottom='50px' right='50px'/>
      <h1 className='text-lg font-medium my-4'>Your Favourite Movies</h1>
      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {shows.map((movie)=>(
          <MovieCard movie={movie} key={movie.id}/>
        ))}
      </div>
    </div>
  ):(
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-3xl font-bold text-center'>
        No favourite movies yet
      </h1>
    </div>
  )
}

export default Favourite ;
