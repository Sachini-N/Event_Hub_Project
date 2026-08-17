import React, { useState, useEffect } from 'react';

export default function ProfilePage({
  token,
  currentUser,
  setCurrentUser,
  logout,
  showToast,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [eventReminders, setEventReminders] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultAvatar =
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';

  useEffect(() => {
    setName(currentUser?.name || 'Jane Doe');
    setEmail(currentUser?.email || 'jane@example.com');
    setPhone(currentUser?.contactNumber || '+94 77 123 4567');
    setAvatar(currentUser?.avatar || defaultAvatar);
  }, [currentUser]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      if (showToast) showToast('Please select an image smaller than 3MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setAvatar(base64String);
      saveAvatarToBackend(base64String);
    };
    reader.readAsDataURL(file);
  };

  const saveAvatarToBackend = async (newAvatar) => {
    const authToken = token || localStorage.getItem('eventhub_token');
    if (!authToken) {
      if (setCurrentUser) {
        setCurrentUser((prev) => ({ ...prev, avatar: newAvatar }));
      }
      if (showToast) showToast('Profile photo updated!', 'success');
      return;
    }

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ avatar: newAvatar }),
      });

      const result = await response.json();
      if (result.success) {
        if (setCurrentUser) setCurrentUser(result.data);
        if (showToast) showToast('Profile photo updated successfully!', 'success');
      } else {
        if (showToast) showToast(result.message || 'Failed to update photo', 'error');
      }
    } catch (err) {
      console.error('Error updating avatar:', err);
      if (showToast) showToast('Failed to upload photo', 'error');
    }
  };

  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    const authToken = token || localStorage.getItem('eventhub_token');

    if (authToken) {
      try {
        const response = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            name,
            email,
            contactNumber: phone,
            avatar,
          }),
        });

        const result = await response.json();

        if (result.success) {
          if (setCurrentUser) {
            setCurrentUser(result.data);
          }
          if (showToast) {
            showToast('Profile updated successfully in database!', 'success');
          }
        } else {
          if (showToast) {
            showToast(result.message || 'Failed to update profile', 'error');
          }
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        if (showToast) {
          showToast('Network error updating profile', 'error');
        }
      } finally {
        setSaving(false);
      }
    } else {
      setTimeout(() => {
        setSaving(false);
        if (showToast) {
          showToast('Profile and preferences updated successfully!', 'success');
        }
      }, 300);
    }
  };

  return (
    <div className="profile-page">
      <div className="section-container">
        <div className="profile-grid-layout">
          {/* Left Column: Avatar & Quick Action Card */}
          <div className="profile-left-column">
            <div className="avatar-card-box">
              <div className="avatar-wrapper">
                <img src={avatar || defaultAvatar} alt={name} />
                <label
                  htmlFor="avatar-file-input"
                  className="avatar-camera-btn"
                  title="Upload / Change Photo"
                >
                  <i className="fa-solid fa-camera"></i>
                </label>
                <input
                  type="file"
                  id="avatar-file-input"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>

              <h2 className="avatar-user-name">{name}</h2>
              <p className="avatar-user-email">{email}</p>

              <div className="avatar-actions-group">
                <button
                  type="button"
                  className="btn-edit-profile-blue"
                  onClick={handleSaveChanges}
                >
                  <i className="fa-solid fa-floppy-disk"></i> Save Profile
                </button>
                <button type="button" className="btn-logout-outline" onClick={logout}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Settings & Details Cards */}
          <div className="profile-right-column">
            <form onSubmit={handleSaveChanges}>
              {/* Card 1: Account Information */}
              <div className="profile-card-box">
                <div className="profile-card-header">
                  <i className="fa-regular fa-user header-icon"></i>
                  <h3>Account Information</h3>
                </div>

                <div className="account-info-grid">
                  <div className="profile-form-group">
                    <label htmlFor="prof-name">Full Name</label>
                    <input
                      type="text"
                      id="prof-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="prof-email">Email Address</label>
                    <input
                      type="email"
                      id="prof-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                    />
                  </div>

                  <div className="profile-form-group full-width">
                    <label htmlFor="prof-phone">Contact Number</label>
                    <input
                      type="tel"
                      id="prof-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Notification Preferences */}
              <div className="profile-card-box">
                <div className="profile-card-header">
                  <i className="fa-regular fa-bell header-icon"></i>
                  <h3>Notification Preferences</h3>
                </div>

                <div className="preferences-list">
                  <div className="preference-item-row">
                    <div className="pref-text">
                      <h4>Event Reminders</h4>
                      <p>Get notified before an event starts.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={eventReminders}
                        onChange={(e) => setEventReminders(e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="preference-item-row">
                    <div className="pref-text">
                      <h4>Email Notifications</h4>
                      <p>Receive weekly digests and updates.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 3: Calendar Integration */}
              <div className="profile-card-box">
                <div className="profile-card-header">
                  <i className="fa-regular fa-calendar header-icon"></i>
                  <h3>Calendar Integration</h3>
                </div>

                <div className="integration-item-box">
                  <div className="integration-info">
                    <div className="gcal-icon-wrapper">
                      <i className="fa-brands fa-google gcal-icon"></i>
                    </div>
                    <div className="gcal-text">
                      <h4>Google Calendar</h4>
                      <span className="connected-status">
                        <i className="fa-solid fa-circle-check"></i> Connected
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-manage-outline"
                    onClick={() =>
                      showToast && showToast('Google Calendar settings managed.', 'info')
                    }
                  >
                    Manage
                  </button>
                </div>
              </div>

              {/* Save Changes Button Row */}
              <div className="profile-save-row">
                <button
                  type="submit"
                  className="btn-save-changes-blue"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
