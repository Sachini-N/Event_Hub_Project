const mongoose = require('mongoose');
const Event = require('./model/Event');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI not set in environment.");
  process.exit(1);
}

async function clean() {
  try {
    await mongoose.connect(mongoUri);
    const result = await Event.deleteMany({
      title: {
        $in: [
          'We Can Never Do Merely One Thing',
          'TRACE Community Meetup',
          'Future of Innovation in Sri Lanka',
          'Creative Industry Talk',
          'CodeFest Colombo: Annual Hackathon',
          'FinTech Innovation Summit',
          'Future of Cloud Computing',
        ],
      },
    });
    console.log('Successfully cleaned sample events from MongoDB:', result);
  } catch (err) {
    console.error('Error cleaning sample events:', err);
  } finally {
    mongoose.connection.close();
  }
}

clean();
