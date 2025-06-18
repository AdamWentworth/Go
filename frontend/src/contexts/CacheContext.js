// CacheContext.js
import { createContext } from 'react';

const CacheContext = createContext(new Map());  // Using Map as our in-memory cache.

export default CacheContext;
