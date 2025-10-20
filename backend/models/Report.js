const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
    productName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    entryDate: {
        type: DataTypes.DATEONLY, // Stores date as YYYY-MM-DD
        allowNull: false,
    },
    submittedByUsername: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    history: {
        type: DataTypes.JSON, // Use JSON type for flexible history storage
        defaultValue: []
    }
    // submittedById is added automatically via association in models/index.js
});

module.exports = Report;