// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home'; // Import Home instead of MainButtons
import Pokemon from './pages/Pokemon/Pokemon';
import Login from './pages/Authentication/Login';
import Register from './pages/Authentication/Register';
import Account from './pages/Authentication/Account';
import Search from './pages/Search/Search';
import Trades from './pages/Trades/Trades';
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
                        <ModalProvider>
                          <UserSearchProvider>
                            <div className="App">
                              <main>
                                <Routes>
                                  {/* Updated Home route */}
                                  <Route path="/" element={<Home />} />
                                  <Route path="/pokemon" element={<Pokemon isOwnCollection={true} />} />
                                  <Route path="/trades" element={<Trades />} />
                                  <Route path="/login" element={<Login />} />
                                  <Route path="/register" element={<Register />} />
                                  <Route path="/account" element={<Account />} />
                                  <Route path="/search" element={<Search />} />
                                  <Route path="/pokemon/:username" element={<Pokemon isOwnCollection={false} />} />
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
                          </UserSearchProvider>
                        </ModalProvider>
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
