import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { User, Mail, Phone, Calendar, LogOut, Settings, Bell, CreditCard, Edit2, Save, X, AlertCircle, CheckCircle2, Award, Star, TrendingUp, MapPin, Gift, Shield, Menu } from 'lucide-react';
import { Button } from '../components/ui/button';
import Footer from '../components/Footer'; 

function downloadFile(url: string, filename: string) {
  fetch(url, {
    headers: {
      'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth') || '{}').token || ''}`,
    },
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to download invoice');
      return response.blob();
    })
    .then(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(() => {
      alert('Could not download invoice.');
    });
}
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Room } from '../types/room';

type ServiceBooking = {
  id: string;
  serviceId: string;
  serviceName: string;
  category: 'dining' | 'restaurant' | 'spa' | 'bar';
  priceRange: string;
  date: Date;
  time: string;
  guests: number;
  specialRequests: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  bookingDate: Date;
  roomBookingId?: string;
  paymentStatus?: string;
  totalPrice?: number;
};

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const { bookings, cancelBooking, refreshBookings } = useBooking();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';
  const allowedTabs = isAdmin
    ? ['profile']
    : ['profile', 'bookings', 'service-bookings', 'payments', 'notifications', 'settings'];
  const resolveTab = (value: string | null) => (value && allowedTabs.includes(value) ? value : 'profile');
  const [activeTab, setActiveTab] = React.useState(() => resolveTab(searchParams.get('tab')));
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:5000';
  
  const resolveImageUrl = (imageUrl: string) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400';
    return imageUrl.startsWith('/uploads/') ? `${API_BASE}${imageUrl}` : imageUrl;
  };
  
  const [roomsState, setRoomsState] = React.useState<Room[]>([]);
  const [roomsLoadError, setRoomsLoadError] = React.useState<string | null>(null);
  const [adminBookingsState, setAdminBookingsState] = React.useState<any[]>([]);
  const [adminBookingsError, setAdminBookingsError] = React.useState<string | null>(null);
  const [serviceBookingsState, setServiceBookingsState] = React.useState<ServiceBooking[]>([]);
  const [serviceBookingsError, setServiceBookingsError] = React.useState<string | null>(null);
  const [serviceBookingsLoading, setServiceBookingsLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(user?.name || '');
  const [editedEmail, setEditedEmail] = React.useState(user?.email || '');
  const [editedPhone, setEditedPhone] = React.useState((user?.phone || '').replace(/^\+/, ''));
  const [isSecurityOpen, setIsSecurityOpen] = React.useState(false);
  const [isTwoFactorOpen, setIsTwoFactorOpen] = React.useState(false);
  const [securityForm, setSecurityForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securityError, setSecurityError] = React.useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(Boolean(user?.twoFactorEnabled));
  const [isSavingTwoFactor, setIsSavingTwoFactor] = React.useState(false);

  React.useEffect(() => {
    const nextTab = resolveTab(searchParams.get('tab'));
    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [activeTab, searchParams]);

  React.useEffect(() => {
    setTwoFactorEnabled(Boolean(user?.twoFactorEnabled));
  }, [user?.twoFactorEnabled]);

  React.useEffect(() => {
    setEditedName(user?.name || '');
    setEditedEmail(user?.email || '');
    setEditedPhone((user?.phone || '').replace(/^\+/, ''));
  }, [user]);

  const handleTabChange = (tab: string) => {
    const nextTab = resolveTab(tab);
    setActiveTab(nextTab);
    setSearchParams({ tab: nextTab });
    setIsMobileNavOpen(false);
  };

  React.useEffect(() => {
    const loadRooms = async () => {
      setRoomsLoadError(null);
      try {
        const response = await fetch(`${API_BASE}/api/rooms`);
        if (!response.ok) {
          throw new Error(`Failed to load rooms (${response.status})`);
        }
        const data = await response.json();
        const normalized = (data as any[]).map((room) => ({
          id: room._id || room.id,
          name: room.name,
          type: room.type,
          price: room.price,
          images: room.images || [],
          description: room.description || '',
          amenities: room.amenities || [],
          maxGuests: room.maxGuests || 1,
          size: room.size || 0,
          available: room.available ?? true,
        }));
        setRoomsState(normalized);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load rooms';
        setRoomsLoadError(message);
      }
    };

    loadRooms();
  }, [API_BASE]);

  React.useEffect(() => {
    const loadAdminBookings = async () => {
      if (!isAdmin) {
        return;
      }
      setAdminBookingsError(null);
      try {
        const auth = JSON.parse(localStorage.getItem('auth') || '{}');
        const token = auth.token as string | undefined;
        if (!token) {
          throw new Error('Session expired. Please log in again.');
        }

        const response = await fetch(`${API_BASE}/api/admin/bookings`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load bookings (${response.status})`);
        }

        const data = await response.json();
        setAdminBookingsState(Array.isArray(data) ? data : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load bookings';
        setAdminBookingsError(message);
      }
    };

    loadAdminBookings();
  }, [API_BASE, isAdmin]);

  React.useEffect(() => {
    const loadServiceBookings = async () => {
      if (!user || isAdmin) {
        setServiceBookingsState([]);
        return;
      }

      setServiceBookingsLoading(true);
      setServiceBookingsError(null);
      try {
        const auth = JSON.parse(localStorage.getItem('auth') || '{}');
        const token = auth.token as string | undefined;
        if (!token) {
          throw new Error('Session expired. Please log in again.');
        }

        const response = await fetch(`${API_BASE}/api/service-bookings`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load service bookings (${response.status})`);
        }

        const data = await response.json();
        const normalized = (data as any[]).map((booking) => ({
          id: booking._id || booking.id,
          serviceId: booking.serviceId,
          serviceName: booking.serviceName,
          category: booking.category,
          priceRange: booking.priceRange || '',
          date: new Date(booking.date),
          time: booking.time,
          guests: booking.guests,
          specialRequests: booking.specialRequests || '',
          status: booking.status ?? 'pending',
          paymentStatus: booking.paymentStatus ?? 'pending',
          bookingDate: new Date(booking.bookingDate || Date.now()),
        }));
        setServiceBookingsState(normalized);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load service bookings';
        setServiceBookingsError(message);
      } finally {
        setServiceBookingsLoading(false);
      }
    };

    loadServiceBookings();

    // Listen for refreshServiceBookings event to reload service bookings after payment
    const handler = () => loadServiceBookings();
    window.addEventListener('refreshServiceBookings', handler);
    return () => window.removeEventListener('refreshServiceBookings', handler);
  }, [API_BASE, isAdmin, user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1210] px-4">
        <div className="w-full max-w-md bg-[#2f3a32]/90 border border-[#4b5246] rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-[#343a30] rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-[#d7d0bf]" />
          </div>
          <h2 className="text-2xl font-bold text-[#efece6] mb-2">Please log in</h2>
          <p className="text-[#c9c3b6] mb-6">You need to be logged in to view your profile</p>
          <Button onClick={() => navigate('/login')} className="px-8 h-12">
            Login
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = auth.token;
      
      if (!token) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editedName,
          email: editedEmail,
          phone: editedPhone.replace(/^\+/, '')
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile (${response.status})`);
      }

      const data = await response.json();
      updateUser({
        name: editedName,
        email: editedEmail,
        phone: editedPhone
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(user?.name || '');
    setEditedEmail(user?.email || '');
    setEditedPhone((user?.phone || '').replace(/^\+/, ''));
    setIsEditing(false);
  };

  const handlePasswordUpdate = async () => {
    if (!securityForm.currentPassword) {
      setSecurityError('Please enter your current password.');
      return;
    }
    if (!securityForm.newPassword) {
      setSecurityError('Please enter a new password.');
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError('New password and confirmation must match.');
      return;
    }

    setIsSavingPassword(true);
    setSecurityError(null);
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = auth.token as string | undefined;
      if (!token) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword,
        }),
      });

      if (!response.ok) {
        let message = `Failed to update password (${response.status})`;
        try {
          const data = await response.json();
          if (data?.message) {
            message = data.message;
          }
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsSecurityOpen(false);
      toast.success('Password updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password.';
      setSecurityError(message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    const nextValue = !twoFactorEnabled;
    setIsSavingTwoFactor(true);
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = auth.token as string | undefined;
      if (!token) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ twoFactorEnabled: nextValue }),
      });

      if (!response.ok) {
        let message = `Failed to update two-factor setting (${response.status})`;
        try {
          const data = await response.json();
          if (data?.message) {
            message = data.message;
          }
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      setTwoFactorEnabled(nextValue);
      updateUser({ twoFactorEnabled: nextValue });
      toast.success(nextValue ? 'Two-factor enabled.' : 'Two-factor disabled.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update two-factor setting.';
      toast.error(message);
    } finally {
      setIsSavingTwoFactor(false);
    }
  };

  const statusColors = {
    'pending': 'bg-amber-100 text-amber-800',
    'confirmed': 'bg-emerald-100 text-emerald-800',
    'checked-in': 'bg-blue-100 text-blue-800',
    'check-out': 'bg-[#343a30] text-[#efece6]',
    'cancelled': 'bg-red-100 text-red-800',
  };

  const idStatusColors = {
    'pending': 'bg-amber-100 text-amber-800',
    'approved': 'bg-emerald-100 text-emerald-800',
    'rejected': 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-[#3f4a40] text-[white] py-12 lg:py-16 overflow-y-scroll relative pt-10 md:pt-0">
      {/* Background Gradients */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(88,105,90,0.35), transparent 55%), radial-gradient(circle at 85% 60%, rgba(98,120,100,0.35), transparent 60%), linear-gradient(180deg, rgba(23,30,24,0.9), rgba(23,30,24,0.55))',
        }}
      />
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[linear-gradient(180deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:100%_160px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between lg:hidden mb-4">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#4b5246] bg-[#343a30] px-3 py-2 text-sm font-medium text-[#efece6] shadow-sm"
            >
              <Menu className="w-4 h-4" />
              Menu
            </button>
            <span className="text-sm text-[white]">My Account</span>
          </div>
          <h1 className="text-3xl font-bold text-[white]" style={{ fontFamily: "'Great Vibes', cursive" }}>
            Welcome back, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-[#efece6] mt-1">Manage your profile and bookings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div
              className={`fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] bg-[#2f3a32]/90 border border-[#4b5246] rounded-none shadow-xl p-6 transform transition-transform lg:static lg:translate-x-0 lg:rounded-3xl ${
                isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <span className="text-sm font-semibold text-[white]">Navigation</span>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-2 rounded-lg text-[#c9c3b6] hover:text-[#efece6] hover:bg-[#343a30]"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-[#343a30] rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl text-[white] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-[white]">{user.name}</h2>
                <p className="text-sm text-[#efece6] mb-2">{user.role === 'admin' ? 'Administrator' : 'User'}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-2 mb-6">
                {/* <button
                  onClick={() => handleTabChange('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-shadow${
                    activeTab === 'profile'
                      ? 'bg-[#d7d0bf] text-[#1f241f] hover:shadow-lg'
                      : 'text-[#c9c3b6] hover:shadow-lg'
                  }`}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button> */}
                <button
                      onClick={() => handleTabChange('profile')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-shadow ${
                        activeTab === 'profile' 
                          ? 'bg-[#d7d0bf] text-[#1f241f] hover:shadow-lg'
                          : 'text-[#c9c3b6] hover:shadow-lg'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      My Profile
                    </button>
                {!isAdmin && (
                  <>
                    <button
                      onClick={() => handleTabChange('bookings')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-shadow ${
                        activeTab === 'bookings' 
                          ? 'bg-[#d7d0bf] text-[#1f241f] hover:shadow-lg'
                          : 'text-[#c9c3b6] hover:shadow-lg'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      My Bookings
                    </button>
                    <button
                      onClick={() => handleTabChange('service-bookings')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-shadow ${
                        activeTab === 'service-bookings'
                          ? 'bg-[#d7d0bf] text-[#1f241f] hover:shadow-lg'
                          : 'text-[#c9c3b6] hover:shadow-lg'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      My Service Bookings
                    </button>
                    <button
                      onClick={() => handleTabChange('payments')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-shadow ${
                        activeTab === 'payments' 
                          ? 'bg-[#d7d0bf] text-[#1f241f] hover:shadow-lg'
                          : 'text-[#c9c3b6] hover:shadow-lg'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Payments
                    </button>
                    <button
                      onClick={() => handleTabChange('notifications')}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-shadow ${
                        activeTab === 'notifications' 
                          ? 'bg-[#d7d0bf] text-[#1f241f] hover:shadow-lg'
                          : 'text-[#c9c3b6] hover:shadow-lg'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        Notifications
                        {bookings.filter(b => b.status === 'confirmed').length > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {bookings.filter(b => b.status === 'confirmed').length}
                          </span>
                        )}
                      </span>
                      <Bell className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTabChange('settings')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-shadow ${
                        activeTab === 'settings' 
                          ? 'bg-[#d7d0bf] text-[#1f241f] hover:shadow-lg'
                          : 'text-[#c9c3b6] hover:shadow-lg'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </>
                )}
              </nav>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#343a30] text-[#efece6] rounded-xl hover:bg-[#3f463a] transition-colors text-sm font-medium border border-[#4b5246]"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>

              {/* Admin Dashboard Link */}
              {user.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full mt-4 px-4 py-2.5 bg-[#d7d0bf] text-[#1f241f] rounded-xl hover:bg-[#e5ddca] transition-colors text-sm font-medium"
                >
                  Admin Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 pl-0 lg:pl-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-[#2f3a32]/90 border border-[#4b5246] rounded-3xl shadow-xl p-6 pl-8 lg:p-8 lg:pl-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#efece6]">Personal Details</h2>
                    <p className="text-sm text-[#c9c3b6] mt-1">Manage your account information</p>
                  </div>
                  {!isEditing ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="rounded-xl border-[#4b5246]  bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6]"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancelEdit}
                        className="rounded-xl border-[#4b5246] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6]"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSaveProfile}
                        className="rounded-xl bg-[#d7d0bf] hover:bg-[#e5ddca] text-[#1f241f]"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="p-4 bg-[#343a30] rounded-xl border border-[#4b5246] hover:shadow-lg transition-shadow">
                    <label className="text-xs font-medium text-[#c9c3b6] uppercase tracking-wider">Full Name</label>
                    {isEditing ? (
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="mt-1 border-[#4b5246] focus:border-[#c9c3b6] focus:ring-[#c9c3b6] bg-[#2f3530] text-[#efece6]"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-[#c9c3b6]" />
                        <span className="font-medium text-[#efece6]">{user.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="p-4 bg-[#343a30] rounded-xl border border-[#4b5246] hover:shadow-lg transition-shadow">
                    <label className="text-xs font-medium text-[#c9c3b6] uppercase tracking-wider">Email Address</label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        className="mt-1 border-[#4b5246] focus:border-[#c9c3b6] focus:ring-[#c9c3b6] bg-[#2f3530] text-[#efece6]"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-[#c9c3b6]" />
                        <span className="font-medium text-[#efece6]">{user.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="p-4 bg-[#343a30] rounded-xl border border-[#4b5246] hover:shadow-lg transition-shadow">
                    <label className="text-xs font-medium text-[#c9c3b6] uppercase tracking-wider">Phone Number</label>
                    {isEditing ? (
                      <Input
                        type="tel"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        className="mt-1 border-[#4b5246] focus:border-[#c9c3b6] focus:ring-[#c9c3b6] bg-[#2f3530] text-[#efece6]"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-[#c9c3b6]" />
                        <span className="font-medium text-[#efece6]">{(user.phone || 'Not provided').replace(/^\+/, '')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#4b5246]">
                  <h3 className="text-lg font-semibold text-[#efece6] mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#d7d0bf]" />
                    {isAdmin ? 'Booking Overview' : 'Your Journey'}
                  </h3>
                  {adminBookingsError && isAdmin && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {adminBookingsError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#343a30] p-4 rounded-xl text-[#efece6] hover:shadow-lg transition-shadow">
                      <div className="text-2xl font-bold mb-1">
                        {isAdmin ? adminBookingsState.length : bookings.length}
                      </div>
                      <p className="text-sm text-[#c9c3b6]">Total Bookings</p>
                    </div>
                    <div className="bg-[#2f3530] p-4 rounded-xl text-[#efece6] hover:shadow-lg transition-shadow">
                      <div className="text-2xl font-bold mb-1">
                        {isAdmin
                          ? adminBookingsState.filter(b => b.status === 'confirmed').length
                          : bookings.filter(b => b.status === 'confirmed').length}
                      </div>
                      <p className="text-sm text-[#c9c3b6]">Active Bookings</p>
                    </div>
                    <div className="bg-[#2a3027] p-4 rounded-xl text-[#efece6] hover:shadow-lg transition-shadow">
                      <div className="text-2xl font-bold mb-1">
                        {isAdmin
                          ? adminBookingsState.filter(b => b.status === 'check-out').length
                          : bookings.filter(b => b.status === 'check-out').length}
                      </div>
                      <p className="text-sm text-[#c9c3b6]">Completed Stays</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {!isAdmin && activeTab === 'bookings' && (
              <div className="bg-[#2f3a32]/90 border border-[#4b5246] rounded-3xl shadow-xl p-6 lg:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#efece6]">My Bookings</h2>
                    <p className="text-sm text-[#c9c3b6] mt-1">Manage your reservations</p>
                  </div>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                    onClick={async () => {
                      await refreshBookings();
                      toast.success('Bookings refreshed');
                    }}
                  >
                    Refresh Bookings
                  </Button>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#343a30] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-[#d7d0bf]" />
                    </div>
                    <h3 className="text-lg font-medium text-[#efece6] mb-2">No bookings yet</h3>
                    <p className="text-[#c9c3b6] mb-6">Start your journey with us today</p>
                    <Button onClick={() => navigate('/rooms')} className="bg-[#d7d0bf] hover:bg-[#e5ddca] text-[#1f241f] rounded-xl h-12 px-6">
                      <MapPin className="w-4 h-4 mr-2" />
                      Browse Rooms
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => {
                      const room = roomsState.find(r => r.id === booking.roomId);
                      // Find all confirmed service bookings for this room booking
                      const relatedServices = serviceBookingsState.filter(s => s.roomBookingId === booking.id && s.status === 'confirmed');
                      const allPaid = booking.paymentStatus === 'paid' && relatedServices.every(s => s.paymentStatus === 'paid');
                      const total = booking.totalPrice + relatedServices.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
                      return (
                        <div key={booking.id} className="border border-[#4b5246] rounded-xl p-4 hover:shadow-lg transition-shadow bg-[#343a30]">
                          <div className="flex flex-col lg:flex-row gap-4">
                            <img
                              src={resolveImageUrl(room?.images?.[0] || '')}
                              alt={room?.name || 'Room'}
                              className="w-full lg:w-48 h-40 sm:h-32 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400';
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                <div>
                                  <h3 className="font-semibold text-[#efece6]">{room?.name || 'Room'}</h3>
                                  <p className="text-xs text-[#c9c3b6]">ID: {booking.id.slice(0, 8)}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}> 
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-sm">
                                <div>
                                  <p className="text-[#c9c3b6]">Check-in</p>
                                  <p className="font-medium text-[#efece6]">{format(booking.checkIn, 'MMM dd, yyyy')}</p>
                                </div>
                                <div>
                                  <p className="text-[#c9c3b6]">Check-out</p>
                                  <p className="font-medium text-[#efece6]">{format(booking.checkOut, 'MMM dd, yyyy')}</p>
                                </div>
                                <div>
                                  <p className="text-[#c9c3b6]">Guests</p>
                                  <p className="font-medium text-[#efece6]">{booking.guests}</p>
                                </div>
                                <div>
                                  <p className="text-[#c9c3b6]">Total</p>
                                  <p className="font-bold text-emerald-600">₹{total.toFixed(2)}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {/* Show Confirmed indicator when booking is confirmed */}
                                {booking.status === 'confirmed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    className="rounded-lg border-emerald-300 text-emerald-500 bg-emerald-500/10"
                                  >
                                    Confirmed
                                  </Button>
                                )}
                                {/* Show Check-In button only if status is confirmed and ID is approved */}
                                {booking.status === 'confirmed' && booking.idVerified === 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/checkin/${booking.id}`)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                    Check In
                                  </Button>
                                )}
                                {/* Hide Check-In button if already checked-in or checked-out */}
                                {/* Show Check Out button if checked-in and payment is paid */}
                                {booking.status === 'checked-in' && booking.paymentStatus === 'paid' && (
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/checkout/${booking.id}`)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                  >
                                    Check Out
                                  </Button>
                                )}
                                {/* Optionally, show disabled Check Out button if not paid */}
                                {booking.status === 'checked-in' && booking.paymentStatus !== 'paid' && (
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 text-white rounded-lg opacity-60 cursor-not-allowed"
                                    disabled
                                    title="Please pay full amount before check-out"
                                  >
                                    Check Out
                                  </Button>
                                )}
                                {/* Show Pay Now if not paid and checked-in or confirmed */}
                                {booking.paymentStatus !== 'paid' && (booking.status === 'checked-in' || booking.status === 'confirmed') && (
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/payment/${booking.id}`)}
                                    className="bg-[#d7d0bf] hover:bg-[#e5ddca] text-[#1f241f] rounded-lg"
                                  >
                                    Pay Now
                                  </Button>
                                )}
                                {/* Show Paid if payment done and confirmed */}
                                {booking.paymentStatus === 'paid' && booking.status === 'confirmed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    className="rounded-lg border-emerald-200 text-emerald-700"
                                  >
                                    Paid
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/booking-details/${booking.id}`)}
                                  className="rounded-lg border-[#4b5246] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6]"
                                >
                                  View Details
                                </Button>
                                {(booking.status === 'pending' || (booking.status === 'confirmed' && booking.idVerified !== 'approved')) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg border-red-300 text-red-600 hover:bg-red-50"
                                    onClick={async () => {
                                      if (window.confirm('Are you sure you want to cancel this booking?')) {
                                        try {
                                          await cancelBooking(booking.id);
                                          toast.success('Booking cancelled successfully');
                                        } catch (error) {
                                          toast.error('Failed to cancel booking');
                                        }
                                      }
                                    }}
                                  >
                                    <X className="w-3.5 h-3.5 mr-1.5" />
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {roomsLoadError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {roomsLoadError}
                  </div>
                )}

              </div>
            )}

            {/* Service Bookings Tab */}
            {!isAdmin && activeTab === 'service-bookings' && (
              <div className="bg-[#2f3a32]/90 border border-[#4b5246] rounded-3xl shadow-xl p-6 lg:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#efece6]">My Service Bookings</h2>
                  <p className="text-sm text-[#c9c3b6] mt-1">Your dining, spa, and lounge reservations</p>
                </div>

                {serviceBookingsLoading ? (
                  <div className="text-sm text-[#c9c3b6]">Loading service bookings...</div>
                ) : serviceBookingsState.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#343a30] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-[#d7d0bf]" />
                    </div>
                    <h3 className="text-lg font-medium text-[#efece6] mb-2">No service bookings yet</h3>
                    <p className="text-[#c9c3b6]">Reserve a dining or spa experience to see it here</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {serviceBookingsState.map((booking) => (
                      <div key={booking.id} className="border border-[#4b5246] rounded-xl p-4 hover:shadow-md transition-shadow bg-[#343a30]">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-[#efece6]">{booking.serviceName}</h3>
                            <p className="text-xs text-[#c9c3b6]">Category: {booking.category}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}> 
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
                          <div>
                            <p className="text-[#c9c3b6]">Date</p>
                            <p className="font-medium text-[#efece6]">{format(booking.date, 'MMM dd, yyyy')}</p>
                          </div>
                          <div>
                            <p className="text-[#c9c3b6]">Time</p>
                            <p className="font-medium text-[#efece6]">{booking.time}</p>
                          </div>
                          <div>
                            <p className="text-[#c9c3b6]">Guests</p>
                            <p className="font-medium text-[#efece6]">{booking.guests}</p>
                          </div>
                          <div>
                            <p className="text-[#c9c3b6]">Price Range</p>
                            <p className="font-medium text-[#efece6]">{booking.priceRange || '—'}</p>
                          </div>
                        </div>

                        {booking.specialRequests && (
                          <div className="mt-3 text-sm text-[#c9c3b6]">
                            <span className="font-medium text-[#d7d0bf]">Special requests:</span> {booking.specialRequests}
                          </div>
                        )}

                        {booking.status === 'pending' && (
                          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-amber-800 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Waiting for admin approval. Your booking will be confirmed or cancelled once reviewed.
                            </p>
                          </div>
                        )}

                        {/* Show Pay Now for any active (non-cancelled), unpaid service booking */}
                        {booking.status !== 'cancelled' && booking.paymentStatus !== 'paid' && (
                          <Button
                            size="sm"
                            className="bg-[#d7d0bf] hover:bg-[#e5ddca] text-[#1f241f] rounded-lg"
                            onClick={() => navigate(`/payment/service/${booking.id}`)}
                          >
                            Pay Now
                          </Button>
                        )}
                        {/* Show Paid button if already paid */}
                        {booking.status === 'confirmed' && booking.paymentStatus === 'paid' && (
                          <Button
                            className="mt-3 rounded-lg border-emerald-200 text-emerald-700"
                            variant="outline"
                            disabled
                          >
                            Paid
                          </Button>
                        )}
                      </div>
                    ))}
                    </div>
                    {serviceBookingsError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {serviceBookingsError}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {!isAdmin && activeTab === 'payments' && (
              <div className="bg-[#2f3a32]/90 border border-[#4b5246] rounded-3xl shadow-xl p-6 lg:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#efece6]">Payment History</h2>
                  <p className="text-sm text-[#c9c3b6] mt-1">View your transaction records</p>
                </div>

                {/* Combine room and service bookings for payments */}
                {(() => {
                  const paidRoomBookings = bookings.filter(b => b.paymentStatus === 'paid');
                  const paidServiceBookings = serviceBookingsState.filter(s => s.status === 'confirmed' && s.paymentStatus === 'paid');
                  const unpaidRoomBookings = bookings.filter(b => b.paymentStatus !== 'paid');
                  const unpaidServiceBookings = serviceBookingsState.filter(s => s.status === 'confirmed' && s.paymentStatus !== 'paid');
                  const totalPaid = paidRoomBookings.reduce((sum, b) => sum + b.totalPrice, 0) + paidServiceBookings.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
                  const totalTransactions = paidRoomBookings.length + paidServiceBookings.length;

                  if (totalTransactions === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-[#343a30] rounded-full flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="w-8 h-8 text-[#d7d0bf]" />
                        </div>
                        <h3 className="text-lg font-medium text-[#efece6] mb-2">No payments yet</h3>
                        <p className="text-[#c9c3b6]">Your payment history will appear here</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="bg-[#343a30] rounded-xl p-4 text-[#efece6] mb-4">
                        <p className="text-sm text-[#c9c3b6] mb-1">Total Spent</p>
                        <p className="text-2xl font-bold">
                          ₹{totalPaid.toFixed(2)}
                        </p>
                        <p className="text-xs text-[#c9c3b6] mt-1">
                          Across {totalTransactions} transactions
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Paid Room Bookings */}
                        {paidRoomBookings.map((booking) => {
                          const room = roomsState.find(r => r.id === booking.roomId);
                          return (
                            <div key={booking.id} className="border border-[#4b5246] rounded-xl p-4 hover:shadow-md transition-shadow bg-[#343a30]">
                              <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                  <div className="w-10 h-10 bg-[#2f3530] rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-[#d7d0bf]" />
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-[#efece6]">{room?.name || 'Room Booking'}</h3>
                                    <p className="text-xs text-[#c9c3b6] mt-1">
                                      {format(booking.checkIn, 'MMM dd')} - {format(booking.checkOut, 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-emerald-600">₹{booking.totalPrice.toFixed(2)}</p>
                                  <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium mt-1">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Paid
                                  </span>
                                  <Button
                                    className="mt-2"
                                    variant="outline"
                                    onClick={() => downloadFile(`${API_BASE}/api/bookings/${booking.id}/invoice`, `invoice-room-${booking.id}.pdf`)}
                                  >
                                    Download Invoice
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {/* Paid Service Bookings */}
                        {paidServiceBookings.map((booking) => (
                          <div key={booking.id} className="border border-[#4b5246] rounded-xl p-4 hover:shadow-md transition-shadow bg-[#343a30]">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                <div className="w-10 h-10 bg-[#2f3530] rounded-lg flex items-center justify-center">
                                  <CreditCard className="w-5 h-5 text-[#d7d0bf]" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-[#efece6]">{booking.serviceName}</h3>
                                  <p className="text-xs text-[#c9c3b6] mt-1">
                                    {format(booking.date, 'MMM dd, yyyy')} at {booking.time}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-emerald-600">₹{(booking.totalPrice || 0).toFixed(2)}</p>
                                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium mt-1">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Paid
                                </span>
                                <Button
                                  className="mt-2"
                                  variant="outline"
                                  onClick={() => downloadFile(`${API_BASE}/api/service-bookings/${booking.id}/invoice`, `invoice-service-${booking.id}.pdf`)}
                                >
                                  Download Invoice
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Unpaid Room Bookings */}
                        {unpaidRoomBookings.map((booking) => {
                          const room = roomsState.find(r => r.id === booking.roomId);
                          return (
                            <div key={booking.id} className="border border-[#4b5246] rounded-xl p-4 hover:shadow-md transition-shadow bg-[#343a30]">
                              <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                  <div className="w-10 h-10 bg-[#2f3530] rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-[#d7d0bf]" />
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-[#efece6]">{room?.name || 'Room Booking'}</h3>
                                    <p className="text-xs text-[#c9c3b6] mt-1">
                                      {format(booking.checkIn, 'MMM dd')} - {format(booking.checkOut, 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-red-600">₹{booking.totalPrice.toFixed(2)}</p>
                                  <Button className="mt-1" onClick={() => navigate(`/payment/${booking.id}`)}>
                                    Pay Now
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {/* Unpaid Service Bookings */}
                        {unpaidServiceBookings.map((booking) => (
                          <div key={booking.id} className="border border-[#4b5246] rounded-xl p-4 hover:shadow-md transition-shadow bg-[#343a30]">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                <div className="w-10 h-10 bg-[#2f3530] rounded-lg flex items-center justify-center">
                                  <CreditCard className="w-5 h-5 text-[#d7d0bf]" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-[#efece6]">{booking.serviceName}</h3>
                                  <p className="text-xs text-[#c9c3b6] mt-1">
                                    {format(booking.date, 'MMM dd, yyyy')} at {booking.time}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-red-600">₹{(booking.totalPrice || 0).toFixed(2)}</p>
                                <Button className="mt-1" onClick={() => navigate(`/payment/service/${booking.id}`)}>
                                  Pay Now
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Notifications Tab */}
            {!isAdmin && activeTab === 'notifications' && (
              <div className="bg-[#2f3a32]/90 border border-[#4b5246] rounded-3xl shadow-xl p-6 lg:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#efece6]">Notifications</h2>
                  <p className="text-sm text-[#c9c3b6] mt-1">Stay updated with your bookings</p>
                </div>

                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => {
                    const room = roomsState.find(r => r.id === booking.roomId);
                    const notificationStyles = {
                      'confirmed': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
                      'check-in': { bg: 'bg-blue-100', text: 'text-blue-700' },
                      'check-out': { bg: 'bg-[#343a30]', text: 'text-[#efece6]' },
                      'cancelled': { bg: 'bg-red-100', text: 'text-red-700' },
                      'pending': { bg: 'bg-amber-100', text: 'text-amber-700' }
                    };
                    const style = notificationStyles[booking.status] || { bg: 'bg-[#2f3530]', text: 'text-[#d7d0bf]' };

                    return (
                      <div key={booking.id} className="flex gap-3 p-4 border border-[#4b5246] rounded-xl hover:shadow-md transition-shadow bg-[#343a30]">
                        <div className={`w-10 h-10 ${style.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Bell className={`w-5 h-5 ${style.text}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-[#efece6]">
                              Booking {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-sm text-[#c9c3b6] mb-1">
                            {booking.status === 'confirmed' && `Your reservation for ${room?.name} has been confirmed.`}
                            {booking.status === 'check-in' && `Welcome to ${room?.name}. Enjoy your stay!`}
                            {booking.status === 'check-out' && `Thank you for staying at ${room?.name}.`}
                            {booking.status === 'cancelled' && `Your booking for ${room?.name} has been cancelled.`}
                            {booking.status === 'pending' && `Your booking request for ${room?.name} is being processed.`}
                          </p>
                          <p className="text-xs text-[#c9c3b6]">
                            {format(booking.bookingDate, 'MMM dd, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {bookings.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#343a30] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-[#d7d0bf]" />
                      </div>
                      <h3 className="text-lg font-medium text-[#efece6] mb-2">No notifications</h3>
                      <p className="text-[#c9c3b6]">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {!isAdmin && activeTab === 'settings' && (
              <div className="bg-[#2f3a32]/90 border border-[#4b5246] rounded-3xl shadow-xl p-6 lg:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#efece6]">Settings</h2>
                  <p className="text-sm text-[#c9c3b6] mt-1">Manage your preferences</p>
                </div>

                <div className="space-y-6">
                  {/* Notification Preferences */}
                  <div className="border border-[#4b5246] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Bell className="w-5 h-5 text-[#d7d0bf]" />
                      <h3 className="font-semibold text-[#efece6]">Notification Preferences</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-[#343a30] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-[#c9c3b6]" />
                          <div>
                            <p className="font-medium text-sm text-[#efece6]">Email Notifications</p>
                            <p className="text-xs text-[#c9c3b6]">Receive updates via email</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-10 h-5 bg-[#4b5246] rounded-full peer peer-checked:bg-[#d7d0bf] peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#343a30] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-[#c9c3b6]" />
                          <div>
                            <p className="font-medium text-sm text-[#efece6]">SMS Notifications</p>
                            <p className="text-xs text-[#c9c3b6]">Get text messages for updates</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-10 h-5 bg-[#4b5246] rounded-full peer peer-checked:bg-[#d7d0bf] peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Privacy & Security */}
                  <div className="border border-[#4b5246] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-[#d7d0bf]" />
                      <h3 className="font-semibold text-[#efece6]">Privacy & Security</h3>
                    </div>
                    <div className="space-y-2">
                      <button
                        className="w-full text-left p-3 bg-[#343a30] rounded-lg hover:bg-[#3f463a] transition-colors"
                        onClick={() => {
                          setIsSecurityOpen((prev) => !prev);
                          setSecurityError(null);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="font-medium text-sm text-[#efece6]">Change Password</p>
                            <p className="text-xs text-[#c9c3b6]">Update your login credentials</p>
                          </div>
                        </div>
                      </button>
                      {isSecurityOpen && (
                        <div className="rounded-lg border border-[#4b5246] bg-[#2f3530] p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="text-xs font-medium text-[#c9c3b6] uppercase tracking-wider">
                                Current Password
                              </label>
                              <Input
                                type="password"
                                value={securityForm.currentPassword}
                                onChange={(e) =>
                                  setSecurityForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                                }
                                className="mt-1 border-[#4b5246] focus:border-[#c9c3b6] focus:ring-[#c9c3b6] bg-[#2f3530] text-[#efece6]"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-[#c9c3b6] uppercase tracking-wider">
                                New Password
                              </label>
                              <Input
                                type="password"
                                value={securityForm.newPassword}
                                onChange={(e) =>
                                  setSecurityForm((prev) => ({ ...prev, newPassword: e.target.value }))
                                }
                                className="mt-1 border-[#4b5246] focus:border-[#c9c3b6] focus:ring-[#c9c3b6] bg-[#2f3530] text-[#efece6]"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-[#c9c3b6] uppercase tracking-wider">
                                Confirm Password
                              </label>
                              <Input
                                type="password"
                                value={securityForm.confirmPassword}
                                onChange={(e) =>
                                  setSecurityForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                                }
                                className="mt-1 border-[#4b5246] focus:border-[#c9c3b6] focus:ring-[#c9c3b6] bg-[#2f3530] text-[#efece6]"
                              />
                            </div>
                          </div>
                          {securityError && (
                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                              {securityError}
                            </div>
                          )}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={handlePasswordUpdate}
                              disabled={isSavingPassword}
                              className="rounded-xl bg-[#d7d0bf] hover:bg-[#e5ddca] text-[#1f241f]"
                            >
                              {isSavingPassword ? 'Updating...' : 'Update Password'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsSecurityOpen(false);
                                setSecurityError(null);
                              }}
                              className="rounded-xl border-[#4b5246] text-[#efece6] hover:bg-[#343a30]"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      <button
                        className="w-full text-left p-3 bg-[#343a30] rounded-lg hover:bg-[#3f463a] transition-colors"
                        onClick={() => setIsTwoFactorOpen((prev) => !prev)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Settings className="w-4 h-4 text-emerald-600" />
                            <div>
                              <p className="font-medium text-sm text-[#efece6]">Two-Factor Authentication</p>
                              <p className="text-xs text-[#c9c3b6]">Add extra security layer</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                            Recommended
                          </span>
                        </div>
                      </button>
                      {isTwoFactorOpen && (
                        <div className="rounded-lg border border-[#4b5246] bg-[#2f3530] p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[#efece6]">
                                {twoFactorEnabled ? 'Two-factor is enabled.' : 'Two-factor is disabled.'}
                              </p>
                              <p className="text-xs text-[#c9c3b6]">
                                This stores a security preference for your account.
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={handleTwoFactorToggle}
                              disabled={isSavingTwoFactor}
                              className="rounded-xl bg-[#d7d0bf] hover:bg-[#e5ddca] text-[#1f241f]"
                            >
                              {isSavingTwoFactor
                                ? 'Saving...'
                                : twoFactorEnabled
                                  ? 'Disable'
                                  : 'Enable'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="border border-red-300/60 rounded-xl p-4 bg-[#3a2f2f]">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <h3 className="font-semibold text-red-800">Danger Zone</h3>
                        <p className="text-xs text-red-600">These actions cannot be undone</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#f3d1d1] mb-3 p-3 bg-[#2f2323] rounded-lg border border-red-300/60">
                      <span className="font-medium text-red-700">Warning:</span> Deleting your account will permanently remove all your data.
                    </p>
                    <button className="w-full px-4 py-2 bg-[#2f2323] border border-red-300/60 text-red-200 rounded-lg hover:bg-[#3a2f2f] transition-colors text-sm font-medium">
                      <AlertCircle className="w-4 h-4 mr-2 inline" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer isAdmin={false} />
    </div>
  );
};

export default Profile;