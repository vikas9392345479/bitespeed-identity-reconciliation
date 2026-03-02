const Contact = require('../models/Contact');
const { Op } = require('sequelize');

exports.identify = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    // 1. Find all contacts that match either the email OR the phone number
    const contacts = await Contact.findAll({
      where: {
        [Op.or]: [
          { email: email || null },
          { phoneNumber: phoneNumber ? String(phoneNumber) : null }
        ]
      }
    });

    // --- CASE 1: NO CONTACTS FOUND ---
    if (contacts.length === 0) {
      const newContact = await Contact.create({
        email,
        phoneNumber: phoneNumber ? String(phoneNumber) : null,
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

    // --- CASE 2: CONTACTS FOUND ---
    // Find all unique Primary IDs involved
    let primaryIds = [...new Set(contacts.map(c => c.linkedId || c.id))];
    
    // Fetch all contacts belonging to these primary chains to get the full picture
    const allRelated = await Contact.findAll({
      where: {
        [Op.or]: [
          { id: primaryIds },
          { linkedId: primaryIds }
        ]
      },
      order: [['createdAt', 'ASC']] // Oldest first
    });

    const primaryContact = allRelated.find(c => c.linkPrecedence === 'primary');
    const secondaryContacts = allRelated.filter(c => c.id !== primaryContact.id);

    // Check if the incoming request has NEW information
    const existingEmails = allRelated.map(c => c.email);
    const existingPhones = allRelated.map(c => c.phoneNumber);

    const isNewEmail = email && !existingEmails.includes(email);
    const isNewPhone = phoneNumber && !existingPhones.includes(String(phoneNumber));

    if (isNewEmail || isNewPhone) {
      const newSecondary = await Contact.create({
        email,
        phoneNumber: phoneNumber ? String(phoneNumber) : null,
        linkedId: primaryContact.id,
        linkPrecedence: 'secondary'
      });
      secondaryContacts.push(newSecondary);
    }

    // --- RESPONSE FORMATTING ---
    res.status(200).json({
      contact: {
        primaryContatctId: primaryContact.id,
        emails: [...new Set([primaryContact.email, ...secondaryContacts.map(c => c.email)])].filter(Boolean),
        phoneNumbers: [...new Set([primaryContact.phoneNumber, ...secondaryContacts.map(c => c.phoneNumber)])].filter(Boolean),
        secondaryContactIds: secondaryContacts.map(c => c.id)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};