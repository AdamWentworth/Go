// src/App.tsx

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import AppProviders  from './AppProviders';
import AppBootstrap  from './AppBootstrap';
import ActionMenu from './components/ActionMenu';
import PerfTelemetryPanel from './components/dev/PerfTelemetryPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { ContextBackProvider } from './contexts/ContextBackContext';
import {
  AppLoadingFallback,
  AppLoadingProvider,
} from './contexts/AppLoadingContext';

const Home = lazy(() => import('./pages/Home/Home'));
const Pokedex = lazy(() => import('./pages/Pokedex/Pokedex'));
const Pokemon = lazy(() => import('./pages/Pokemon/Pokemon'));
const Raid = lazy(() => import('./pages/Raid/Raid'));
const RaidMethodology = lazy(() => import('./pages/Raid/RaidMethodology'));
const Max = lazy(() => import('./pages/Max/Max'));
const Pvp = lazy(() => import('./pages/Pvp/Pvp'));
const PvpMethodology = lazy(() => import('./pages/Pvp/PvpMethodology'));
const Login = lazy(() => import('./pages/Authentication/Login'));
const Register = lazy(() => import('./pages/Authentication/Register'));
const Account = lazy(() => import('./pages/Authentication/Account'));
const Search = lazy(() => import('./pages/Search/Search'));
const Trades = lazy(() => import('./pages/Trades/Trades'));

export const AppRouteFallback: React.FC = () => (
  <AppLoadingFallback source="route" />
);

const AppContent: React.FC = () => (
  <div className="App">
    <main>
      <Suspense fallback={<AppRouteFallback />}>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/pokedex"      element={<Pokedex />} />
          <Route path="/pokemon"      element={<Pokemon isOwnCollection />} />
          <Route path="/raid"         element={<Raid />} />
          <Route path="/raid/methodology" element={<RaidMethodology />} />
          <Route path="/max"          element={<Max />} />
          <Route path="/pvp"          element={<Pvp />} />
          <Route path="/pvp/methodology" element={<PvpMethodology />} />
          <Route path="/trades"       element={<Trades />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/account"      element={<Account />} />
          <Route path="/search"       element={<Search />} />
          <Route path="/pokemon/:username" element={<Pokemon isOwnCollection={false} />} />
        </Routes>
      </Suspense>
    </main>

    <ActionMenu />
    <ToastContainer position="top-center" autoClose={5000} />
  </div>
);

const App: React.FC = () => (
  <Router>
    <ContextBackProvider>
      <AppLoadingProvider>
        <AppProviders>
          <AppBootstrap />
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
          <PerfTelemetryPanel />
        </AppProviders>
      </AppLoadingProvider>
    </ContextBackProvider>
  </Router>
);

export default App;
