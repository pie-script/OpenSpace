import { useState, useEffect } from 'react';
import type { PageView, Role, Venue, BookingRequest } from './types';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { VenuesPage } from './pages/VenuesPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import {
  getStoredVenues,
  getStoredRequests,
  getStoredRole,
  saveStoredRole,
  resetToDemoDefaults,
} from './services/storage';
import { CheckCircle2, X } from 'lucide-react';
import './App.css';

function getPageFromLocation(): PageView {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash === 'venues') return 'venues';
  if (hash === 'staff') return 'staff';
  return 'home';
}

export function App() {
  const [currentPage, setCurrentPage] = useState<PageView>(() => getPageFromLocation());
  const [currentRole, setCurrentRole] = useState<Role>(() => getStoredRole());
  const [venues, setVenues] = useState<Venue[]>(() => getStoredVenues());
  const [requests, setRequests] = useState<BookingRequest[]>(() => getStoredRequests());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromLocation());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: PageView) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.location.hash = page;
    }
  };

  // Sync role changes to persistent storage
  const handleRoleChange = (newRole: Role) => {
    setCurrentRole(newRole);
    saveStoredRole(newRole);
    showToast(
      newRole === 'organizer'
        ? 'Switched to Organizer role. You can explore venues and test fit checks.'
        : 'Switched to Institution Staff role. You can manage facilities and approve requests.'
    );
  };

  const handleResetData = () => {
    const defaults = resetToDemoDefaults();
    setVenues(defaults.venues);
    setRequests(defaults.requests);
    setCurrentRole(defaults.role);
    showToast('Demo data reset: Original sample venues, requests, and roles restored.');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  return (
    <>
      {/* Accessible Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Main Layout Shell */}
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onResetData={handleResetData}
      >
        {currentPage === 'home' && (
          <HomePage
            venues={venues}
            onNavigate={handleNavigate}
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
          />
        )}

        {currentPage === 'venues' && (
          <VenuesPage
            venues={venues}
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
          />
        )}

        {currentPage === 'staff' && (
          <StaffDashboardPage
            venues={venues}
            requests={requests}
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
          />
        )}
      </Layout>

      {/* Toast Notification */}
      {toastMessage && (
        <aside className="toast-notification" role="status" aria-live="polite">
          <CheckCircle2 size={18} className="toast-notification__icon" />
          <span className="toast-notification__text">{toastMessage}</span>
          <button
            type="button"
            className="toast-notification__close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </aside>
      )}
    </>
  );
}

export default App;
