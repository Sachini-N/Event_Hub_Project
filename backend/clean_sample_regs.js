const mongoose = require('mongoose');
const Registration = require('./model/Registration');
require('dotenv').config();

const mongoUri =
  process.env.MONGO_URI ||
  'mongodb+srv://admin:3fg96tRd1iREyBza@cluster0.tkag7mg.mongodb.net/eventhub?retryWrites=true&w=majority&appName=Cluster0';

async function clean() {
  try {
    await mongoose.connect(mongoUri);
    const result = await Registration.deleteMany({
      email: {
        $in: [
          'sarah.j@example.com',
          'm.chen@designstudio.co',
          'emily.r@corpnet.org',
          'dkim88@startup.io',
        ],
      },
    });
    console.log('Successfully cleaned sample registrations from MongoDB:', result);
  } catch (err) {
    console.error('Error cleaning sample registrations:', err);
  } finally {
    mongoose.connection.close();
  }
}

clean();
