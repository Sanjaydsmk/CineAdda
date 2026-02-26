const isoTimeFormat=(dateTime)=>{
    const date=new Date(dateTime)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
} 
export default isoTimeFormat
