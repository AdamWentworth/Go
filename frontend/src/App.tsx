// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home     from './pages/Home/Home';
import Pokemon  from './pages/Pokemon/Pokemon';
import Login    from './pages/Authentication/Login';
import Register from './pages/Authentication/Register';
import Account  from './pages/Authentication/Account';
import Search   from './pages/Search/Search';
import Trades   from './pages/Trades/Trades';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import AppProviders  from './AppProviders';
import AppBootstrap  from './AppBootstrap';

const AppContent: React.FC = () => (
  <div className="App">
    <main>
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/pokemon"      element={<Pokemon isOwnCollection />} />
        <Route path="/trades"       element={<Trades />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />
        <Route path="/account"      element={<Account />} />
        <Route path="/search"       element={<Search />} />
        <Route path="/pokemon/:username" element={<Pokemon isOwnCollection={false} />} />
      </Routes>
    </main>

    <ToastContainer position="top-center" autoClose={5000} />
  </div>
);

const App: React.FC = () => (
  <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
    <AppProviders>
      <AppBootstrap />
      <AppContent />
    </AppProviders>
  </Router>
);

export default App;

