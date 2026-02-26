import React from 'react';
import { assets } from '../assets/assets';
import { ArrowRight, CalendarIcon, ClockIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const HeroSection = () => {

const navigate=useNavigate()

  return (
    <div className='flex flex-col items-start justify-center 
    gap-4 px-6 md:px-16 lg:px-36 bg-[url("/backgroundImage.png")]
    bg-cover bg-center h-screen '>
        <img src={assets.marvelLogo} alt="" className="max-h-11 lg:h-11 mt-20"/>
      
      <h1 className='text-5xl md:text-[60px] md:leading-18 
       font-semibold max-w-110'>Guardians <br/> of the Galaxy</h1>
  <div className='flex items-center gap-4 textgray-300'>
    <span>Action | Adventure | Sci-Fi </span>
    <div>
        <CalendarIcon className='w-3 h-3'/> 2018
    </div>
    <div>
        <ClockIcon className='w-3 h-3'/> 2h 10m 
    </div>
    
     </div>
    <button onClick={() => navigate('/movies')} className='flex items-center gap-1 px-6 py-3 text-sm 
     bg-primary hover:bg-primary-dull rounded-full transition font-medium cursor-pointer'>
        Explore Movies
        <ArrowRight className='w-4.5 h-4.5' />  
     </button>

    </div> 
  
  )
}
export default HeroSection;