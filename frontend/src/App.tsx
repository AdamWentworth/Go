// src/App.tsx

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import AppProviders  from './AppProviders';
import AppBootstrap  from './AppBootstrap';
import PerfTelemetryPanel from './components/dev/PerfTelemetryPanel';
import ErrorBoundary from './components/ErrorBoundary';

const Home = lazy(() => import('./pages/Home/Home'));
const Pokemon = lazy(() => import('./pages/Pokemon/Pokemon'));
const Login = lazy(() => import('./pages/Authentication/Login'));
const Register = lazy(() => import('./pages/Authentication/Register'));
const Account = lazy(() => import('./pages/Authentication/Account'));
const Search = lazy(() => import('./pages/Search/Search'));
const Trades = lazy(() => import('./pages/Trades/Trades'));

const AppContent: React.FC = () => (
  <div className="App">
    <main>
      <Suspense fallback={<div>Loading...</div>}>
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
      </Suspense>
    </main>

    <ToastContainer position="top-center" autoClose={5000} />
  </div>
);

const App: React.FC = () => (
  <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
    <AppProviders>
      <AppBootstrap />
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
      <PerfTelemetryPanel />
    </AppProviders>
  </Router>
);

export default App;

