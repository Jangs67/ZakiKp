process.env.MONGODB_URI = 'mongodb+srv://zaki:zakiganteng@datasekolah.0prayw8.mongodb.net/?appName=Datasekolah';
const connectDB = require('./lib/mongodb').default;
(async () => {
  try {
    console.log('connectDB start');
    await connectDB();
    console.log('connectDB success');
    process.exit(0);
  } catch (err) {
    console.error('connectDB failed', err);
    process.exit(1);
  }
})();
