require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database');
const Contact = require('./models/Contact');
const identityRoutes = require('./routes/identityRoutes'); // Connects your routes folder

const app = express();
app.use(express.json());

// This tells the server to use your routes for any URL starting with /api
app.use('/api', identityRoutes);

const PORT = process.env.PORT || 3000;

// This part connects to the database and starts the server
sequelize.sync().then(() => {
  console.log('Database connected and tables created!');
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Your endpoint is: http://localhost:${PORT}/api/identify`);
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});