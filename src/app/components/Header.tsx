import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Hotel, User, Menu, X, LogIn, LogOut, LayoutDashboard, Edit, Bell, Tag, Calendar, ClipboardList, Mail, Users } from 'lucide-react';
import { FaBell, FaCheck, FaTimes, FaUserPlus, FaClipboardList } from 'react-icons/fa';
import { FaIndianRupeeSign } from 'react-icons/fa6';
import { MdSubscriptions } from 'react-icons/md';
import { useNotifications } from '../hooks/useNotifications';
import DefaultLogo from '../../../Logo.svg';
// Notification pop-up logic and data
const notificationIcons = {
  admin: <FaClipboardList color="#eab308" size={20} />,
  user: <FaUserPlus color="#3b82f6" size={20} />,
  all: <FaBell color="#22c55e" size={20} />,
};

import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:5000';
  const effectiveLogo = logoUrl || DefaultLogo;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
    setProfileOpen(false);
  };

  const location = useLocation();

  // Hide main nav links on /admin route
  const isAdminDashboard = location.pathname.startsWith('/admin');
  // Hide header on /admin-signup
  const hideHeader = location.pathname === '/admin-signup';

  const { notifications, loading: notifLoading, error: notifError, markAsRead, deleteNotification } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const unreadCount = notifications.filter((n) => !n.read).length;
  const popupNotifications = notifications.filter((n) => !dismissedIds.has(n._id));
  const profileRef = useRef<HTMLDivElement>(null);

  // Load logo URL from user profile
  useEffect(() => {
    const loadLogo = async () => {
      if (!user || user.role !== 'admin') return;
      try {
        const auth = localStorage.getItem('auth');
        if (!auth) return;
        const parsed = JSON.parse(auth);
        const token = parsed.token;
        if (!token) return;
        const response = await fetch(`${API_BASE}/api/admin/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.logoUrl) {
            setLogoUrl(userData.logoUrl);
          }
        }
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    };
    loadLogo();
  }, [user, API_BASE]);

  const resolveLogoUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
  };

  // Close profile popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target as Node)) {
        // Check if click is not on profile button
        const target = event.target as HTMLElement;
        if (!target.closest('button[aria-label="Show profile"]')) {
          setProfileOpen(false);
        }
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  if (hideHeader) return null;
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent lg:bg-black/95 border-b border-transparent lg:border-black">
      <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-6 lg:pb-8">
        {/* Admin Dashboard Header */}
        {isAdminDashboard ? (
          <nav className="flex items-center justify-between lg:justify-center pt-2 relative">
            {/* Logo - Left side */}
            {effectiveLogo && (
              <div className="absolute left-0 lg:left-0">
                <img 
                  src="C:\playotel\Hotel-Frontend\Logo.svg"
                  alt="Logo" 
                  className="h-8 lg:h-10 object-contain"
                />
              </div>
            )}
            {/* Mobile Icons - Hamburger Menu and Profile Icon */}
            <div className={`lg:hidden flex items-center gap-3 ${effectiveLogo ? 'ml-20' : ''}`}>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2"
                aria-label="Open menu"
              >
                <Menu size={22} color="#fbbf24" />
              </button>
              {user ? (
                <button
                  className="relative p-2"
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                  aria-label="Show profile"
                >
                  <User size={22} color="#fbbf24" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-[#232b23]">{unreadCount}</span>
                  )}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="relative p-2"
                  aria-label="Login"
                >
                  <LogIn size={22} color="#fbbf24" />
                </Link>
              )}
            </div>
            {/* Desktop Navigation - Hidden on Mobile */}
            <div className={`hidden lg:flex items-center gap-12 text-sm uppercase tracking-widest text-white/90 font-bold ${logoUrl ? 'ml-auto' : ''}`}>
            <span onClick={() => navigate('/admin', { state: { tab: 'dashboard' } })} className="hover:text-white transition-colors cursor-pointer">Home</span>
            <span onClick={() => navigate('/admin', { state: { tab: 'rooms' } })} className="hover:text-white transition-colors cursor-pointer">Manage Rooms</span>
              <span onClick={() => navigate('/admin', { state: { tab: 'bookings' } })}>Bookings</span>
              <span onClick={() => navigate('/admin', { state: { tab: 'services' } })}>Manage Services</span>
              <span onClick={() => navigate('/admin', { state: { tab: 'service-bookings' } })}>Service Bookings</span>
            <span onClick={() => navigate('/admin', { state: { tab: 'payments' } })} className="hover:text-white transition-colors cursor-pointer">Payments</span>
              {/* Notification Bell - Desktop Only */}
            <button
                className="relative ml-2 p-2 lg:p-0"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
              aria-label="Show notifications"
            >
              <FaBell size={22} color="#fbbf24" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 text-xs font-bold border-2 border-[#232b23]">{unreadCount}</span>
              )}
            </button>
            </div>
          </nav>
        ) : (
          <nav className="flex items-center justify-between lg:justify-center relative">
            {/* Logo - Left side */}
            {effectiveLogo && (
              <div className="absolute left-0 lg:left-0">
                <img 
                  src={resolveLogoUrl(effectiveLogo)} 
                  alt="Logo" 
                  className="h-8 lg:h-10 object-contain"
                />
              </div>
            )}
            {/* Mobile Icons - Hamburger Menu and Profile Icon */}
            <div className={`lg:hidden flex items-center gap-3 ${logoUrl ? 'ml-20' : ''}`}>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2"
                aria-label="Open menu"
              >
                <Menu size={22} color="#fbbf24" />
              </button>
              {user ? (
                <button
                  className="relative p-2"
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                  aria-label="Show profile"
                >
                  <User size={22} color="#fbbf24" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white">{unreadCount}</span>
                  )}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="relative p-2"
                  aria-label="Login"
                >
                  <LogIn size={22} color="#fbbf24" />
                </Link>
              )}
            </div>
            {/* Desktop Navigation - Hidden on Mobile */}
            <div className={`hidden lg:flex items-center gap-12 text-sm uppercase tracking-widest text-white/90 font-bold ${effectiveLogo ? 'ml-auto' : ''}`}>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <Link to="/rooms" className="hover:text-white transition-colors">Accommodation</Link>
                <Link to="/services" className="hover:text-white transition-colors">Services</Link>
                <Link to="/offers" className="hover:text-white transition-colors">Offers</Link>
                <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link>
                    )}
                    <Link to="/profile?tab=profile" className="hover:text-white transition-colors">Profile</Link>
                  </>
                ) : (
                  <Link to="/login" className="hover:text-white transition-colors">Login&Signup</Link>
                )}
              {/* Notification Bell - Desktop Only */}
              <button
                className="relative ml-4 p-2 lg:p-0"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                aria-label="Show notifications"
              >
                <FaBell size={22} color="#fbbf24" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 text-xs font-bold border-2 border-white">{unreadCount}</span>
                )}
              </button>
            </div>
          </nav>
        )}

        {/* Profile Popover - Mobile Only */}
        {profileOpen && user && (
          <div ref={profileRef} className="lg:hidden fixed z-50 top-20 left-4 w-[320px] max-w-[90vw] bg-[#232b23] text-[#efece6] rounded-2xl shadow-2xl border border-[#5b6659] p-0 animate-fade-in max-h-[80vh] flex flex-col">
            <div className="flex items-center px-6 pt-5 pb-4 border-b border-[#3a463a]">
              <User color="#fbbf24" size={22} className="mr-2" />
              <span className="text-lg font-semibold">Profile</span>
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 text-xs font-bold">{unreadCount}</span>
              )}
              <button
                className="ml-auto text-[#b6b6b6] hover:text-[#efece6] text-xl px-2"
                onClick={() => setProfileOpen(false)}
                aria-label="Close profile"
              >
                <FaTimes />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Profile Info */}
              <div className="px-6 py-4 border-b border-[#3a463a]">
                <div className="text-sm text-[#b6b6b6] mb-1">Name</div>
                <div className="text-lg font-medium text-[#efece6]">{user.name || user.email || 'User'}</div>
                <div className="text-xs text-[#b6b6b6] mt-1 capitalize">{user.role || 'user'}</div>
              </div>

              {/* Notifications Section */}
              <div className="px-6 pt-4 pb-2">
                <div className="flex items-center mb-3">
                  <FaBell color="#fbbf24" size={18} className="mr-2" />
                  <span className="text-base font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white rounded-full px-2 text-xs font-bold">{unreadCount}</span>
                  )}
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {notifLoading ? (
                    <div className="text-[#b6b6b6] text-center py-4 text-sm">Loading notifications...</div>
                  ) : notifError ? (
                    <div className="text-[#b6b6b6] text-center py-4 text-sm">{notifError}</div>
                  ) : popupNotifications.length === 0 ? (
                    <div className="text-[#b6b6b6] text-center py-4 text-sm">No notifications</div>
                  ) : (
                    <div className="space-y-2">
                      {popupNotifications.slice(0, 5).map((n) => (
                        <div
                          key={n._id}
                          className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border transition-colors ${n.read ? 'bg-[#2e362e] border-[#3a463a]' : 'bg-[#3f4a40]/80 border-amber-200'}`}
                        >
                          <div className="mt-0.5">{notificationIcons[n.role as keyof typeof notificationIcons] || <FaBell color="#fbbf24" size={16} />}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="font-medium text-[#efece6] text-sm truncate">{n.title}</div>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${n.role === 'admin' ? 'bg-[#ffe58f] text-[#ad850e]' : n.role === 'user' ? 'bg-[#cfc9bb] text-[#232b23]' : 'bg-[#b6b6b6] text-[#232b23]'}`}>{n.role === 'admin' ? 'Admin' : n.role === 'user' ? 'User' : 'All'}</span>
                            </div>
                            <div className="text-xs text-[#cfc9bb] line-clamp-2">{n.message}</div>
                            <div className="text-xs text-[#b6b6b6] mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="flex flex-col gap-1 ml-1">
                            {!n.read && (
                              <button
                                title="Mark as read"
                                onClick={() => {
                                  markAsRead(n._id);
                                  setDismissedIds((prev) => new Set([...prev, n._id]));
                                }}
                                className="text-green-400 hover:text-green-500 bg-transparent rounded p-1"
                              >
                                <FaCheck size={12} />
                              </button>
                            )}
                            <button
                              title="Delete"
                              onClick={() => {
                                deleteNotification(n._id);
                                setDismissedIds((prev) => new Set([...prev, n._id]));
                              }}
                              className="text-[#b6b6b6] hover:text-red-400 bg-transparent rounded p-1"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {popupNotifications.length > 5 && (
                  <button
                    className="text-amber-400 hover:underline text-xs font-medium mt-2 w-full text-center"
                    onClick={() => { setProfileOpen(false); navigate('/notifications'); }}
                  >
                    View all notifications →
                  </button>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <div className="px-6 py-4 border-t border-[#3a463a]">
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Notification Popover - Desktop Only */}
        {notifOpen && (
          <div className="hidden lg:block fixed z-50 top-20 right-8 w-[420px] max-w-[95vw] bg-[#232b23] text-[#efece6] rounded-2xl shadow-2xl border border-[#5b6659] p-0 animate-fade-in" style={{ minWidth: 340 }}>
            <div className="flex items-center px-6 pt-5 pb-2 border-b border-[#3a463a]">
              <FaBell color="#fbbf24" size={22} className="mr-2" />
              <span className="text-lg font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 text-xs">{unreadCount}</span>
              )}
              <button
                className="ml-auto text-[#b6b6b6] hover:text-[#efece6] text-xl px-2"
                onClick={() => setNotifOpen(false)}
                aria-label="Close notifications"
              >
                <FaTimes />
              </button>
            </div>
            <div className="max-h-[340px] overflow-y-auto px-2 py-2">
              {notifLoading ? (
                <div className="text-[#b6b6b6] text-center py-8">Loading notifications...</div>
              ) : notifError ? (
                <div className="text-[#b6b6b6] text-center py-8">{notifError}</div>
              ) : popupNotifications.length === 0 ? (
                <div className="text-[#b6b6b6] text-center py-8">No notifications</div>
              ) : (
                popupNotifications.map((n) => (
                  <div
                    key={n._id}
                    className={`flex items-start gap-3 px-5 py-4 rounded-xl mb-2 border transition-colors ${n.read ? 'bg-[#2e362e] border-[#3a463a]' : 'bg-[#3f4a40]/80 border-amber-200'} relative`}
                  >
                    <div className="mt-1">{notificationIcons[n.role as keyof typeof notificationIcons] || <FaBell color="#fbbf24" />}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-[#efece6]">{n.title}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${n.role === 'admin' ? 'bg-[#ffe58f] text-[#ad850e]' : n.role === 'user' ? 'bg-[#cfc9bb] text-[#232b23]' : 'bg-[#b6b6b6] text-[#232b23]'}`}>{n.role === 'admin' ? 'Admin' : n.role === 'user' ? 'User' : 'All'}</span>
                      </div>
                      <div className="text-sm text-[#cfc9bb]">{n.message}</div>
                      <div className="text-xs text-[#b6b6b6] mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      {!n.read && (
                        <button
                          title="Mark as read"
                          onClick={() => {
                            markAsRead(n._id);
                            setDismissedIds((prev) => new Set([...prev, n._id]));
                          }}
                          className="text-green-400 hover:text-green-500 bg-transparent rounded p-1"
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        title="Delete"
                        onClick={() => {
                          deleteNotification(n._id);
                          setDismissedIds((prev) => new Set([...prev, n._id]));
                        }}
                        className="text-[#b6b6b6] hover:text-red-400 bg-transparent rounded p-1"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 text-center pb-2">
              <button
                className="text-amber-400 hover:underline text-xs font-medium flex items-center justify-center gap-1 mx-auto"
                onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
              >
                View all notifications <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Menu - Admin Only */}
        {mobileMenuOpen && user && user.role === 'admin' && (
          <>
            {/* Backdrop */}
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-[60] transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Sidebar */}
            <div className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-[#3f4a40] z-[61] shadow-2xl transform transition-transform duration-300 ease-in-out">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#5b6659]">
                <div>
                  <h2 className="text-xl font-bold text-[#efece6]">Admin Panel</h2>
                  <p className="text-sm text-[#cfc9bb] mt-1">{user.name || user.email || 'Admin User'}</p>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="text-[#efece6] hover:text-white p-2"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto py-4">
                {[
                  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', to: '/admin', tab: 'dashboard' },
                  { id: 'rooms', icon: Edit, label: 'Manage Rooms', to: '/admin', tab: 'rooms' },
                  { id: 'services', icon: Bell, label: 'Manage Services', to: '/admin', tab: 'services' },
                  { id: 'offers', icon: Tag, label: 'Manage Offers', to: '/admin', tab: 'offers' },
                  { id: 'bookings', icon: Calendar, label: 'Bookings', to: '/admin', tab: 'bookings' },
                  { id: 'service-bookings', icon: ClipboardList, label: 'Service Bookings', to: '/admin', tab: 'service-bookings' },
                  { id: 'payments', icon: FaIndianRupeeSign, label: 'Payments', to: '/admin', tab: 'payments' },
                  { id: 'contact-messages', icon: Mail, label: 'Contact Messages', to: '/admin', tab: 'contacts' },
                  { id: 'newsletter', icon: MdSubscriptions, label: 'News Letter', to: '/admin', tab: 'newsletter' },
                  { id: 'guests', icon: Users, label: 'Guests', to: '/admin', tab: 'guests' },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const searchParams = new URLSearchParams(location.search);
                  const currentTab = searchParams.get('tab') || '';
                  let isActive = false;
                  if (location.pathname === item.to) {
                    if (item.id === 'dashboard') {
                      isActive = !currentTab || currentTab === 'dashboard';
                    } else {
                      isActive = currentTab === item.tab;
                    }
                  }
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.tab ? `${item.to}?tab=${item.tab}` : item.to}
                      state={item.tab ? { tab: item.tab } : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-6 py-3 mx-2 rounded-xl transition-colors ${
                        isActive 
                          ? 'bg-[#e7d6ad] text-[#1b1e18]' 
                          : 'text-[#cfc9bb] hover:bg-[#2d342d] hover:text-[#efece6]'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 shrink-0" />
                      <span className="text-[15px] font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}

        {/* Full Screen Mobile Menu Overlay - For Non-Admin Users */}
        {mobileMenuOpen && (!user || user.role !== 'admin') && (
          <div className="lg:hidden fixed inset-0 bg-[#3f4a40] backdrop-blur-md z-[60] transition-all">
            <div className="flex justify-end p-8">
               <button onClick={() => setMobileMenuOpen(false)} className="text-white border border-white/20 p-3 rounded-full">
                  <X className="w-6 h-6" />
               </button>
            </div>
            <nav className="flex flex-col items-center gap-8 p-6 text-center">
              {user ? (
                <>
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Home</Link>
                  <Link to="/rooms" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Rooms</Link>
                  <Link to="/services" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Services</Link>
                  <Link to="/offers" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Offers</Link>
                  <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">About Us</Link>
                  <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Contact</Link>
                  <Link to="/profile?tab=profile" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Profile</Link>
                  <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light flex items-center gap-2">
                    <FaBell className="w-6 h-6" /> Notifications
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Home</Link>
                  <Link to="/rooms" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Rooms</Link>
                  <Link to="/services" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Services</Link>
                  <Link to="/offers" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Offers</Link>
                  <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">About Us</Link>
                  <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Contact</Link>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-2xl text-white uppercase tracking-widest font-light">Login&Signup</Link>
                </>
              )}
              {/* Refresh Button for Mobile */}
              <Button variant="outline" className="w-full max-w-xs" onClick={() => window.location.reload()} title="Refresh Website">
                Refresh
              </Button>
              <div className="w-full h-px bg-white/10 my-4 max-w-xs" />
              {user ? (
                <Button onClick={handleLogout} variant="ghost" className="text-white text-lg">Logout</Button>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-white text-lg">Sign In</Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;