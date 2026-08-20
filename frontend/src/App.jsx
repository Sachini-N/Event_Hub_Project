import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import WhyJoinSection from './components/WhyJoinSection';
import UpcomingEventsSection from './components/UpcomingEventsSection';
import UpcomingEventsPage from './components/UpcomingEventsPage';
import EventDetailsPage from './components/EventDetailsPage';
import MyEventsPage from './components/MyEventsPage';
import ProfilePage from './components/ProfilePage';
import CalendarPage from './components/CalendarPage';
import AdminDashboardPage from './components/AdminDashboardPage';
import PastEventsSection from './components/PastEventsSection';
import PastEventDetailsPage from './components/PastEventDetailsPage';
import VenuesPage from './components/VenuesPage';
import Footer from './components/Footer';

import RegistrationModal from './components/modals/RegistrationModal';
import ConfirmationModal from './components/modals/ConfirmationModal';
import LightboxModal from './components/modals/LightboxModal';
import MyRegistrationsModal from './components/modals/MyRegistrationsModal';
import AdminModal from './components/modals/AdminModal';
import LoginModal from './components/modals/LoginModal';
import SignupModal from './components/modals/SignupModal';
import ToastNotification from './components/modals/ToastNotification';

export default function App() {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected event for full page details
  const [selectedDetailsEvent, setSelectedDetailsEvent] = useState(null);
  const [selectedPastEvent, setSelectedPastEvent] = useState(null);

  // Auth State
  const [token, setToken] = useState(() => localStorage.getItem('eventhub_token') || null);
  const [currentUser, setCurrentUser] = useState(null);

  // Modals State
  const [regEvent, setRegEvent] = useState(null);
  const [confData, setConfData] = useState(null);
  const [lightboxData, setLightboxData] = useState(null); // { event, index }
  const [showMyRegs, setShowMyRegs] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'info' });
    }, 4000);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events');
      const result = await response.json();
      if (result.success) {
        setEvents(result.data || []);
      } else {
        showToast(result.message || 'Failed to load events', 'error');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      showToast('Failed to connect to event server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkAuthStatus = async (authToken) => {
    if (!authToken) {
      setCurrentUser(null);
      return;
    }
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const result = await response.json();
      if (result.success && result.data) {
        setCurrentUser(result.data);
      } else {
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('eventhub_token');
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('eventhub_token');
    }
  };

  useEffect(() => {
    fetchEvents();
    checkAuthStatus(token);
  }, []);

  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setCurrentUser(data.user);
    localStorage.setItem('eventhub_token', data.token);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('eventhub_token');
    showToast('Logged out successfully.');
  };

  const openEventDetails = (evt) => {
    setSelectedDetailsEvent(evt);
    setActiveTab('event-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToHero = () => {
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToEvents = (tabName = 'upcoming') => {
    setActiveTab(tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const focusSearch = () => {
    scrollToEvents('upcoming');
    setTimeout(() => {
      const input = document.getElementById('filter-search') || document.getElementById('search-input');
      if (input) input.focus();
    }, 100);
  };

  const hideHeaderFooter = activeTab === 'event-details' || activeTab === 'admin';

  return (
    <div className="app-root">
      {!hideHeaderFooter && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          scrollToHero={scrollToHero}
          scrollToEvents={scrollToEvents}
          focusSearch={focusSearch}
          currentUser={currentUser}
          logout={handleLogout}
          openLoginModal={() => setShowLogin(true)}
          openSignupModal={() => setShowSignup(true)}
          openAdminModal={() => {
            setActiveTab('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          openMyRegistrationsModal={() => {
            setActiveTab('my-events');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      <main className="main-content">
        {activeTab === 'home' && (
          <>
            <HeroSection scrollToEvents={scrollToEvents} />
            <WhyJoinSection />
            <UpcomingEventsSection
              events={events}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loading={loading}
              openRegistrationModal={openEventDetails}
              openGalleryLightbox={(evt, index) => setLightboxData({ event: evt, index })}
            />
            <PastEventsSection
              events={events}
              setActiveTab={setActiveTab}
              onSelectPastEvent={(evt) => {
                setSelectedPastEvent(evt);
                setActiveTab('past-details');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        )}

        {activeTab === 'upcoming' && (
          <UpcomingEventsPage
            events={events}
            loading={loading}
            openRegistrationModal={openEventDetails}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'past' && (
          <PastEventsSection
            events={events}
            setActiveTab={setActiveTab}
            isFullView={true}
            onSelectPastEvent={(evt) => {
              setSelectedPastEvent(evt);
              setActiveTab('past-details');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'past-details' && (
          <PastEventDetailsPage
            event={selectedPastEvent}
            onBack={() => setActiveTab('past')}
            showToast={showToast}
            onOpenGalleryLightbox={(evt, index) => setLightboxData({ event: evt, index })}
          />
        )}

        {activeTab === 'event-details' && (
          <EventDetailsPage
            event={selectedDetailsEvent}
            onBack={() => setActiveTab('upcoming')}
            currentUser={currentUser}
            onRegistrationSuccess={(data) => {
              fetchEvents();
            }}
            onOpenMyEvents={() => setActiveTab('my-events')}
            showToast={showToast}
          />
        )}

        {activeTab === 'my-events' && (
          <MyEventsPage
            currentUser={currentUser}
            onViewEvent={openEventDetails}
            showToast={showToast}
            openLoginModal={() => setShowLogin(true)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            token={token}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            logout={() => {
              handleLogout();
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            showToast={showToast}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarPage
            currentUser={currentUser}
            onSelectEvent={openEventDetails}
            onOpenUpcoming={() => setActiveTab('upcoming')}
            showToast={showToast}
            openLoginModal={() => setShowLogin(true)}
          />
        )}

        {activeTab === 'venues-page' && (
          <VenuesPage showToast={showToast} />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardPage
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            token={token}
            setToken={setToken}
            logout={() => {
              handleLogout();
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            openCreateEventModal={() => setShowAdmin(true)}
            showToast={showToast}
          />
        )}
      </main>

      {!hideHeaderFooter && <Footer />}

      {/* Modals */}
      <RegistrationModal
        isOpen={Boolean(regEvent)}
        onClose={() => setRegEvent(null)}
        event={regEvent}
        currentUser={currentUser}
        onSuccess={(data) => {
          setConfData(data);
          fetchEvents(); // refresh counts
        }}
        showToast={showToast}
      />

      <ConfirmationModal
        isOpen={Boolean(confData)}
        onClose={() => setConfData(null)}
        registrationData={confData}
        showToast={showToast}
      />

      <LightboxModal
        isOpen={Boolean(lightboxData)}
        onClose={() => setLightboxData(null)}
        event={lightboxData?.event}
        initialIndex={lightboxData?.index || 0}
      />

      <MyRegistrationsModal
        isOpen={showMyRegs}
        onClose={() => setShowMyRegs(false)}
        showToast={showToast}
      />

      <AdminModal
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
        onEventCreated={fetchEvents}
        showToast={showToast}
      />

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleAuthSuccess}
        switchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
        showToast={showToast}
      />

      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSignupSuccess={handleAuthSuccess}
        switchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
        showToast={showToast}
      />

      <ToastNotification toast={toast} />
    </div>
  );
}
