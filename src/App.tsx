import { useState, useEffect, useMemo } from 'react';
import type {
  PageView,
  Role,
  Venue,
  BookingRequest,
  BookingStatus,
  VenueFilterState,
  EventParameters,
  AppNotification,
} from './types';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { VenuesPage } from './pages/VenuesPage';
import { VenueDetailPage } from './pages/VenueDetailPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { INITIAL_FILTERS } from './utils/filterVenues';
import { INITIAL_EVENT_PARAMS } from './utils/checkVenueFit';
import {
  getStoredVenues,
  saveStoredVenues,
  getStoredRequests,
  saveStoredRequests,
  getStoredRole,
  saveStoredRole,
  getStoredNotifications,
  saveStoredNotifications,
  resetToDemoDefaults,
} from './services/storage';
import { CheckCircle2, X } from 'lucide-react';
import './App.css';

function getRouteState(): { page: PageView; venueId: string | null } {
  if (typeof window === 'undefined') return { page: 'home', venueId: null };
  const hash = window.location.hash.replace('#', '');
  const path = window.location.pathname.replace(/^\//, '');

  if (hash.startsWith('venue-detail:')) {
    const id = hash.replace('venue-detail:', '');
    return { page: 'venue-detail', venueId: id };
  }
  if (path.startsWith('venues/') && path.length > 7) {
    const id = path.replace('venues/', '');
    return { page: 'venue-detail', venueId: id };
  }
  const target = hash || path;
  if (target.startsWith('venues')) return { page: 'venues', venueId: null };
  if (target.startsWith('staff')) return { page: 'staff', venueId: null };
  return { page: 'home', venueId: null };
}

export function App() {
  const [routeState, setRouteState] = useState(() => getRouteState());
  const [currentRole, setCurrentRole] = useState<Role>(() => getStoredRole());
  const [venues, setVenues] = useState<Venue[]>(() => getStoredVenues());
  const [requests, setRequests] = useState<BookingRequest[]>(() => getStoredRequests());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getStoredNotifications());
  const [filters, setFilters] = useState<VenueFilterState>(INITIAL_FILTERS);
  const [eventParams, setEventParams] = useState<EventParameters>(INITIAL_EVENT_PARAMS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      setRouteState(getRouteState());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: PageView) => {
    let targetPage = page;
    if (currentRole === 'organizer' && page === 'staff') {
      targetPage = 'venues';
    } else if (currentRole === 'staff' && (page === 'venues' || page === 'venue-detail')) {
      targetPage = 'staff';
    }

    if (targetPage === 'venue-detail') {
      setRouteState((prev) => ({ ...prev, page: 'venue-detail' }));
      return;
    }
    setRouteState({ page: targetPage, venueId: null });
    if (typeof window !== 'undefined') {
      window.location.hash = targetPage;
    }
  };

  const handleSelectVenue = (venueId: string) => {
    if (currentRole === 'staff') {
      handleNavigate('staff');
      return;
    }
    setRouteState({ page: 'venue-detail', venueId });
    if (typeof window !== 'undefined') {
      window.location.hash = `venue-detail:${venueId}`;
    }
  };

  const handleBackToVenues = () => {
    setRouteState({ page: 'venues', venueId: null });
    if (typeof window !== 'undefined') {
      window.location.hash = 'venues';
    }
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    showToast('Filters reset to default.');
  };

  const handleResetEventParams = () => {
    setEventParams(INITIAL_EVENT_PARAMS);
    showToast('Event parameters reset to default.');
  };

  // Sync role changes to persistent storage and navigate to corresponding portal
  const handleRoleChange = (newRole: Role) => {
    setCurrentRole(newRole);
    saveStoredRole(newRole);
    const targetPage = newRole === 'staff' ? 'staff' : 'venues';
    setRouteState({ page: targetPage, venueId: null });
    showToast(
      newRole === 'organizer'
        ? 'Switched to Organizer role. Viewing available venues and booking tools.'
        : 'Switched to Institution Staff role. Viewing Staff Dashboard and venue management.'
    );
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleMarkNotificationRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveStoredNotifications(updated);
    showToast('All notifications marked as read.');
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    saveStoredNotifications([]);
    showToast('Notifications cleared.');
  };

  const handleSelectNotification = (notif: AppNotification) => {
    if (notif.requestId) {
      if (currentRole === 'staff') {
        handleNavigate('staff');
      } else if (notif.venueId) {
        handleSelectVenue(notif.venueId);
      }
    }
  };

  const handleCreateBookingRequest = (newRequest: BookingRequest | BookingRequest[]) => {
    const toAdd = Array.isArray(newRequest) ? newRequest : [newRequest];
    const updated = [...toAdd, ...requests];
    setRequests(updated);
    saveStoredRequests(updated);

    const first = toAdd[0];
    if (toAdd.length > 1) {
      showToast(`Submitted recurring series (${toAdd.length} sessions)! Reference: ${first.seriesId}`);
      addNotification({
        title: `Recurring Series Submitted: ${first.eventName}`,
        message: `Your ${toAdd.length}-session booking request was received with reference ${first.seriesId}.`,
        type: 'pending',
        targetRole: 'all',
        requestId: first.id,
        venueId: first.venueId,
      });
    } else {
      showToast(`Booking request submitted! Reference: ${first.id}`);
      addNotification({
        title: `Booking Request Submitted: ${first.eventName}`,
        message: `Submitted request for ${first.date} (${first.startTime}–${first.endTime}). Awaiting staff review.`,
        type: 'pending',
        targetRole: 'all',
        requestId: first.id,
        venueId: first.venueId,
      });
    }
  };

  const handleUpdateRequestStatus = (
    requestId: string,
    status: BookingStatus,
    staffNote?: string
  ) => {
    const updated = requests.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status,
          staffNote: staffNote !== undefined ? staffNote : r.staffNote,
        };
      }
      return r;
    });
    setRequests(updated);
    saveStoredRequests(updated);

    const targetReq = requests.find((r) => r.id === requestId);
    const eventTitle = targetReq ? targetReq.eventName : 'Booking';

    if (status === 'Approved') {
      showToast(`Approved "${eventTitle}". Slot confirmed.`);
      addNotification({
        title: `Booking Approved: ${eventTitle}`,
        message: `Your booking for "${eventTitle}" on ${targetReq?.date} (${targetReq?.startTime}–${targetReq?.endTime}) was approved!`,
        type: 'approved',
        targetRole: 'organizer',
        requestId,
        venueId: targetReq?.venueId,
      });
    } else if (status === 'Declined') {
      showToast(`Declined "${eventTitle}".`);
      addNotification({
        title: `Booking Declined: ${eventTitle}`,
        message: staffNote ? `Declined: ${staffNote}` : `Booking request for "${eventTitle}" was declined by staff.`,
        type: 'declined',
        targetRole: 'organizer',
        requestId,
        venueId: targetReq?.venueId,
      });
    } else if (status === 'Cancelled') {
      showToast(`Cancelled "${eventTitle}". Venue slot released.`);
      addNotification({
        title: `Booking Cancelled: ${eventTitle}`,
        message: `Reservation for "${eventTitle}" was cancelled and the venue slot has been released.`,
        type: 'info',
        targetRole: 'all',
        requestId,
        venueId: targetReq?.venueId,
      });
    } else if (status === 'Pending') {
      showToast(`Reopened "${eventTitle}" as Pending.`);
    } else {
      showToast(`Updated "${eventTitle}".`);
    }
  };

  const handleSaveVenue = (savedVenue: Venue) => {
    const existingIndex = venues.findIndex((v) => v.id === savedVenue.id);
    let updated: Venue[];
    if (existingIndex >= 0) {
      updated = venues.map((v) => (v.id === savedVenue.id ? savedVenue : v));
      showToast(`Updated facility: "${savedVenue.name}".`);
    } else {
      updated = [savedVenue, ...venues];
      showToast(`Published new facility: "${savedVenue.name}".`);
    }
    setVenues(updated);
    saveStoredVenues(updated);
  };

  const handleDeleteVenue = (venueId: string) => {
    const target = venues.find((v) => v.id === venueId);
    const updated = venues.filter((v) => v.id !== venueId);
    setVenues(updated);
    saveStoredVenues(updated);
    showToast(`Deleted facility: "${target ? target.name : venueId}".`);
  };

  const handleResetData = () => {
    const defaults = resetToDemoDefaults();
    setVenues(defaults.venues);
    setRequests(defaults.requests);
    setCurrentRole(defaults.role);
    setNotifications(defaults.notifications);
    setFilters(INITIAL_FILTERS);
    setEventParams(INITIAL_EVENT_PARAMS);
    setRouteState({ page: 'home', venueId: null });
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

  const effectivePage: PageView = useMemo(() => {
    if (currentRole === 'organizer' && routeState.page === 'staff') return 'venues';
    if (currentRole === 'staff' && (routeState.page === 'venues' || routeState.page === 'venue-detail')) return 'staff';
    return routeState.page;
  }, [currentRole, routeState.page]);

  const selectedVenue = routeState.venueId
    ? venues.find((v) => v.id === routeState.venueId)
    : undefined;

  return (
    <>
      {/* Accessible Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Main Layout Shell */}
      <Layout
        currentPage={effectivePage}
        onNavigate={handleNavigate}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onResetData={handleResetData}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearNotifications={handleClearNotifications}
        onSelectNotification={handleSelectNotification}
      >
        {effectivePage === 'home' && (
          <HomePage
            venues={venues}
            onNavigate={handleNavigate}
            onSelectVenue={handleSelectVenue}
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
          />
        )}

        {effectivePage === 'venues' && (
          <VenuesPage
            venues={venues}
            currentRole={currentRole}
            onSelectVenue={handleSelectVenue}
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
            eventParams={eventParams}
            onEventParamsChange={setEventParams}
            onResetEventParams={handleResetEventParams}
          />
        )}

        {effectivePage === 'venue-detail' && (
          <VenueDetailPage
            venue={selectedVenue}
            currentRole={currentRole}
            onBack={handleBackToVenues}
            onRoleChange={handleRoleChange}
            eventParams={eventParams}
            onEventParamsChange={setEventParams}
            existingRequests={requests}
            onRequestSubmit={handleCreateBookingRequest}
          />
        )}

        {effectivePage === 'staff' && (
          <StaffDashboardPage
            venues={venues}
            requests={requests}
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
            onUpdateRequestStatus={handleUpdateRequestStatus}
            onSaveVenue={handleSaveVenue}
            onDeleteVenue={handleDeleteVenue}
            onResetData={handleResetData}
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
