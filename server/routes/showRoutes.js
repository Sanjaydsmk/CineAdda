import express from "express";
import { getNowPlayingMovies, addShow, getShow, getShows, getMoodRecommendations } 
from "../controller/showController.js";
import { protectAdmin } from "../middleware/auth.js";
import { requireAuth } from "@clerk/express";

const showRouter = express.Router();

showRouter.get('/now-playing',requireAuth(), getNowPlayingMovies);
showRouter.post('/add', protectAdmin, addShow);
showRouter.post('/moodify', getMoodRecommendations);
showRouter.get('/all',getShows)
showRouter.get('/:movieId',getShow)



export default showRouter;
