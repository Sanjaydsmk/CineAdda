const isoTimeFormat=(dateTime)=>{
    const date=new Date(dateTime)
    const appTimeZone = import.meta.env.VITE_SHOW_TIMEZONE || 'Asia/Kolkata';
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: appTimeZone,
    })
} 
export default isoTimeFormat
