const { Sequelize, DataTypes } = require('sequelize');

// Switch to :memory: so Vercel doesn't crash trying to write to a file
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

const Contact = sequelize.define('Contact', {
  phoneNumber: DataTypes.STRING,
  email: DataTypes.STRING,
  linkedId: DataTypes.INTEGER,
  linkPrecedence: {
    type: DataTypes.ENUM('primary', 'secondary'),
    defaultValue: 'primary'
  },
}, {
  timestamps: true,
});

module.exports = { sequelize, Contact };