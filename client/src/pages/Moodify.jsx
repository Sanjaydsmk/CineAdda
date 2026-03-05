import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import BlurCircle from '../components/BlurCircle';
import MovieCard from '../components/MovieCard';
import { useAppContext } from '../context/AppContext';

const Moodify = () => {
  const { axios } = useAppContext();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const hasRecommendations = useMemo(
    () => Array.isArray(result?.recommendations) && result.recommendations.length > 0,
    [result]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim()) {
      toast.error('Please enter how you feel right now.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/shows/moodify', { text });
      if (data.success) {
        const normalizedRecommendations = (data.recommendations || [])
          .filter((movie) => movie && (movie._id || movie.id))
          .map((movie, index) => ({
          ...movie,
          title: movie?.title || 'Untitled Movie',
          _moodKey: movie?._id || movie?.id || `${movie?.title || 'movie'}-${index}`,
          }));
        setResult({ ...data, recommendations: normalizedRecommendations });
      } else {
        toast.error(data.message || 'Could not generate recommendations.');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to analyze mood.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative mt-28 mb-24 min-h-[75vh] px-6 md:px-16 lg:px-32 overflow-hidden'>
      <BlurCircle top='120px' right='-80px' />
      <BlurCircle bottom='40px' left='-80px' />

      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-semibold'>Moodify</h1>
        <p className='text-gray-300 mt-2'>
          Tell us how you feel, and we will recommend currently running theater movies.
        </p>

        <form onSubmit={onSubmit} className='mt-6 bg-gray-900/70 border border-gray-700 rounded-2xl p-5'>
          <label htmlFor='mood-text' className='text-sm text-gray-300'>
            Describe your current mood
          </label>
          <textarea
            id='mood-text'
            rows={5}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder='Example: I had a stressful day and want something light and uplifting.'
            className='w-full mt-3 rounded-xl bg-black/40 border border-gray-700 p-3 outline-none focus:border-primary'
          />
          <button
            type='submit'
            disabled={loading}
            className='mt-4 px-6 py-2 rounded-full bg-primary hover:bg-primary-dull transition font-medium disabled:opacity-70 cursor-pointer'
          >
            {loading ? 'Analyzing...' : 'Find My Movies'}
          </button>
        </form>

        {result && (
          <div className='mt-6 rounded-2xl border border-gray-700 bg-gray-900/60 p-4'>
            <p className='text-sm text-gray-400'>Detected mood</p>
            <p className='text-xl font-medium mt-1'>{result.mood}</p>
            <p className='text-sm text-gray-400 mt-2'>
              Recommendations from {result.totalRunningMovies} currently running movies.
            </p>
          </div>
        )}

        {hasRecommendations ? (
          <div className='mt-8 flex flex-wrap gap-8 max-sm:justify-center'>
            {result.recommendations.map((movie) => (
              <MovieCard movie={movie} key={movie._moodKey} />
            ))}
          </div>
        ) : (
          result && (
            <div className='mt-8 text-gray-300'>
              No suitable running movies found right now. Please try a different mood description.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Moodify;
