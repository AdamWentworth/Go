// server.js
const express = require('express');
const cors = require('cors');
const logger = require('./middlewares/logger');
const pokemonRoutes = require('./routes/pokemonRoutes');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');

// Load environment variables
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const app = express();

// Ensure correct path and file reading
const appConfigPath = path.join(__dirname, 'config', 'app_conf.yml');
const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
const appConfig = YAML.parse(appConfigContent);

// Load OpenAPI specification
const openAPIPath = path.join(__dirname, 'config', 'openapi.yml');
const openAPIContent = fs.readFileSync(openAPIPath, 'utf8');
const swaggerDocument = YAML.parse(openAPIContent);

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Allow only this origin
  credentials: true, // Allow credentials (cookies, headers)
};

// Basic Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use(pokemonRoutes);

// Use configuration from app_conf.yml
const port = process.env.PORT || appConfig.app.port || 3001;

// Starting the Server
app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});
