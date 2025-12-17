import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const Teacher = db.define("Teacher", {
    TeacherId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    Name: {
        type: Sequelize.STRING(100),
        allowNull: false
    },

    Email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },

    PasswordHash: {
        type: Sequelize.STRING,
        allowNull: false
    },

}, {
    timestamps: true   // createdAt, updatedAt
});

export default Teacher;