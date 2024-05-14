// App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MainButtons from './components/MainButtons';
import Collect from './components/Collect/Collect';
import Login from './components/Authentication/Login';
import Register from './components/Authentication/Register';
import Account from './components/Authentication/Account'; // Import the Account component
import './App.css';
import CacheContext from './contexts/CacheContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
    const cache = new Map();

    return (
        <CacheContext.Provider value={cache}>
            <AuthProvider>
                <Router>
                    <div className="App">
                        <Navbar />
                        <main>
                            <Routes>
                                <Route path="/" element={<MainButtons />} />
                                <Route path="/collect" element={<Collect />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/account" element={<Account />} /> {/* Add the route for the Account page */}
                            </Routes>
                        </main>
                    </div>
                </Router>
            </AuthProvider>
        </CacheContext.Provider>
    );
}

export default App;

