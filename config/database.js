const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // This will create the database file here
  logging: false
});

module.exports = sequelize;