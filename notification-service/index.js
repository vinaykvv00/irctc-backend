const { validateConfig } = require('./config');
const logger = require('./config/logger');

async function startNotificationService() {
    try {
        logger.info("Starting the notification service");
        validateConfig();

        const emailConsumer = require('./kafka/consumer/email.consumer');
        await emailConsumer.start();

        logger.info("Notification service started successfully");
        logger.info("service is ready to process email notifications");
    } catch (error) {
        logger.error('Failed to start Notification Service', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { reason, promise });
})

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception thrown:', { error: error.message, stack: error.stack });
    process.exit(1);
})

startNotificationService();