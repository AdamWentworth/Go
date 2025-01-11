// App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MainButtons from './components/MainButtons';
import Collect from './features/Collect/Collect';
import Login from './features/Authentication/Login';
import Register from './features/Authentication/Register';
import Account from './features/Authentication/Account';
import Discover from './features/Discover/Discover';
import Trades from './features/Trades/Trades';
import './App.css';
import CacheContext from './contexts/CacheContext';
import { AuthProvider } from './contexts/AuthContext';
import { EventsProvider } from './contexts/EventsContext';
import { PokemonDataProvider } from './contexts/PokemonDataContext';
import { LocationProvider } from './contexts/LocationContext';
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import { SessionProvider } from './contexts/SessionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserSearchProvider } from './contexts/UserSearchContext';
import { TradeDataProvider } from './contexts/TradeDataContext';
import { ModalProvider } from './contexts/ModalContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const cache = new Map();

    return (
        <CacheContext.Provider value={cache}>
            <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
                <GlobalStateProvider>
                    <SessionProvider>
                        <PokemonDataProvider>
                            <TradeDataProvider>
                                <AuthProvider>
                                    <EventsProvider>
                                        <LocationProvider>
                                            <ThemeProvider>
                                                <UserSearchProvider>
                                                    <ModalProvider>
                                                        <div className="App">
                                                            <Navbar />
                                                            <main>
                                                                <Routes>
                                                                    <Route path="/" element={<MainButtons />} />
                                                                    <Route path="/collect" element={<Collect isOwnCollection={true} />} />
                                                                    <Route path="/trades" element={<Trades />} />
                                                                    <Route path="/login" element={<Login />} />
                                                                    <Route path="/register" element={<Register />} />
                                                                    <Route path="/account" element={<Account />} />
                                                                    <Route path="/discover" element={<Discover />} />
                                                                    <Route path="/collection/:username" element={<Collect isOwnCollection={false} />} />
                                                                </Routes>
                                                            </main>
                                                            <ToastContainer
                                                                position="top-center"
                                                                autoClose={5000}
                                                                hideProgressBar={false}
                                                                newestOnTop={false}
                                                                closeOnClick
                                                                rtl={false}
                                                                pauseOnFocusLoss
                                                                draggable
                                                                pauseOnHover
                                                                />
                                                        </div>
                                                    </ModalProvider>
                                                </UserSearchProvider>
                                            </ThemeProvider>
                                        </LocationProvider>
                                    </EventsProvider>
                                </AuthProvider>
                            </TradeDataProvider>
                        </PokemonDataProvider>
                    </SessionProvider>
                </GlobalStateProvider>
            </Router>
        </CacheContext.Provider>
    );
}

export default App;
