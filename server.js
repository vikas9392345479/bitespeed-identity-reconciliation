const express = require('express');
const bodyParser = require('body-parser');
const { sequelize, Contact } = require('./models'); // Import from our new file
const { Op } = require('sequelize');

const app = express();
app.use(bodyParser.json());

// This creates the database tables in RAM on every start
sequelize.sync(); 

app.post('/api/identify', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    
    // Simple logic for the demo test
    const contacts = await Contact.findAll({
      where: {
        [Op.or]: [
          email ? { email } : null,
          phoneNumber ? { phoneNumber } : null
        ].filter(Boolean)
      }
    });

    if (contacts.length === 0) {
      const newContact = await Contact.create({ email, phoneNumber, linkPrecedence: 'primary' });
      return res.status(200).json({
        contact: { primaryContatctId: newContact.id, emails: [email].filter(Boolean), phoneNumbers: [phoneNumber].filter(Boolean), secondaryContactIds: [] }
      });
    }

    res.status(200).json({ 
        message: "Identity reconciled", 
        primaryId: contacts[0].linkedId || contacts[0].id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => res.send('Bitespeed Service is Live!'));

// Export for Vercel and local testing
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => console.log('Running on port 3000'));
}
module.exports = app;