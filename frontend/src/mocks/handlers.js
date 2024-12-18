// src/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  // Example GET handler
  rest.get('/api/example', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Hello World' }));
  }),

  // User Registration Handler
  rest.post('/api/register', async (req, res, ctx) => {
    const { username, email, password, trainerCode, pokemonGoName } = await req.json();

    // Simulate conflict errors
    if (username === 'existingUser') {
      return res(ctx.status(409), ctx.json({ message: 'Username is already taken.' }));
    }

    if (email === 'existing@example.com') {
      return res(ctx.status(409), ctx.json({ message: 'Email is already in use.' }));
    }

    if (pokemonGoName === 'existingPokemon') {
      return res(ctx.status(409), ctx.json({ message: 'Pokémon Go name is already taken.' }));
    }

    if (trainerCode.replace(/\s+/g, '') === '123456789012') {
      return res(ctx.status(409), ctx.json({ message: 'Trainer Code is already in use.' }));
    }

    // Successful registration
    return res(ctx.status(201), ctx.json({ message: 'Registration successful.' }));
  }),

  // User Login Handler
  rest.post('/api/login', async (req, res, ctx) => {
    const { username, password } = await req.json();

    if (username === 'validUser' && password === 'Valid@1234') {
      return res(
        ctx.status(200),
        ctx.json({
          user_id: '1',
          email: 'valid@example.com',
          username: 'validUser',
          pokemonGoName: 'ValidPokemon',
          trainerCode: '123456789012',
          allowLocation: true,
          country: 'Country',
          city: 'City',
          accessTokenExpiry: '2025-01-01T00:00:00Z',
          refreshTokenExpiry: '2025-06-01T00:00:00Z',
        })
      );
    }

    return res(ctx.status(401), ctx.json({ message: 'Invalid credentials.' }));
  }),
  rest.get('http://localhost:3000/pokemons', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: [] })); // Mock response
  }),
];
