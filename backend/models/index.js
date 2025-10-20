const sequelize = require('../config/database');
const User = require('./User');
const Report = require('./Report');
const Product = require('./Product');

// Define associations between models
// A User can have many Reports
User.hasMany(Report, { 
    foreignKey: 'submittedById',
    onDelete: 'SET NULL' // If a user is deleted, keep their reports but nullify the reference
});
Report.belongsTo(User, { 
    foreignKey: 'submittedById' 
});

// A function to synchronize all models with the database
const syncModels = async () => {
    try {
        // alter: true will check the current state of the table in the database 
        // and then performs the necessary changes in the table to make it match the model.
        await sequelize.sync({ force: false }); 
        console.log("All models were synchronized successfully.");
    } catch (error) {
        console.error('Unable to synchronize models with the database:', error);
    }
};

module.exports = {
    sequelize,
    User,
    Report,
    Product,
    syncModels
};