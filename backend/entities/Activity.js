import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const Activity = db.define("Activity", {
    ActivityId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    Title: {
        type: Sequelize.STRING(100),
        allowNull: false
    },

    Description: {
        type: Sequelize.TEXT,
        allowNull: false
    },

    AccessCode: {
         type: Sequelize.STRING(6),
        allowNull: false,
        unique: true,
        validate: {
            len: [6, 6],
            isAlphanumeric: true
       }
    },

    StartTime: {
        type: Sequelize.DATE,
        allowNull: false
    },

    EndTime: {
        type: Sequelize.DATE,
        allowNull: false
    },

    ProfessorId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

export default Activity;
