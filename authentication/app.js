// app.js

// Load environment variables
require('dotenv').config();

const express = require('express');
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
const path = require('path');
const logger = require('./middlewares/logger'); // Assuming the logger is in the middlewares folder

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(session({
    secret: 'secret', // Change to a random secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true } // Enable secure cookies when using HTTPS
}));

// Initialize Passport and use sessions
app.use(passport.initialize());
app.use(passport.session());

// Apply JSON parsing middleware
app.use(express.json());

// CORS configuration for development
app.use(cors({
    origin: 'http://localhost:3001', // Allow connections from the front-end URL
    optionsSuccessStatus: 200 // For compatibility with IE
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
