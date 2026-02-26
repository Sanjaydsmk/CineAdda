import React, { useState } from 'react';
import { dummyTrailers } from '../assets/assets';
import { PlayCircleIcon } from 'lucide-react';
import BlurCircle from './BlurCircle';

const TrailerSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      <p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">
        Trailers
      </p>

      {/* MAIN TRAILER (CLICK TO OPEN YOUTUBE) */}
      <div
        onClick={() => window.open(currentTrailer.videoUrl, '_blank')}
        className="relative mt-6 mx-auto max-w-[960px] aspect-video rounded-xl overflow-hidden cursor-pointer"
      >
        <BlurCircle top="-100px" right="-100px" />
        <img
          src={currentTrailer.image}
          alt="trailer"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <PlayCircleIcon className="w-16 h-16 text-white" />
        </div>
      </div>

      {/* TRAILER THUMBNAILS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto">
        {dummyTrailers.map((trailer) => (
          <div
            key={trailer.videoUrl}
            onClick={() => setCurrentTrailer(trailer)}
            className="relative cursor-pointer hover:-translate-y-1 transition duration-300"
          >
            <img
              src={trailer.image}
              alt="trailer"
              className="rounded-lg w-full h-full object-cover brightness-75"
            />
            <PlayCircleIcon
              className="absolute top-1/2 left-1/2 w-8 h-8 text-white
              -translate-x-1/2 -translate-y-1/2"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailerSection;