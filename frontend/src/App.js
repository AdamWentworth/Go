// App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MainButtons from './components/MainButtons';
import Collect from './features/Collect/Collect';
import Login from './features/Authentication/Login';
import Register from './features/Authentication/Register';
import Account from './features/Authentication/Account';
import Raid from './features/Raid/Raid';
import Discover from './features/Discover/Discover';
import './App.css';
import CacheContext from './contexts/CacheContext';
import { AuthProvider } from './contexts/AuthContext';
import { PokemonDataProvider } from './contexts/PokemonDataContext';
import { LocationProvider } from './contexts/LocationContext';
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import { ThemeProvider } from './contexts/ThemeContext';  // Make sure this import matches the actual path
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const cache = new Map();

    return (
        <CacheContext.Provider value={cache}>
            <Router>
                <GlobalStateProvider>
                    <PokemonDataProvider>
                        <AuthProvider>
                            <LocationProvider>
                                <ThemeProvider>
                                    <div className="App">
                                        <Navbar />
                                        <main>
                                            <Routes>
                                                <Route path="/" element={<MainButtons />} />
                                                <Route path="/collect" element={<Collect />} />
                                                <Route path="/login" element={<Login />} />
                                                <Route path="/register" element={<Register />} />
                                                <Route path="/account" element={<Account />} />
                                                {/* <Route path="/raid" element={<Raid />} /> */}
                                                <Route path="/discover" element={<Discover />} />
                                            </Routes>
                                        </main>
                                        <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
                                    </div>
                                </ThemeProvider>
                            </LocationProvider>
                        </AuthProvider>
                    </PokemonDataProvider>
                </GlobalStateProvider>
            </Router>
        </CacheContext.Provider>
    );
}

export default App;