import axios from "axios"
import { err } from "inngest/types";
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import connectDB from "../configs/db.js";


//api to get now playing fromtmdb 


export const getNowPlayingMovies = async (req, res) => {
    try{
      
        const {data} =await axios.get('https://api.themoviedb.org/3/movie/now_playing',{
            headers:{ Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
        })

        const movies=data.results;
        res.json({success:true, movies:movies})

    } catch(error){
        console.error(error);
        res.json({success:false, message:error.message }) 

    }
}

// api to add new show to db
export const addShow = async (req, res) => {
  try {
    await connectDB();
    const { movieId, showsInput, showPrice } = req.body;

    let movie = await Movie.findById(movieId);

    // If movie not in DB → fetch from TMDB
    if (!movie) {

      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
          }
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
          }
        })
      ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieData = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres.map((g) => g.name),
        cast: movieCreditsData.cast.slice(0, 5).map((c) => c.name),
        vote_average: movieApiData.vote_average,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        runtime: movieApiData.runtime,
      };

      movie = await Movie.create(movieData);
    }

    // Create shows
    const showsToCreate = [];

    showsInput.forEach((show) => {
      const showDate = show.date;

      show.time.forEach((time) => {   // ← fixed (time not times)
        const dateTimeString = `${showDate}T${time}:00`;

        showsToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {}
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    res.json({
      success: true,
      message: "Shows added successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


//api to get all shows

export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({
      showDateTime: { $gte: new Date() }
    })
      .populate("movie")
      .sort({ showDateTime: 1 });

    // filter unique shows
    const uniqueShows = new Set(
      shows.map((show) => show.movie)
    );

    res.json({
      success: true,
      shows: Array.from(uniqueShows)
    });

  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: error.message
    });
  }
};


//api to get single show from db

export const getShow = async (req, res) => {
  try {
    await connectDB()
    const { movieId } = req.params;

    // get all upcoming shows for the movie
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() }
    });

    const movie = await Movie.findById(movieId);
    const dateTime = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];

      if (!dateTime[date]) {
        dateTime[date] = [];
      }

      dateTime[date].push({
        time: show.showDateTime,
        showId: show._id
      });
    });
     res.json({
      success: true,movie,dateTime
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message
    });
  }
};