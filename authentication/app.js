require('dotenv').config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const helmet = require('helmet')

const port = process.env.PORT || 3003
const app = express()

// Middleware
app.use(express.json())
app.use(cors())
app.use(helmet())

// MongoDB Connection
mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to DB'))

// Serve register.html at /register
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

// Serve login.html at /login
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});



// Routes
const authRoute = require('./routes/authRoute')
app.use('/auth', authRoute)

app.use(express.static('public'));
// Start the server
app.listen(port, () => console.log(`Server started at http://localhost:${port}/register`))

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

