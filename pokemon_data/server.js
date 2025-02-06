// server.js
const express = require('express');
const cors = require('cors');
const logger = require('./middlewares/logger');
const pokemonRoutes = require('./routes/pokemonRoutes');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables with fallback
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
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
const allowedOrigins = [
  'http://localhost:3000',  // Local frontend
  'https://pokemongonexus.com',
  'https://www.pokemongonexus.com',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production' || origin.endsWith('.cloudflare.com')) {
      callback(null, true);
    } else {
      // Log the unauthorized access attempt
      logger.warn(`Unauthorized CORS access attempt from origin: ${origin}`);
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust Cloudflare proxy headers
app.set('trust proxy', true);

// Custom Middleware to Log Requests
app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.url} from ${req.ip}`);
    next();
});

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use(pokemonRoutes);

// Use configuration from app_conf.yml
const port = process.env.PORT || (appConfig.app && appConfig.app.port) || 3001;

// Starting the Server (Listening on All Interfaces)
app.listen(port, "0.0.0.0", () => {
    logger.info(`Server is running on http://0.0.0.0:${port} and accessible on the network`);
});
