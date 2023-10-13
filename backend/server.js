const express = require('express');
const cors = require('cors');
const logger = require('./middlewares/logger');

const app = express();

// Basic Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Middleware
app.use(logger);

// Example route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Starting the Server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
