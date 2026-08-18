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

  const getInitialsAvatar = (cleanName) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName || 'User')}&background=0052cc&color=fff&size=200`;
  };

  const getAvatarUrl = (userObj, currentName) => {
    if (userObj?.avatar && userObj.avatar.trim() !== '') {
      return userObj.avatar;
    }
    return getInitialsAvatar(currentName || userObj?.name);
  };

  useEffect(() => {
    const initialName = currentUser?.name || 'Saduni Madushika';
    const initialEmail = currentUser?.email || 'saduni@gmail.com';
    setName(initialName);
    setEmail(initialEmail);
    setPhone(currentUser?.contactNumber || '+94 77 123 4567');
    setAvatar(currentUser?.avatar ? currentUser.avatar : getInitialsAvatar(initialName));
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
      if (setCurrentUser) {
        setCurrentUser((prev) =>
          prev
            ? { ...prev, avatar: base64String }
            : { name, email, contactNumber: phone, avatar: base64String }
        );
      }
      saveAvatarToBackend(base64String);
    };
    reader.readAsDataURL(file);
  };

  const saveAvatarToBackend = async (newAvatar) => {
    const authToken = token || localStorage.getItem('eventhub_token');
    if (!authToken) {
      if (setCurrentUser) {
        setCurrentUser((prev) => (prev ? { ...prev, avatar: newAvatar } : null));
      }
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
        if (setCurrentUser) {
          setCurrentUser(result.data);
        }
      }
    } catch (err) {
      console.error('Error updating avatar:', err);
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
            showToast('Profile updated successfully!', 'success');
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
          showToast('Profile updated successfully!', 'success');
        }
      }, 300);
    }
  };

  const handleRemovePhoto = (e) => {
    if (e) e.preventDefault();
    const initialsAvatar = getInitialsAvatar(name);
    setAvatar(initialsAvatar);

    if (setCurrentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, avatar: '' } : null));
    }

    saveAvatarToBackend('');
    if (showToast) {
      showToast('Profile photo removed successfully!', 'info');
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
                <img src={avatar || getAvatarUrl(currentUser, name)} alt={name} />
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

              <button
                type="button"
                className="btn-remove-photo-text"
                onClick={handleRemovePhoto}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                }}
              >
                <i className="fa-regular fa-trash-can"></i> Remove Photo
              </button>

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
