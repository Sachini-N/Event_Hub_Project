/**
 * Calculates the exact end DateTime of an event based on its date and time string.
 * @param {Date|string} dateVal - Event date (e.g. '2026-08-25' or ISO string)
 * @param {string} timeStr - Event time string (e.g. '09:00 AM - 11:30 AM', '14:00', '2:30 PM')
 * @returns {Date} - Exact End Date & Time
 */
export function getEventEndDateTime(dateVal, timeStr) {
  if (!dateVal) return new Date();

  let year, month, day;

  if (typeof dateVal === 'string') {
    const cleanDateStr = dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
  }

  if (year === undefined || isNaN(year)) {
    const d = new Date(dateVal);
    year = d.getFullYear();
    month = d.getMonth();
    day = d.getDate();
  }

  let hours = 23;
  let minutes = 59;
  let seconds = 59;

  if (timeStr && typeof timeStr === 'string' && timeStr.trim().length > 0) {
    let targetTime = timeStr.trim();
    const hasRange = targetTime.includes('-') || targetTime.toLowerCase().includes(' to ');

    if (targetTime.includes('-')) {
      const splitTime = targetTime.split('-');
      targetTime = splitTime[1].trim();
    } else if (targetTime.toLowerCase().includes(' to ')) {
      const splitTime = targetTime.toLowerCase().split(' to ');
      targetTime = splitTime[1].trim();
    }

    const timeMatch = targetTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      let m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;

      // If single start time provided (no range), default duration is 2 hours
      if (!hasRange) {
        h += 2;
      }

      hours = h;
      minutes = m;
      seconds = 0;
    }
  }

  return new Date(year, month, day, hours, minutes, seconds);
}

/**
 * Checks if an event is in the past (i.e. its set date and time have finished).
 * @param {Object} event - Event object with date, time, status
 * @returns {boolean} - True if event date & time are finished
 */
export function isEventPast(event) {
  if (!event) return false;
  if (event.status === 'past') return true;
  if (event.status === 'draft') return false;
  if (!event.date) return false;

  const endDateTime = getEventEndDateTime(event.date, event.time);
  return new Date() > endDateTime;
}

/**
 * Strips HTML tags and decodes entities to return clean plain text for previews.
 * @param {string} html - HTML string or plain text
 * @returns {string} - Clean plain text
 */
export function stripHtml(html) {
  if (!html) return '';
  const str = String(html);
  if (!/<[a-z][\s\S]*>/i.test(str)) {
    return str;
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return (doc.body.textContent || doc.body.innerText || '').replace(/\s+/g, ' ').trim();
  } catch (e) {
    return str.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Broadcasts an event change (update, create, delete) across components and tabs immediately.
 * @param {Object} detail - The updated/created event or { _id, deleted: true }
 */
export function notifyEventUpdated(detail) {
  if (!detail) return;
  try {
    // 1. In-tab custom event
    window.dispatchEvent(new CustomEvent('eventhub_events_updated', { detail }));

    // 2. Cross-tab BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('eventhub_channel');
      bc.postMessage({ type: 'EVENT_UPDATED', detail });
      bc.close();
    }

    // 3. Cross-tab localStorage trigger
    localStorage.setItem(
      'eventhub_last_event_update',
      JSON.stringify({ detail, timestamp: Date.now() })
    );
  } catch (err) {
    console.error('Error dispatching event update broadcast:', err);
  }
}

/**
 * Optimizes image URLs for fast web delivery (Cloudinary WebP/AVIF auto-format and Unsplash width/quality).
 * @param {string} url - Original image URL
 * @param {number} width - Maximum display width
 * @returns {string} - Optimized URL
 */
export function optimizeImageUrl(url, width = 800) {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary image auto format & compression
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('/f_auto,q_auto')) {
      return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
    }
  }

  // Unsplash CDN dynamic optimization
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', '75');
      return u.toString();
    } catch (e) {
      return url;
    }
  }

  return url;
}

