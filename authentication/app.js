// app.js

// Load environment variables
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passportSetup = require('./strategies/passport-setup');
const passport = require('passport');
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs');
const path = require('path')
const logger = require('./middlewares/logger'); // Assuming the logger is in the middlewares folder
// const axios = require('axios');

const cron = require('node-cron');
const createBackup = require('./tasks/backup');

// Ensure correct path and file reading
const appConfigPath = path.join(__dirname, 'config', 'app_conf.yml');
const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
const appConfig = YAML.parse(appConfigContent);

// Load OpenAPI specification
const openAPIPath = path.join(__dirname, 'config', 'openapi.yml');
const openAPIContent = fs.readFileSync(openAPIPath, 'utf8');
const swaggerDocument = YAML.parse(openAPIContent);

// Create an Express application
const app = express();

// Schedule task to run at Midnight every day
cron.schedule('0 0 * * *', () => {
    console.log('Running daily database backup...');
    createBackup();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// Initialize Passport and use sessions
app.use(passport.initialize());
app.use(passport.session());

// Apply JSON parsing middleware
app.use(express.json());

app.use(cookieParser());

// CORS setup
app.use(cors({
    origin: process.env.FRONTEND_URL, // Ensure this matches exactly with the front-end's origin
    credentials: true,
    optionsSuccessStatus: 200
}));

// Security enhancements with Helmet
app.use(helmet());

// Custom Logger Middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Connection to MongoDB with streamlined error handling
mongoose.connect(process.env.DATABASE_URL)
.then(() => {
    logger.info('Connected to Database');
})
.catch((error) => {
    logger.error('Connection error:', error);
});

// Rate limiting configuration for auth routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per window
});
app.use('/auth', limiter); // Apply rate limiting to authentication routes

// Importing authentication routes
const authRoute = require('./routes/authRoute');
app.use('/auth', authRoute);

// Define port from configuration file or use a default value
const port = appConfig.app.port || 3003;

// Start the server
app.listen(port, () => {
    logger.info(`Server started at http://localhost:${port}`);
});

// Central error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled Error:', err);
    const status = err.status || 500;
    const message = status === 500 ? "Internal Server Error" : err.message;
    res.status(status).send({ message });
});
