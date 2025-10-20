const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || 'mysql',
        dialectOptions: {
            // Use SSL for secure connection to cloud databases like PlanetScale or TiDB
            ssl: {
                require: true,
                rejectUnauthorized: true,
            }
        },
        logging: false // Set to console.log to see raw SQL queries during development
    }
);

module.exports = sequelize;