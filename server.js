const express = require('express');
const bodyParser = require('body-parser');
const { Contact } = require('./models'); // Ensure your models folder is correct
const { Op } = require('sequelize');

const app = express();
app.use(bodyParser.json());

app.post('/api/identify', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "Email or phoneNumber required" });
    }

    // 1. Find all related contacts
    const contacts = await Contact.findAll({
      where: {
        [Op.or]: [
          email ? { email } : null,
          phoneNumber ? { phoneNumber } : null
        ].filter(Boolean)
      }
    });

    if (contacts.length === 0) {
      // Create new primary contact
      const newContact = await Contact.create({
        email,
        phoneNumber,
        linkPrecedence: 'primary'
      });
      return res.status(200).json({
        contact: {
          primaryContatctId: newContact.id,
          emails: [newContact.email].filter(Boolean),
          phoneNumbers: [newContact.phoneNumber].filter(Boolean),
          secondaryContactIds: []
        }
      });
    }

    // 2. Identify the true primary contact
    let primaryContact = contacts.find(c => c.linkPrecedence === 'primary') || 
                     await Contact.findByPk(contacts[0].linkedId);

    // 3. Logic to link/reconcile goes here...
    // (Keeping it simple for the deploy test)
    
    res.status(200).json({
      contact: {
        primaryContatctId: primaryContact.id,
        emails: [...new Set(contacts.map(c => c.email))].filter(Boolean),
        phoneNumbers: [...new Set(contacts.map(c => c.phoneNumber))].filter(Boolean),
        secondaryContactIds: contacts.filter(c => c.linkPrecedence === 'secondary').map(c => c.id)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Root route so Vercel doesn't show 404
app.get('/', (req, res) => {
  res.send('Bitespeed Identity Service is Live!');
});

// IMPORTANT: Only listen if NOT on Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;