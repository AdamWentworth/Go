import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/navbar';
import MainButtons from './components/mainButtons';
import PokemonList from './components/PokemonList/pokemonList';
import './App.css';

function App() {
    return (
        <div className="App">
            <Navbar />
            <main>
                <Router>
                    <Routes>
                        <Route path="/" element={<MainButtons />} />
                        <Route path="/pokemon" element={<PokemonList />} />
                    </Routes>
                </Router>
            </main>
        </div>
    );
}

export default App;
