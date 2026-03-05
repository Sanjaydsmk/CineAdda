import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import MovieCard from '../components/MovieCard';
import BlurCircle from '../components/BlurCircle';
import { useAppContext } from '../context/AppContext';

const MLLab = () => {
  const { axios, user, getToken, shows } = useAppContext();
  const [personalized, setPersonalized] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [loadingPersonalized, setLoadingPersonalized] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loadingSentiment, setLoadingSentiment] = useState(false);

  useEffect(() => {
    if (shows?.length && !selectedMovieId) {
      setSelectedMovieId(String(shows[0]._id || shows[0].id));
    }
  }, [shows, selectedMovieId]);

  const fetchPersonalized = async () => {
    if (!user) {
      toast.error('Please login to get personalized recommendations.');
      return;
    }
    try {
      setLoadingPersonalized(true);
      const token = await getToken();
      const { data } = await axios.post(
        '/api/ml/personalized',
        { top_k: 8 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setPersonalized(data.recommendations || []);
      } else {
        toast.error(data.message || 'Failed to fetch personalized recommendations.');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'ML service unavailable.');
    } finally {
      setLoadingPersonalized(false);
    }
  };

  const fetchSimilar = async () => {
    if (!selectedMovieId) {
      toast.error('Select a movie first.');
      return;
    }
    try {
      setLoadingSimilar(true);
      const { data } = await axios.get(`/api/ml/similar/${selectedMovieId}?top_k=8`);
      if (data.success) {
        setSimilarMovies(data.recommendations || []);
      } else {
        toast.error(data.message || 'Failed to fetch similar movies.');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'ML service unavailable.');
    } finally {
      setLoadingSimilar(false);
    }
  };

  const analyzeSentiment = async () => {
    if (!reviewText.trim()) {
      toast.error('Enter review text first.');
      return;
    }
    try {
      setLoadingSentiment(true);
      const { data } = await axios.post('/api/ml/sentiment', { reviewText });
      if (data.success) {
        setSentiment(data);
      } else {
        toast.error(data.message || 'Failed to analyze sentiment.');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'ML service unavailable.');
    } finally {
      setLoadingSentiment(false);
    }
  };

  return (
    <div className='relative mt-28 mb-24 px-6 md:px-16 lg:px-32 min-h-[80vh] overflow-hidden'>
      <BlurCircle top='100px' left='-80px' />
      <BlurCircle bottom='20px' right='-80px' />
      <h1 className='text-3xl font-semibold'>ML Lab</h1>
      <p className='text-gray-300 mt-2'>
        Personalized recommendations, sentiment analysis, and similar movie finder.
      </p>

      <section className='mt-8 border border-gray-700 rounded-2xl p-5 bg-gray-900/50'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-xl font-medium'>1. Personalized Recommendation</h2>
          <button
            onClick={fetchPersonalized}
            className='px-4 py-2 rounded-full bg-primary hover:bg-primary-dull transition text-sm cursor-pointer'
          >
            {loadingPersonalized ? 'Loading...' : 'Generate'}
          </button>
        </div>
        <div className='flex flex-wrap gap-8 mt-6 max-sm:justify-center'>
          {personalized.map((movie) => (
            <MovieCard key={movie._id || movie.id} movie={movie} />
          ))}
          {!personalized.length && (
            <p className='text-gray-400 text-sm'>No personalized movies yet.</p>
          )}
        </div>
      </section>

      <section className='mt-8 border border-gray-700 rounded-2xl p-5 bg-gray-900/50'>
        <h2 className='text-xl font-medium'>2. Review Sentiment Analysis</h2>
        <textarea
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          rows={4}
          placeholder='Write a review like: The movie was visually stunning but story was average.'
          className='w-full mt-3 rounded-xl bg-black/40 border border-gray-700 p-3 outline-none focus:border-primary'
        />
        <button
          onClick={analyzeSentiment}
          className='mt-3 px-4 py-2 rounded-full bg-primary hover:bg-primary-dull transition text-sm cursor-pointer'
        >
          {loadingSentiment ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
        {sentiment && (
          <div className='mt-4 text-sm text-gray-300'>
            <p>Label: <span className='font-medium'>{sentiment.label}</span></p>
            <p>Confidence: {(Number(sentiment.confidence || 0) * 100).toFixed(1)}%</p>
          </div>
        )}
      </section>

      <section className='mt-8 border border-gray-700 rounded-2xl p-5 bg-gray-900/50'>
        <div className='flex flex-wrap items-center gap-3'>
          <h2 className='text-xl font-medium'>3. Similar Movie Finder</h2>
          <select
            value={selectedMovieId}
            onChange={(event) => setSelectedMovieId(event.target.value)}
            className='bg-black/40 border border-gray-700 rounded-md px-3 py-2'
          >
            <option value=''>Select movie</option>
            {shows.map((movie) => {
              const movieId = String(movie._id || movie.id);
              return (
                <option key={movieId} value={movieId}>
                  {movie.title}
                </option>
              );
            })}
          </select>
          <button
            onClick={fetchSimilar}
            className='px-4 py-2 rounded-full bg-primary hover:bg-primary-dull transition text-sm cursor-pointer'
          >
            {loadingSimilar ? 'Loading...' : 'Find Similar'}
          </button>
        </div>

        <div className='flex flex-wrap gap-8 mt-6 max-sm:justify-center'>
          {similarMovies.map((movie) => (
            <MovieCard key={movie._id || movie.id} movie={movie} />
          ))}
          {!similarMovies.length && (
            <p className='text-gray-400 text-sm'>No similar movies loaded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MLLab;
