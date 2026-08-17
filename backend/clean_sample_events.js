const mongoose = require('mongoose');
const Event = require('./model/Event');

async function clean() {
  try {
    await mongoose.connect('mongodb://localhost:27017/eventhub');
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
    console.log('Successfully cleaned sample events:', result);
  } catch (err) {
    console.error('Error cleaning sample events:', err);
  } finally {
    mongoose.connection.close();
  }
}

clean();
