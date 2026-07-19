const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { config } = require('./config');
const logger = require('./config/logger');

const authRoutes = require('./routes/auth.route');

const { corsMiddleware } = require('./middlewares/cors.middleware');
const errorHandler = require('./middlewares/error.middleware');
const { reqLogger } = require('./middlewares/req.middleware');

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use(reqLogger);
app.use("/api/v1/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Hello from index.js of user service. User Service is running");
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP" });
});

app.use(errorHandler);

const startServer = async () => {
    try {
        const server = app.listen(config.PORT, () => {
            logger.info(
                `${config.SERVICE_NAME} is running on http://localhost:${config.PORT}`
            );
        })
    } catch (error) {
        logger.error("Failed to start server", error);
        process.exit(1);
    }
}
startServer();