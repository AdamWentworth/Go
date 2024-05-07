import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MainButtons from './components/MainButtons';
import PokemonList from './components/PokemonList/PokemonList';
import Login from './components/Authentication/Login';  // Ensure this is the correct path
import Register from './components/Authentication/Register';  // Ensure this is the correct path
import './App.css';
import CacheContext from './contexts/cacheContext';

function App() {
    const cache = new Map();

    return (
        <CacheContext.Provider value={cache}>
        <Router> {/* Move Router to encompass the entire App component including Navbar */}
            <div className="App">
                <Navbar />
                <main>
                    <Routes>
                        <Route path="/" element={<MainButtons />} />
                        <Route path="/pokemon" element={<PokemonList />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </main>
            </div>
        </Router>
        </CacheContext.Provider>
    );
}

export default App;
