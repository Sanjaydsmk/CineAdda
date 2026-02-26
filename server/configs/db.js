import mongoose from "mongoose";

const connectDB = async () => {
    try{
        mongoose.connection.on('connected',()=> console.log('Database Connected Successfully'));
        await mongoose.connect(`${process.env.MONGODB_URL}/cineadda`)
    }
    catch(error){

    }
}
export default connectDB;