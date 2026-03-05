
const dateFormat = (date) => {
  const appTimeZone = import.meta.env.VITE_SHOW_TIMEZONE || 'Asia/Kolkata';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day:'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: appTimeZone,
  });
}
export default dateFormat  
