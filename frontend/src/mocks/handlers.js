// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/example', () => {
    return HttpResponse.json({ message: 'Hello World' }, { status: 200 });
  }),
];