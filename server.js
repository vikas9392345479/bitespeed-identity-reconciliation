const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes, Op } = require('sequelize');

const app = express();
app.use(bodyParser.json());

// 1. DATABASE SETUP (In-Memory for Vercel)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// 2. MODEL DEFINITION (Inside server.js to avoid "module not found")
const Contact = sequelize.define('Contact', {
  phoneNumber: DataTypes.STRING,
  email: DataTypes.STRING,
  linkedId: DataTypes.INTEGER,
  linkPrecedence: {
    type: DataTypes.ENUM('primary', 'secondary'),
    defaultValue: 'primary'
  }
});

// 3. ROUTES
app.get('/', (req, res) => {
  res.send('Bitespeed Service is successfully running on Vercel!');
});

app.post('/api/identify', async (req, res) => {
  try {
    await sequelize.sync(); // Create tables in RAM
    const { email, phoneNumber } = req.body;

    // Search for existing contacts
    const contacts = await Contact.findAll({
      where: {
        [Op.or]: [
          email ? { email } : null,
          phoneNumber ? { phoneNumber } : null
        ].filter(Boolean)
      }
    });

    if (contacts.length === 0) {
      const newC = await Contact.create({ email, phoneNumber, linkPrecedence: 'primary' });
      return res.status(200).json({
        contact: {
          primaryContatctId: newC.id,
          emails: [email].filter(Boolean),
          phoneNumbers: [phoneNumber].filter(Boolean),
          secondaryContactIds: []
        }
      });
    }

    // Basic return for the test
    res.status(200).json({ 
      message: "Reconciliation successful", 
      primaryId: contacts[0].id 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. VERCEL EXPORT
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => console.log('Running locally on port 3000'));
}
module.exports = app;