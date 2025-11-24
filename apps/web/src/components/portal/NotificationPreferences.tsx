import React, { useState, useEffect } from 'react';

interface NotificationPreferences {
  type: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  browserEnabled: boolean;
}

interface NotificationPreferencesProps {
  className?: string;
}

const notificationTypes = [
  {
    key: 'project_update',
    label: 'Project Updates',
    description: 'When project status or details change',
  },
  {
    key: 'task_assigned',
    label: 'Task Assignments',
    description: 'When tasks are assigned to you',
  },
  {
    key: 'task_completed',
    label: 'Task Completions',
    description: 'When tasks are completed',
  },
  {
    key: 'approval_request',
    label: 'Approval Requests',
    description: 'When approvals are requested from you',
  },
  {
    key: 'approval_approved',
    label: 'Approvals Completed',
    description: 'When approvals are approved',
  },
  {
    key: 'approval_rejected',
    label: 'Approvals Rejected',
    description: 'When approvals are rejected',
  },
  {
    key: 'ticket_created',
    label: 'New Tickets',
    description: 'When new tickets are created',
  },
  {
    key: 'ticket_updated',
    label: 'Ticket Updates',
    description: 'When ticket status changes',
  },
  {
    key: 'invoice_issued',
    label: 'New Invoices',
    description: 'When new invoices are issued',
  },
  {
    key: 'invoice_paid',
    label: 'Invoice Payments',
    description: 'When invoices are paid',
  },
  {
    key: 'file_uploaded',
    label: 'File Uploads',
    description: 'When files are uploaded to projects',
  },
  {
    key: 'milestone_completed',
    label: 'Milestone Completions',
    description: 'When milestones are completed',
  },
  {
    key: 'team_invitation',
    label: 'Team Invitations',
    description: 'When invited to join a team',
  },
];

export const NotificationPreferences: React.FC<
  NotificationPreferencesProps
> = ({ className = '' }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch preferences from API
  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(`${apiUrl}/notifications/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || []);
      } else {
        // Initialize with default preferences
        const defaultPrefs = notificationTypes.map((type) => ({
          type: type.key,
          inAppEnabled: true,
          emailEnabled: true,
          browserEnabled: false,
        }));
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Failed to fetch notification preferences:', error);
      }
      // Initialize with default preferences
      const defaultPrefs = notificationTypes.map((type) => ({
        type: type.key,
        inAppEnabled: true,
        emailEnabled: true,
        browserEnabled: false,
      }));
      setPreferences(defaultPrefs);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences to API
  const savePreferences = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(`${apiUrl}/notifications/preferences`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        // Show success message
        alert('Notification preferences saved successfully!');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Failed to save notification preferences:', error);
      }
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Update preference
  const updatePreference = (
    type: string,
    field: keyof NotificationPreferences,
    value: boolean
  ) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.type === type ? { ...pref, [field]: value } : pref
      )
    );
  };

  // Toggle all preferences for a specific channel
  const toggleAll = (field: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => prev.map((pref) => ({ ...pref, [field]: value })));
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Notification Preferences
          </h2>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Channel Toggles */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="toggle-all-inapp"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={preferences.every((p) => p.inAppEnabled)}
                onChange={(e) => toggleAll('inAppEnabled', e.target.checked)}
              />
              <label
                htmlFor="toggle-all-inapp"
                className="text-sm text-gray-700"
              >
                Enable All In-App
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="toggle-all-email"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={preferences.every((p) => p.emailEnabled)}
                onChange={(e) => toggleAll('emailEnabled', e.target.checked)}
              />
              <label
                htmlFor="toggle-all-email"
                className="text-sm text-gray-700"
              >
                Enable All Email
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="toggle-all-browser"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={preferences.every((p) => p.browserEnabled)}
                onChange={(e) => toggleAll('browserEnabled', e.target.checked)}
              />
              <label
                htmlFor="toggle-all-browser"
                className="text-sm text-gray-700"
              >
                Enable All Browser
              </label>
            </div>
          </div>
        </div>

        {/* Individual Preferences */}
        <div className="space-y-4">
          {notificationTypes.map((notificationType) => {
            const pref = preferences.find(
              (p) => p.type === notificationType.key
            );
            if (!pref) return null;

            return (
              <div
                key={notificationType.key}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {notificationType.label}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {notificationType.description}
                  </p>
                </div>

                <div className="flex items-center space-x-4 ml-4">
                  {/* In-App Notifications */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`inapp-${notificationType.key}`}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={pref.inAppEnabled}
                      onChange={(e) =>
                        updatePreference(
                          notificationType.key,
                          'inAppEnabled',
                          e.target.checked
                        )
                      }
                    />
                    <label
                      htmlFor={`inapp-${notificationType.key}`}
                      className="text-xs text-gray-600"
                    >
                      In-App
                    </label>
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`email-${notificationType.key}`}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={pref.emailEnabled}
                      onChange={(e) =>
                        updatePreference(
                          notificationType.key,
                          'emailEnabled',
                          e.target.checked
                        )
                      }
                    />
                    <label
                      htmlFor={`email-${notificationType.key}`}
                      className="text-xs text-gray-600"
                    >
                      Email
                    </label>
                  </div>

                  {/* Browser Notifications */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`browser-${notificationType.key}`}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={pref.browserEnabled}
                      onChange={(e) =>
                        updatePreference(
                          notificationType.key,
                          'browserEnabled',
                          e.target.checked
                        )
                      }
                    />
                    <label
                      htmlFor={`browser-${notificationType.key}`}
                      className="text-xs text-gray-600"
                    >
                      Browser
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Browser Notification Permission */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Browser Notifications
          </h3>
          <p className="text-xs text-blue-700 mb-3">
            Enable browser notifications to receive alerts even when the tab is
            not active.
          </p>
          {typeof Notification !== 'undefined' &&
            Notification.permission === 'default' && (
              <button
                onClick={() => Notification.requestPermission()}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Enable Browser Notifications
              </button>
            )}
          {typeof Notification !== 'undefined' &&
            Notification.permission === 'granted' && (
              <p className="text-xs text-green-600">
                ✓ Browser notifications are enabled
              </p>
            )}
          {typeof Notification !== 'undefined' &&
            Notification.permission === 'denied' && (
              <p className="text-xs text-red-600">
                Browser notifications are blocked. Please enable them in your
                browser settings.
              </p>
            )}
        </div>
      </div>
    </div>
  );
};
