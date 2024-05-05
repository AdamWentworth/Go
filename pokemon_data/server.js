const express = require('express');
const cors = require('cors');
const logger = require('./middlewares/logger');
const pokemonRoutes = require('./routes/pokemonRoutes');

const app = express();

// Basic Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Middleware
app.use(logger);

app.use(pokemonRoutes);

// Starting the Server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
