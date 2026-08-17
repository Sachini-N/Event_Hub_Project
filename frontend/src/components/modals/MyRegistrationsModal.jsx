import React, { useState } from 'react';

export default function MyRegistrationsModal({ isOpen, onClose, showToast }) {
  const [email, setEmail] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter an email address', 'error');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`/api/registrations/user/${encodeURIComponent(email.trim())}`);
      const result = await response.json();

      if (result.success) {
        setTickets(result.data || []);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error looking up tickets:', error);
      showToast('Failed to fetch tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadIcs = (reg) => {
    const eventDate = new Date(reg.eventDate);
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const startDateStr = formatDate(eventDate);
    const endDateStr = formatDate(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000));

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventHub Community//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${reg.ticketId}@eventhub.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${startDateStr}`,
      `DTEND:${endDateStr}`,
      `SUMMARY:${reg.eventTitle}`,
      `DESCRIPTION:Registered Event Ticket | Pass: ${reg.ticketId}`,
      `LOCATION:${reg.eventLocation}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: 1 Day until ${reg.eventTitle}`,
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${reg.eventTitle.replace(/\s+/g, '_')}_Reminder.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Downloaded Calendar Invite (.ics)', 'success');
  };

  return (
    <div class="modal-overlay" onClick={onClose}>
      <div class="modal-card" onClick={(e) => e.stopPropagation()}>
        <button class="modal-close" onClick={onClose}>
          <i class="fa-solid fa-xmark"></i>
        </button>

        <h2><i class="fa-solid fa-ticket"></i> Find My Registrations</h2>
        <p class="modal-sub">Enter your email address to view all your registered event tickets and calendar invites.</p>

        <form className="search-form" onSubmit={handleLookup} style={{ display: 'flex', gap: '0.5rem', margin: '1.25rem 0' }}>
          <input
            type="email"
            placeholder="Enter your email address..."
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-blue-pill" disabled={loading}>
            <i className="fa-solid fa-magnifying-glass"></i> Search
          </button>
        </form>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Searching tickets...</p>
          </div>
        )}

        {!loading && searched && tickets.length === 0 && (
          <p className="modal-sub">No registrations found for <strong>{email}</strong>.</p>
        )}

        {!loading && tickets.length > 0 && (
          <div className="registrations-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tickets.map((reg) => {
              const formattedDate = new Date(reg.eventDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={reg._id}
                  className="ticket-item"
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div class="ticket-info">
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{reg.eventTitle}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <i class="fa-regular fa-calendar"></i> {formattedDate} | Pass ID: <strong>{reg.ticketId}</strong>
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <i class="fa-solid fa-location-dot"></i> {reg.eventLocation}
                    </p>
                  </div>
                  <button class="btn btn-sm btn-outline" onClick={() => downloadIcs(reg)}>
                    <i class="fa-regular fa-calendar-plus"></i> .ics
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
