import React from 'react';
import { FaBell } from 'react-icons/fa';
import { useNotifications } from '../hooks/useNotifications';

const notificationIcons = {
  user: <FaBell color="#3b82f6" size={20} />,
  admin: <FaBell color="#eab308" size={20} />,
  all: <FaBell color="#22c55e" size={20} />,
};

const Notifications: React.FC = () => {
  const { notifications, loading, error, markAsRead, deleteNotification } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <FaBell size={24} color="#eab308" />
        <h2 className="text-2xl font-bold">Notifications</h2>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white rounded-full px-2 text-xs font-bold">{unreadCount} unread</span>
        )}
      </div>
      {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}
      {error && <div className="text-red-500 py-4">{error}</div>}
      {notifications.length === 0 && !loading ? (
        <div className="text-[#b6b6b6] text-center py-8">No notifications</div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n) => (
            <li
              key={n._id}
              className={`flex items-start gap-3 px-5 py-4 rounded-xl border transition-colors ${
                n.read ? 'bg-[#f8fafc] border-[#eaeaea]' : 'bg-[#fffbe6] border-[#ffe58f]'
              } relative`}
            >
              <div className="mt-1">{notificationIcons[n.role]}</div>
              <div className="flex-1">
                <div className="font-medium text-[#232b23]">{n.title}</div>
                <div className="text-sm text-[#444]">{n.message}</div>
                <div className="text-xs text-[#888] mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-1 ml-2">
                {!n.read && (
                  <button
                    title="Mark as read"
                    onClick={() => markAsRead(n._id)}
                    className="text-green-500 hover:text-green-600 bg-transparent rounded p-1 text-xs font-semibold"
                  >
                    ✓ Read
                  </button>
                )}
                <button
                  title="Delete"
                  onClick={() => deleteNotification(n._id)}
                  className="text-gray-400 hover:text-red-500 bg-transparent rounded p-1 text-xs"
                >
                  Delete
                </button>
              </div>
              {!n.read && <span className="absolute top-3 right-3 text-green-500 font-bold text-xs">New</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
