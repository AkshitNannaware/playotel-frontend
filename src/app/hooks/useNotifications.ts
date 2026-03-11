import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export interface Notification {
  _id: string;
  userId?: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  role: 'user' | 'admin' | 'all';
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.token ?? null;
    }
  } catch {}
  return null;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const token = getToken();
    fetch(`${API_URL}/api/notifications`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to mark notification as read');
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.warn('markAsRead error:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to delete notification');
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.warn('deleteNotification error:', err);
    }
  }, []);

  return { notifications, loading, error, markAsRead, deleteNotification, refetch: fetchNotifications };
}
