require('dotenv').config({ quiet: true });

const config = {
    SERVICE_NAME: require('../package.json').name,
    PORT: Number(process.env.PORT) || 4004,
    NODE_ENV: process.env.NODE_ENV || "development",
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    KAFKA_BROKER: process.env.KAFKA_BROKER || "localhost:9093",
    KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || "notification-service",
    KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || "notification-service-group",
};

const validateConfig = () => {
    const required = ['SENDGRID_API_KEY', 'MAIL_FROM'];
    const missing = required.filter((key) => !config[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (!config.SENDGRID_API_KEY.startsWith('SG.')) {
        throw new Error('SENDGRID_API_KEY must be a real SendGrid API key starting with SG.');
    }

    if (!config.MAIL_FROM.includes('@')) {
        throw new Error('MAIL_FROM must be a sender email address verified in SendGrid.');
    }
};

module.exports = { config, validateConfig };