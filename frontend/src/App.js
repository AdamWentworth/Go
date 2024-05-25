// App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MainButtons from './components/MainButtons';
import Collect from './components/Collect/Collect';
import Login from './components/Authentication/Login';
import Register from './components/Authentication/Register';
import Account from './components/Authentication/Account';
import './App.css';
import CacheContext from './contexts/CacheContext';
import { AuthProvider } from './contexts/AuthContext';
import { PokemonDataProvider } from './contexts/PokemonDataContext'; // Import the PokemonDataProvider

function App() {
    const cache = new Map();

    return (
        <CacheContext.Provider value={cache}>
            <AuthProvider>
                <PokemonDataProvider> {/* Wrap the Router with PokemonDataProvider */}
                    <Router>
                        <div className="App">
                            <Navbar />
                            <main>
                                <Routes>
                                    <Route path="/" element={<MainButtons />} />
                                    <Route path="/collect" element={<Collect />} /> {/* Collect will now have access to PokemonDataContext */}
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/account" element={<Account />} />
                                </Routes>
                            </main>
                        </div>
                    </Router>
                </PokemonDataProvider>
            </AuthProvider>
        </CacheContext.Provider>
    );
}

export default App;
