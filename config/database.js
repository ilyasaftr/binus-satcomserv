const mongoose = require('mongoose');

async function connectDB() {
  try {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
    });
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true,
      autoCreate: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error(error);
  }
}

module.exports = connectDB;
