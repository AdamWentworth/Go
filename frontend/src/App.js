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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const cache = new Map();

    return (
        <CacheContext.Provider value={cache}>
            <Router>
                <AuthProvider>
                    <PokemonDataProvider>
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
                        <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
                    </PokemonDataProvider>
                </AuthProvider>
            </Router>
        </CacheContext.Provider>
    );
}

export default App;