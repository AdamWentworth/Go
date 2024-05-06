const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

// Check if username exists and returns true or false
async function doesUsernameExist(username) {
    const user = await User.findOne({ username: username })
    return user ? true : false;
}

// Check if email exists and returns true or false
async function doesEmailExist(email) {
    const user = await User.findOne({ email: email })
    return user ? true : false;
}

// Create an account, if username and email is not found
router.post('/register', async (req, res) => {
    try {
        if (await doesUsernameExist(req.body.username)) {
            return res.status(400).json({ message: 'Username already exists' })
        }
        if (await doesEmailExist(req.body.email)) {
            return res.status(400).json({ message: 'Email already exists' })
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        })
        const newUser = await user.save()
        res.status(201).json({ user: newUser, message: 'Account created' })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// Login to an account, return the user email and username with status code 200 if successful
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (user == null) {
            return res.status(400).json({ message: 'Cannot find user' });
        }
        if (!await bcrypt.compare(req.body.password, user.password)) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        res.status(200).json({ email: user.email, username: user.username, message: 'Login successful' }); 
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Debug route for getting all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find()
        res.json(users)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


module.exports = router;