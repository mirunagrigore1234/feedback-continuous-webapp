import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const Feedback = db.define("Feedback", {
    FeedbackId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    StudentId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },

    ActivityId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },

    Emotion: {
        type: Sequelize.ENUM('happy', 'sad', 'surprised', 'confused'),
        allowNull: false
    },

    Timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
});

export default Feedback;
