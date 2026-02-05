import { Routes, Route, NavLink } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import EventsList from './pages/EventsList';
import EventDetail from './pages/EventDetail';
import Zeiterfassung from './pages/Zeiterfassung';
import LohnMitarbeiter from './pages/LohnMitarbeiter';

function App() {
  return (
    <ErrorBoundary>
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav
        style={{
          width: 180,
          padding: 16,
          background: '#fff',
          borderRight: '1px solid #e0e0e0',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>DB Viewer</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li style={{ marginBottom: 4 }}>
            <NavLink
              to="/events"
              style={({ isActive }) => ({
                display: 'block',
                padding: '8px 12px',
                borderRadius: 4,
                background: isActive ? '#e8f0fe' : 'transparent',
                color: isActive ? '#1967d2' : '#1a1a1a',
              })}
            >
              Events
            </NavLink>
          </li>
          <li style={{ marginBottom: 4 }}>
            <NavLink
              to="/zeiterfassung"
              style={({ isActive }) => ({
                display: 'block',
                padding: '8px 12px',
                borderRadius: 4,
                background: isActive ? '#e8f0fe' : 'transparent',
                color: isActive ? '#1967d2' : '#1a1a1a',
              })}
            >
              Zeiterfassung
            </NavLink>
          </li>
          <li style={{ marginBottom: 4 }}>
            <NavLink
              to="/lohn-mitarbeiter"
              style={({ isActive }) => ({
                display: 'block',
                padding: '8px 12px',
                borderRadius: 4,
                background: isActive ? '#e8f0fe' : 'transparent',
                color: isActive ? '#1967d2' : '#1a1a1a',
              })}
            >
              Lohn & Mitarbeiter
            </NavLink>
          </li>
        </ul>
      </nav>
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<EventsList />} />
          <Route path="/events" element={<EventsList />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/zeiterfassung" element={<Zeiterfassung />} />
          <Route path="/lohn-mitarbeiter" element={<LohnMitarbeiter />} />
        </Routes>
      </main>
    </div>
    </ErrorBoundary>
  );
}

export default App;
