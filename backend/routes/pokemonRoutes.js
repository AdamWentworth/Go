const express = require('express');
const { getPokemon, createPokemon } = require('../controllers/pokemonController');

const router = express.Router();

router.get('/pokemon', getPokemon);
router.post('/pokemon', createPokemon);

module.exports = router;
