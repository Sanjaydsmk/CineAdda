import React, { useEffect, useState } from 'react';
import { CheckIcon, DeleteIcon, StarIcon } from 'lucide-react';
import Title from '../components/admin/title';
import Loading from '../components/Loading';
import kConverter from '../lib/kConverter';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';

const AddShows = () => {
  const { axios, getToken, image_base_url, user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState('');
  const [showPrice, setShowPrice] = useState('');
  const [addingShow, setAddingShow] = React.useState(false);

  const currency = '$';

   const fetchNowPlayingMovies = async () => {
    try {
      const { data } = await axios.get('/api/shows/now-playing', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setNowPlayingMovies(data.movies || []);
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
    }
  };
   const handleSubmit = async () => {
    try {
      setAddingShow(true);
      if (
        !selectedMovie ||
        Object.keys(dateTimeSelection).length === 0 ||
        !showPrice
      ) {
        setAddingShow(false);
        return toast.error('Missing required fields');
      }
      const showsInput = Object.entries(dateTimeSelection).map(
        ([date, time]) => ({
          date,
          time,
        })
      );
      const payload = {
        movieId: selectedMovie,
        showsInput: showsInput,
        showPrice: showPrice,
      };
      const response = await axios.post('/api/show/add', payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (response.data.success) {
        toast.success('Show added successfully');
        setSelectedMovie(null);
        setDateTimeSelection({});
        setShowPrice('');
      } else {
        console.log(response.data.message);
      }
    } catch (err) {
      console.log(err);
      toast.error('Failed to add show');
    } finally {
      setAddingShow(false);
    }
  };

  useEffect(() => {

    if(user){
    fetchNowPlayingMovies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split('T');
    if (!date || !time) return;
    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });
  };

  const handleRemoveDateTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: filteredTimes };
    });
  };

  const handleAddShow = async () => {
    if (!selectedMovie) {
      toast.error('Please select a movie');
      return;
    }
    if (!showPrice) {
      toast.error('Please enter show price');
      return;
    }
    const showsInput = Object.entries(dateTimeSelection).map(([date, times]) => ({
      date,
      time: times
    }));
    if (showsInput.length === 0) {
      toast.error('Please add at least one date/time');
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.post(
        '/api/shows/add',
        {
          movieId: selectedMovie.id,
          showsInput,
          showPrice: Number(showPrice)
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` }
        }
      );
      if (data.success) {
        toast.success(data.message || 'Show added');
        setSelectedMovie(null);
        setDateTimeSelection({});
        setDateTimeInput('');
        setShowPrice('');
      } else {
        toast.error(data.message || 'Failed to add show');
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to add show');
    } finally {
      setLoading(false);
    }
  };

  return !loading ? (
    <>
      <Title text1="Add" text2="Shows" />
      <p className="mt-10 text-4 font-medium">Now Playing Movies</p>

      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
        {nowPlayingMovies.map((movie) => (
          <div
            key={movie.id}
            className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300 ${
              selectedMovie?.id === movie.id ? 'ring-2 ring-primary/60 rounded-lg' : ''
            }`}
            onClick={() => setSelectedMovie(movie)}
          >
            <div className="relative rounded-lg overflow-hidden">
            <img
              src={`${image_base_url}${movie.poster_path}`}
              alt=""
              className="w-full object-cover brightness-90"
            />
            <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
              <p className="flex items-center gap-1 text-gray-400">
                <StarIcon className="w-4 h-4 text-primary fill-primary" />
                {movie.vote_average.toFixed(1)}
              </p>
              <p className="text-gray-300">{kConverter(movie.vote_count)} Votes</p>
            </div>
            </div>

            {selectedMovie?.id === movie.id && (
                <div className="absolute top-2 right-2 bg-primary rounded-full w-6 h-6 flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
               <p className="font-medium truncate">{movie.title}</p>
              <p className="text-gray-400 text-sm">{movie.release_date}</p>

          </div>
        ))}
        </div>
      </div>

           <div className="mt-8">
        <label className="block font-medium mb-2 text-sm">Show Price</label>
        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
          <p className="text-gray-400 text-sm">{currency}</p>
          <input
            type="number"
            min={0}
            className="outline-none"
            onChange={(e) => setShowPrice(e.target.value)}
            placeholder="Enter Show Price"
          />
        </div>
      </div>

        <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Select Date and Time
        </label>
        <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
          <input
            type="datetime-local"
            value={dateTimeInput}
            onChange={(e) => setDateTimeInput(e.target.value)}
            className="outline-none rounded-md"
          />
          <button
            onClick={handleDateTimeAdd}
            className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
          >
            Add Time
          </button>
        </div>
      </div> 

 {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2">Selected Date-Time</h2>
          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">{date}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time, index) => (
                    <div
                      key={index}
                      className="border border-primary px-2 py-1 flex items-center rounded"
                    >
                      <span>{time}</span>
                      <DeleteIcon
                        onClick={() => handleRemoveDateTime(date, time)}
                        width={15}
                        className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
 <button
        onClick={handleAddShow}
        className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer"
      >
        Add Show
      </button>

    </>
  ) : (
    <Loading />
  );
};

export default AddShows;
