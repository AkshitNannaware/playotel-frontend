// Update booking status (e.g., for check-out or payment)
const updateBookingStatus = async (
  bookingId: string,
  status: string,
  paymentStatus?: string,
  paymentMethod?: 'cash' | 'online'
) => {
  try {
    const body: any = { status };
    if (paymentStatus) body.paymentStatus = paymentStatus;
    if (paymentMethod) body.paymentMethod = paymentMethod;
    const response = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to update booking status');
    }
    toast.success(`Booking status updated to ${status}`);
  } catch (err: any) {
    toast.error(err.message || 'Failed to update booking status');
  }
};
import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNavadmin';
// import { useSwipeable } from 'react-swipeable';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Hotel,
  Calendar,
  Users,
  Settings,
  Bell,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  CheckCircle,
  MessageSquare,
  Mail,
  Phone,
  Eye,
  ClipboardList,
  Menu,
  X,
  Download,
  Upload,
  Tag,
  Maximize2,
  Wifi,
  Car,
  Coffee,
  LogOut,
  Waves,
  Search,
  LogIn,
  DoorOpen,
  MapPin
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import type { Room } from '../types/room';
import { MdSubscriptions } from "react-icons/md";
import { FaIndianRupeeSign } from "react-icons/fa6";

type AdminStats = {
  totalRooms: number;
  availableRooms: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  occupancyRate: number;
};

type AdminBooking = {
  id: string;
  roomId: string;
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string | Date;
  checkOut: string | Date;
  bookingDate?: string | Date;
  status: string;
  paymentStatus?: string;
  paymentMethod?: 'cash' | 'online';
  idVerified?: 'pending' | 'approved' | 'rejected';
  idProofUrl?: string;
  idProofType?: string;
  idProofUploadedAt?: string | Date;
  totalPrice: number;
};

type AdminUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
};

type AdminService = {
  id: string;
  name: string;
  category: 'dining' | 'restaurant' | 'spa' | 'bar';
  description: string;
  image: string;
  video: string;
  priceRange: string;
  availableTimes: string[];
};

type AdminOffer = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  badgeText: string;
  expiryDate?: string | Date | null;
  ctaText: string;
  image: string;
  active: boolean;
};

type AdminContact = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  adminNotes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ContactStats = {
  total: number;
  new: number;
  read: number;
  replied: number;
  archived: number;
};

type AdminServiceBooking = {
  id: string;
  serviceId: string;
  serviceName: string;
  category: 'dining' | 'restaurant' | 'spa' | 'bar';
  priceRange?: string;
  date: string | Date;
  time: string;
  guests: number;
  specialRequests?: string;
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  bookingDate?: string | Date;
  totalPrice?: number;
  paymentStatus?: 'pending' | 'paid' | 'failed';
};

const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:5000';

import { useLocation } from 'react-router';

const AdminDashboard = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location && location.state && location.state.tab) {
      return location.state.tab;
    }
    return 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [roomsState, setRoomsState] = useState<Room[]>([]);
  const [bookingsState, setBookingsState] = useState<AdminBooking[]>([]);
  const [serviceBookingsState, setServiceBookingsState] = useState<AdminServiceBooking[]>([]);
  const [usersState, setUsersState] = useState<AdminUser[]>([]);
  const [servicesState, setServicesState] = useState<AdminService[]>([]);
  const [offersState, setOffersState] = useState<AdminOffer[]>([]);
  const [contactsState, setContactsState] = useState<AdminContact[]>([]);
  const [contactStatsState, setContactStatsState] = useState<ContactStats | null>(null);
  const [newsletterSubscriptions, setNewsletterSubscriptions] = useState<any[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [statsState, setStatsState] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [serviceDeleteLoading, setServiceDeleteLoading] = useState(false);
  const [isOfferFormOpen, setIsOfferFormOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [serviceBookingStatusFilter, setServiceBookingStatusFilter] = useState('all');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [serviceBookingSearchQuery, setServiceBookingSearchQuery] = useState('');
  const [swipedBookingId, setSwipedBookingId] = useState<string | null>(null);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [serviceBookingsPage, setServiceBookingsPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(10);
  const [serviceBookingsPerPage, setServiceBookingsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [roomForm, setRoomForm] = useState({
    name: '',
    type: 'Single',
    price: '',
    images: '',
    description: '',
    amenities: '',
    maxGuests: '',
    size: '20',
    available: true,
    location: '',
  });
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'dining',
    description: '',
    image: '',
    video: '',
    priceRange: '',
    availableTimes: '',
  });
  const [offerForm, setOfferForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    price: '',
    rating: '4.9',
    reviewCount: '',
    badgeText: '',
    expiryDate: '',
    ctaText: 'Check availability',
    image: '',
    active: true,
  });

  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [bookingIdProofFile, setBookingIdProofFile] = useState<File | null>(null);
  const [bookingIdProofType, setBookingIdProofType] = useState('passport');
  const [roomImageFiles, setRoomImageFiles] = useState<File[]>([]);
  const [roomVideoFile, setRoomVideoFile] = useState<File | null>(null);
  const [serviceImageFile, setServiceImageFile] = useState<File | null>(null);
  const [serviceVideoFile, setServiceVideoFile] = useState<File | null>(null);
  const [offerImageFile, setOfferImageFile] = useState<File | null>(null);
  const [isServiceBookingFormOpen, setIsServiceBookingFormOpen] = useState(false);
  const [activeServiceCategory, setActiveServiceCategory] = useState<AdminService['category']>('restaurant');
  const [activeServiceBookingCategory, setActiveServiceBookingCategory] = useState<AdminService['category']>('restaurant');
  const [expandedServiceBookingCategories, setExpandedServiceBookingCategories] = useState<Set<string>>(new Set(['restaurant']));
  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    status: 'pending' as const,
    totalPrice: '',
  });
  const [serviceBookingForm, setServiceBookingForm] = useState({
    serviceId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    date: '',
    time: '',
    guests: '1',
    status: 'pending' as const,
    specialRequests: '',
    paymentStatus: 'pending' as const,
  });

  const [profileSettings, setProfileSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    setProfileSettings({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user]);

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [hotelSettings, setHotelSettings] = useState({
    name: 'Grand Luxe',
    address: '',
    phone: '',
    email: '',
    checkInTime: '14:00',
    checkOutTime: '11:00',
  });
  const [billingSettings, setBillingSettings] = useState({
    razorpayKeyId: '',
    payoutAccount: '',
  });
  const [brandingSettings, setBrandingSettings] = useState({
    logoUrl: '',
    facebook: '',
    instagram: '',
    youtube: '',
    twitter: '',
  });
  const [brandingLogoFile, setBrandingLogoFile] = useState<File | null>(null);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [settingsSavedAt, setSettingsSavedAt] = useState<string | null>(null);
  const [serviceBookingConfirmDialog, setServiceBookingConfirmDialog] = useState<{
    show: boolean;
    bookingId: string | null;
    action: 'approve' | 'reject' | null;
    bookingName?: string;
  }>({
    show: false,
    bookingId: null,
    action: null,
  });

  const [createUserForm, setCreateUserForm] = useState({ name: '', email: '', phone: '', password: '', role: 'user' });
  const [createUserError, setCreateUserError] = useState('');
  const [createUserLoading, setCreateUserLoading] = useState(false);

  const handleNavSelect = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const getAuthToken = () => {
    const stored = localStorage.getItem('auth');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed.token as string | undefined;
    } catch {
      return null;
    }
  };

  const handleServiceBookingActionClick = (bookingId: string, action: 'approve' | 'reject') => {
    const booking = serviceBookingsState.find(b => b.id === bookingId);
    setServiceBookingConfirmDialog({
      show: true,
      bookingId,
      action,
      bookingName: booking?.serviceName || 'this service booking',
    });
  };

  const handleUpdateServiceBookingStatus = async () => {
    const { bookingId, action } = serviceBookingConfirmDialog;

    if (!bookingId || !action) {
      return;
    }

    const nextStatus = action === 'approve' ? 'confirmed' : 'cancelled';

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error('No auth token found. Please log in again.');
        setServiceBookingConfirmDialog({ show: false, bookingId: null, action: null });
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/service-bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Status update failed (${response.status})`);
      }

      const data = await response.json();

      const updatedBooking = normalizeServiceBooking(data);
      setServiceBookingsState((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? updatedBooking
            : booking
        )
      );

      setServiceBookingConfirmDialog({ show: false, bookingId: null, action: null });

      toast.success(`Service booking ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } catch (err) {
      console.error('Error in handleUpdateServiceBookingStatus:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
      setServiceBookingConfirmDialog({ show: false, bookingId: null, action: null });
    }
  };

  const fetchJson = async (path: string, options?: RequestInit & { isFormData?: boolean }) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (!options?.isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      let errorData: any = null;
      try {
        errorData = await response.json();
        if (errorData?.message) {
          message = errorData.message;
        }
      } catch {
        // ignore
      }
      const error = new Error(message);
      (error as any).errorData = errorData;
      throw error;
    }

    return response.json();
  };

  const fetchUsers = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = auth.token;
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (response.ok) {
        const usersData = await response.json();
        setUsersState((usersData as any[]).map((user) => ({
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        })));
      }
    } catch { }
  };

  const handleSaveSettings = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoadError('No auth token found. Please log in again.');
        return;
      }

      let logoUrl = brandingSettings.logoUrl;

      // Upload logo file if selected
      if (brandingLogoFile) {
        const formData = new FormData();
        formData.append('logo', brandingLogoFile);
        const uploadResponse = await fetch(`${API_BASE}/api/admin/profile/upload-logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        if (!uploadResponse.ok) {
          const data = await uploadResponse.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to upload logo');
        }
        const uploadData = await uploadResponse.json();
        logoUrl = uploadData.logoUrl;
        setBrandingSettings(prev => ({ ...prev, logoUrl }));
        setBrandingLogoFile(null);
      }

      const response = await fetch(`${API_BASE}/api/admin/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileSettings.name,
          email: profileSettings.email,
          phone: profileSettings.phone,
          logoUrl: logoUrl,
          facebook: brandingSettings.facebook,
          instagram: brandingSettings.instagram,
          youtube: brandingSettings.youtube,
          twitter: brandingSettings.twitter,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update profile');
      }
      const updatedUser = await response.json();
      setBrandingSettings(prev => ({ ...prev, logoUrl: updatedUser.logoUrl || logoUrl }));
      setSettingsSavedAt(new Date().toLocaleTimeString());
      toast.success('Profile updated successfully!');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to update profile');
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleSecuritySave = async () => {
    if (!securityForm.currentPassword) {
      setSecurityError('Please enter your current password.');
      return;
    }
    if (!securityForm.newPassword || !securityForm.confirmPassword) {
      setSecurityError('Please enter and confirm your new password.');
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError('New password and confirm password do not match.');
      return;
    }
    setSecurityError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setSecurityError('No auth token found. Please log in again.');
        return;
      }
      const response = await fetch(`${API_BASE}/api/admin/profile/password`, {
        method: 'PATCH',
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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update password');
      }
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSettingsSavedAt(new Date().toLocaleTimeString());
      toast.success('Password updated successfully!');
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : 'Failed to update password');
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    }
  };

  const normalizeRoom = (room: any): Room => ({
    id: room._id || room.id,
    name: room.name,
    type: room.type,
    price: room.price,
    images: room.images || [],
    video: room.video || '',
    description: room.description || '',
    amenities: room.amenities || [],
    maxGuests: room.maxGuests || 1,
    size: room.size || 0,
    available: room.available ?? true,
    location: room.location || '',
  });

  const normalizeService = (service: any): AdminService => ({
    id: service._id || service.id,
    name: service.name,
    category: service.category,
    description: service.description || '',
    image: service.image || '',
    video: service.video || '',
    priceRange: service.priceRange || '',
    availableTimes: service.availableTimes || [],
  });

  const normalizeOffer = (offer: any): AdminOffer => ({
    id: offer._id || offer.id,
    title: offer.title || '',
    subtitle: offer.subtitle || '',
    description: offer.description || '',
    price: Number(offer.price || 0),
    rating: Number(offer.rating || 4.9),
    reviewCount: Number(offer.reviewCount || 0),
    badgeText: offer.badgeText || '',
    expiryDate: offer.expiryDate || null,
    ctaText: offer.ctaText || 'Check availability',
    image: offer.image || '',
    active: offer.active ?? true,
  });

  const normalizeServiceBooking = (booking: any): AdminServiceBooking => ({
    id: booking._id || booking.id,
    serviceId: booking.serviceId,
    serviceName: booking.serviceName,
    category: booking.category,
    priceRange: booking.priceRange,
    date: booking.date,
    time: booking.time,
    guests: booking.guests,
    specialRequests: booking.specialRequests,
    userId: booking.userId,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,
    status: ['pending', 'confirmed', 'cancelled'].includes(booking.status) ? booking.status : 'pending',
    bookingDate: booking.bookingDate,
    // ADD THIS LINE TO FIX THE SYNC ISSUE
    paymentStatus: booking.paymentStatus || 'pending',
  });

  const updateIdVerification = async (bookingId: string, idVerified: 'pending' | 'approved' | 'rejected') => {
    try {
      const updated = await fetchJson(`/api/admin/bookings/${bookingId}/id-verified`, {
        method: 'PATCH',
        body: JSON.stringify({ idVerified }),
      });

      // Backend automatically confirms booking when ID is approved
      // Always fetch latest bookings from backend to ensure we have the correct status
      const bookings = await fetchJson('/api/admin/bookings');
      setBookingsState(
        (bookings as any[]).map((booking) => ({
          id: booking._id || booking.id,
          roomId: booking.roomId,
          userId: booking.userId,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          bookingDate: booking.bookingDate,
          status: booking.status, // Use status directly from backend
          paymentStatus: booking.paymentStatus,
          idVerified: booking.idVerified || 'pending',
          idProofUrl: booking.idProofUrl,
          idProofType: booking.idProofType,
          idProofUploadedAt: booking.idProofUploadedAt,
          totalPrice: booking.totalPrice,
        }))
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update ID status';
      setLoadError(message);
    }
  };

  const handleIdVerificationChange = (
    booking: AdminBooking,
    nextStatus: 'approved' | 'rejected'
  ) => {
    if (!booking.idProofUrl) {
      return;
    }

    if (booking.idVerified === 'approved' && nextStatus === 'rejected') {
      setLoadError('Approved ID verification cannot be rejected.');
      return;
    }

    if (booking.idVerified && booking.idVerified !== nextStatus) {
      const confirmed = window.confirm(
        `This ID is already marked as ${booking.idVerified}. Do you want to change it to ${nextStatus}?`
      );
      if (!confirmed) {
        return;
      }
    }

    updateIdVerification(booking.id, nextStatus);
  };

  const updateContactStatus = async (contactId: string, status: 'new' | 'read' | 'replied' | 'archived') => {
    try {
      const updated = await fetchJson(`/api/admin/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      setContactsState((prev) =>
        prev.map((contact) =>
          contact._id === contactId
            ? { ...contact, status: updated.contact.status, updatedAt: updated.contact.updatedAt }
            : contact
        )
      );

      if (contactStatsState) {
        const oldContact = contactsState.find(c => c._id === contactId);
        if (oldContact) {
          setContactStatsState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              [oldContact.status]: Math.max(0, prev[oldContact.status] - 1),
              [status]: prev[status] + 1,
            };
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update contact status';
      setLoadError(message);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!window.confirm('Are you sure you want to delete this contact message?')) {
      return;
    }

    try {
      await fetchJson(`/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
      });

      const deletedContact = contactsState.find(c => c._id === contactId);
      setContactsState((prev) => prev.filter((contact) => contact._id !== contactId));

      if (contactStatsState && deletedContact) {
        setContactStatsState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            total: Math.max(0, prev.total - 1),
            [deletedContact.status]: Math.max(0, prev[deletedContact.status] - 1),
          };
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete contact';
      setLoadError(message);
    }
  };

  useEffect(() => {
    if (location && location.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    const loadAdminData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [
          statsData,
          roomsData,
          bookingsData,
          usersData,
          contactsData,
          servicesData,
          serviceBookingsData,
          offersData,
          newslettersData,
        ] = await Promise.all([
          fetchJson('/api/admin/stats'),
          fetchJson('/api/admin/rooms'),
          fetchJson('/api/admin/bookings'),
          fetchJson('/api/admin/users'),
          fetchJson('/api/admin/contacts'),
          fetchJson('/api/admin/services'),
          fetchJson('/api/admin/service-bookings'),
          fetchJson('/api/admin/offers'),
          fetchJson('/api/admin/newsletters'),
        ]);

        setStatsState(statsData as AdminStats);
        setRoomsState((roomsData as any[]).map(normalizeRoom));
        setBookingsState(
          (bookingsData as any[]).map((booking) => ({
            id: booking._id || booking.id,
            roomId: booking.roomId,
            userId: booking.userId,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            bookingDate: booking.bookingDate,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            idVerified: booking.idVerified || 'pending',
            idProofUrl: booking.idProofUrl,
            idProofType: booking.idProofType,
            idProofUploadedAt: booking.idProofUploadedAt,
            totalPrice: booking.totalPrice,
          }))
        );
        setUsersState(
          (usersData as any[]).map((user) => ({
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          }))
        );
        setContactsState((contactsData as any).contacts || []);
        setContactStatsState((contactsData as any).stats || null);
        setServicesState((servicesData as any[]).map(normalizeService));
        setServiceBookingsState((serviceBookingsData as any[]).map(normalizeServiceBooking));
        setOffersState((offersData as any[]).map(normalizeOffer));
        setNewsletterSubscriptions(newslettersData as any[] || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load admin data';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };
    loadAdminData();
  }, [isAdmin]);

  // Load branding settings (logo, social links) from user profile
  useEffect(() => {
    const loadBrandingSettings = async () => {
      if (!isAdmin || !user) return;
      try {
        const token = getAuthToken();
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
            setBrandingSettings(prev => ({ ...prev, logoUrl: userData.logoUrl }));
          }
          if (userData.facebook) {
            setBrandingSettings(prev => ({ ...prev, facebook: userData.facebook }));
          }
          if (userData.instagram) {
            setBrandingSettings(prev => ({ ...prev, instagram: userData.instagram }));
          }
          if (userData.youtube) {
            setBrandingSettings(prev => ({ ...prev, youtube: userData.youtube }));
          }
          if (userData.twitter) {
            setBrandingSettings(prev => ({ ...prev, twitter: userData.twitter }));
          }
        }
      } catch (error) {
        console.error('Failed to load branding settings:', error);
      }
    };
    loadBrandingSettings();
  }, [isAdmin, user]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setBookingsPage(1);
  }, [bookingStatusFilter, bookingSearchQuery]);

  useEffect(() => {
    setServiceBookingsPage(1);
  }, [serviceBookingStatusFilter, serviceBookingSearchQuery, activeServiceBookingCategory]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Access Denied</h2>
          <p className="text-stone-600 mb-6">You don't have permission to access this page</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const stats = statsState || {
    totalRooms: roomsState.length,
    availableRooms: roomsState.filter(r => r.available).length,
    totalBookings: bookingsState.length,
    confirmedBookings: bookingsState.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookingsState.reduce((sum, b) => sum + b.totalPrice, 0),
    occupancyRate: roomsState.length
      ? Number(((bookingsState.filter(b => b.status === 'confirmed' || b.status === 'checked-in').length / roomsState.length) * 100).toFixed(1))
      : 0,
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'checked-in':
        return 'bg-blue-100 text-blue-800';
      case 'checked-out':
        return 'bg-stone-200 text-stone-800';
      default:
        return 'bg-stone-100 text-stone-800';
    }
  };

  const idVerifiedBadgeClass = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  const serviceCategoryLabel = (category: AdminService['category']) => {
    switch (category) {
      case 'dining':
        return 'In-room dining';
      case 'restaurant':
        return 'Restaurant';
      case 'spa':
        return 'Spa & wellness';
      case 'bar':
      default:
        return 'Bar & lounge';
    }
  };

  const serviceCategories = [
    { key: 'restaurant', label: 'Restaurant' },
    { key: 'dining', label: 'In-room dining' },
    { key: 'spa', label: 'Spa & wellness' },
    { key: 'bar', label: 'Bar & lounge' },
  ] as const;

  const recentBookings = [...bookingsState]
    .sort((a, b) => {
      const aDate = new Date(a.bookingDate || a.checkIn).getTime();
      const bDate = new Date(b.bookingDate || b.checkIn).getTime();
      return bDate - aDate;
    })
    .slice(0, 5);

  const recentServiceBookings = [...serviceBookingsState]
    .sort((a, b) => {
      const aDate = new Date(a.bookingDate || a.date).getTime();
      const bDate = new Date(b.bookingDate || b.date).getTime();
      return bDate - aDate;
    })
    .slice(0, 5);

  const filteredBookings = [...bookingsState]
    .filter((booking) => {
      if (bookingStatusFilter !== 'all' && booking.status !== bookingStatusFilter) {
        return false;
      }
      if (!bookingSearchQuery.trim()) return true;
      const query = bookingSearchQuery.toLowerCase();
      return (
        booking.guestName?.toLowerCase().includes(query) ||
        booking.guestPhone?.toLowerCase().includes(query) ||
        booking.guestEmail?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aDate = new Date(a.bookingDate || a.checkIn).getTime();
      const bDate = new Date(b.bookingDate || b.checkIn).getTime();
      return bDate - aDate; // newest first
    });

  const filteredServiceBookings = [...serviceBookingsState]
    .filter((booking) => {
      if (serviceBookingStatusFilter !== 'all' && booking.status !== serviceBookingStatusFilter) {
        return false;
      }
      if (!serviceBookingSearchQuery.trim()) return true;
      const query = serviceBookingSearchQuery.toLowerCase();
      return (
        booking.guestName?.toLowerCase().includes(query) ||
        booking.guestPhone?.toLowerCase().includes(query) ||
        booking.guestEmail?.toLowerCase().includes(query) ||
        booking.serviceName?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aDate = new Date(a.bookingDate || a.date).getTime();
      const bDate = new Date(b.bookingDate || b.date).getTime();
      return bDate - aDate; // newest first
    });

  // Pagination logic for bookings
  const bookingsTotalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const bookingsStartIndex = (bookingsPage - 1) * bookingsPerPage;
  const bookingsEndIndex = bookingsStartIndex + bookingsPerPage;
  const paginatedBookings = filteredBookings.slice(bookingsStartIndex, bookingsEndIndex);

  const selectedServiceForBooking = servicesState.find(
    (service) => service.id === serviceBookingForm.serviceId
  );
  const serviceBookingTimes = selectedServiceForBooking?.availableTimes || [];
  const servicesForActiveCategory = servicesState
    .filter((service) => service.category === activeServiceCategory)
    .slice(0, 5);
  
  const serviceBookingsForActiveCategory = filteredServiceBookings
    .filter((booking) => booking.category === activeServiceBookingCategory);
  
  // Pagination logic for service bookings (based on active category)
  const serviceBookingsTotalPages = Math.ceil(serviceBookingsForActiveCategory.length / serviceBookingsPerPage);
  const serviceBookingsStartIndex = (serviceBookingsPage - 1) * serviceBookingsPerPage;
  const serviceBookingsEndIndex = serviceBookingsStartIndex + serviceBookingsPerPage;
  const paginatedServiceBookings = serviceBookingsForActiveCategory.slice(serviceBookingsStartIndex, serviceBookingsEndIndex);
  
  const settingsInputClass =
    'mt-1 bg-[#2f3a32]/90 border border-[#5b6659] text-[#efece6] placeholder:text-[#cfc9bb] focus-visible:ring-2 focus-visible:ring-amber-500/60';

  const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    WiFi: Wifi,
    'Pool Access': Waves,
    Parking: Car,
    'Room Service': Coffee,
  };

  const formatOfferDateInput = (value?: string | Date | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  const resetRoomForm = () => {
    setRoomForm({
      name: '',
      type: 'Single',
      price: '',
      images: '',
      description: '',
      amenities: '',
      maxGuests: '',
      size: '20',
      available: true,
      location: '',
    });
    setRoomImageFiles([]);
    setRoomVideoFile(null);
  };

  const handleAddRoomClick = () => {
    setEditingRoomId(null);
    resetRoomForm();
    setIsRoomFormOpen(true);
  };

  const handleEditRoomClick = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomForm({
      name: room.name,
      type: room.type,
      price: room.price.toString(),
      images: room.images.join(', '),
      description: room.description,
      amenities: room.amenities.join(', '),
      maxGuests: room.maxGuests.toString(),
      size: room.size.toString(),
      available: room.available,
      location: room.location || '',
    });
    setRoomImageFiles([]);
    setIsRoomFormOpen(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await fetchJson(`/api/admin/rooms/${roomId}`, { method: 'DELETE' });
      setRoomsState((prev) => prev.filter((room) => room.id !== roomId));
      if (editingRoomId === roomId) {
        setEditingRoomId(null);
        setIsRoomFormOpen(false);
        resetRoomForm();
      }
    } catch (error) {
      setLoadError('Failed to delete room');
    }
  };

  const handleRoomSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const images = roomForm.images
      .split(',')
      .map((image) => image.trim())
      .filter(Boolean);

    const amenities = roomForm.amenities
      .split(',')
      .map((amenity) => amenity.trim())
      .filter(Boolean);

    const roomPayload = {
      name: roomForm.name.trim() || 'New Room',
      type: roomForm.type as Room['type'],
      price: Number(roomForm.price) || 0,
      images: images.length ? images : [],
      video: '',
      description: roomForm.description.trim(),
      amenities,
      maxGuests: Number(roomForm.maxGuests) || 1,
      size: Number(roomForm.size) || 0,
      available: roomForm.available,
      location: roomForm.location.trim(),
    };

    try {
      let roomId: string;
      let updatedRoom: any;

      if (editingRoomId) {
        updatedRoom = await fetchJson(`/api/admin/rooms/${editingRoomId}`, {
          method: 'PUT',
          body: JSON.stringify(roomPayload),
        });
        roomId = editingRoomId;
      } else {
        updatedRoom = await fetchJson('/api/admin/rooms', {
          method: 'POST',
          body: JSON.stringify(roomPayload),
        });
        roomId = updatedRoom._id || updatedRoom.id;
      }

      // Always preserve fields from roomPayload as the source of truth,
      // in case the server response is missing fields (e.g. location not yet
      // in the DB schema on older server versions).
      updatedRoom = { ...updatedRoom, location: updatedRoom.location ?? roomPayload.location };

      if (roomImageFiles.length > 0) {
        try {
          const formData = new FormData();
          roomImageFiles.forEach((file) => {
            formData.append('images', file);
          });

          const uploadResponse = await fetchJson(`/api/admin/rooms/${roomId}/upload-images`, {
            method: 'POST',
            body: formData,
            isFormData: true,
          });

          // Preserve location from the payload in case the upload response doesn't have it
          updatedRoom = { ...uploadResponse.room, location: uploadResponse.room?.location ?? roomPayload.location };
          toast.success('Room images uploaded successfully!');
        } catch (uploadError) {
          toast.error('Failed to upload room images.');
        }
      }

      if (roomVideoFile) {
        try {
          const formData = new FormData();
          formData.append('video', roomVideoFile);
          const uploadResponse = await fetchJson(`/api/admin/rooms/${roomId}/upload-video`, {
            method: 'POST',
            body: formData,
            isFormData: true,
          });
          const videoRoom = uploadResponse.room || updatedRoom;
          updatedRoom = { ...videoRoom, location: videoRoom.location ?? roomPayload.location };
          toast.success('Room video uploaded successfully!');
        } catch (uploadError) {
          toast.error('Failed to upload room video.');
        }
      }

      if (editingRoomId) {
        setRoomsState((prev) =>
          prev.map((room) => (room.id === editingRoomId ? normalizeRoom(updatedRoom) : room))
        );
      } else {
        setRoomsState((prev) => [normalizeRoom(updatedRoom), ...prev]);
      }

      toast.success(editingRoomId ? 'Room updated successfully!' : 'Room created successfully!');
      setIsRoomFormOpen(false);
      setEditingRoomId(null);
      resetRoomForm();
    } catch (error) {
      toast.error('Failed to save room. Please try again.');
      setLoadError('Failed to save room');
    }
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      category: 'dining',
      description: '',
      image: '',
      video: '',
      priceRange: '',
      availableTimes: '',
    });
    setServiceImageFile(null);
    setServiceVideoFile(null);
  };

  const handleAddServiceClick = () => {
    setEditingServiceId(null);
    resetServiceForm();
    setIsServiceFormOpen(true);
  };

  const handleEditServiceClick = (service: AdminService) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      category: service.category,
      description: service.description,
      image: service.image,
      video: service.video || '',
      priceRange: service.priceRange,
      availableTimes: service.availableTimes.join(', '),
    });
    setServiceImageFile(null);
    setServiceVideoFile(null);
    setIsServiceFormOpen(true);
  };

  const handleDeleteService = (serviceId: string) => {
    setServiceToDelete(serviceId);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setServiceDeleteLoading(true);
    try {
      await fetchJson(`/api/admin/services/${serviceToDelete}`, { method: 'DELETE' });
      setServicesState((prev) => prev.filter((service) => service.id !== serviceToDelete));
      if (editingServiceId === serviceToDelete) {
        setEditingServiceId(null);
        setIsServiceFormOpen(false);
        resetServiceForm();
      }
      setServiceToDelete(null);
    } catch (error) {
      setLoadError('Failed to delete service');
      setServiceToDelete(null);
    } finally {
      setServiceDeleteLoading(false);
    }
  };

  const handleServiceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const availableTimes = serviceForm.availableTimes
      .split(',')
      .map((time) => time.trim())
      .filter(Boolean);

    const payload = {
      name: serviceForm.name.trim() || 'New Service',
      category: serviceForm.category as AdminService['category'],
      description: serviceForm.description.trim(),
      image: serviceForm.image.trim(),
      video: serviceForm.video.trim(),
      priceRange: serviceForm.priceRange.trim(),
      availableTimes,
    };

    try {
      let serviceId: string;
      let updatedService: any;

      if (editingServiceId) {
        updatedService = await fetchJson(`/api/admin/services/${editingServiceId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        serviceId = editingServiceId;
      } else {
        updatedService = await fetchJson('/api/admin/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        serviceId = updatedService._id || updatedService.id;
      }

      if (serviceImageFile) {
        try {
          const formData = new FormData();
          formData.append('image', serviceImageFile);
          const uploadResponse = await fetchJson(`/api/admin/services/${serviceId}/upload-image`, {
            method: 'POST',
            body: formData,
            isFormData: true,
          });
          updatedService = uploadResponse.service || updatedService;
          toast.success('Service image uploaded successfully!');
        } catch (uploadError) {
          toast.error('Failed to upload service image.');
        }
      }

      if (serviceVideoFile) {
        try {
          const formData = new FormData();
          formData.append('video', serviceVideoFile);
          const uploadResponse = await fetchJson(`/api/admin/services/${serviceId}/upload-video`, {
            method: 'POST',
            body: formData,
            isFormData: true,
          });
          updatedService = uploadResponse.service || updatedService;
          toast.success('Service video uploaded successfully!');
        } catch (uploadError) {
          toast.error('Failed to upload service video.');
        }
      }

      if (editingServiceId) {
        setServicesState((prev) =>
          prev.map((service) => (service.id === editingServiceId ? normalizeService(updatedService) : service))
        );
      } else {
        setServicesState((prev) => [normalizeService(updatedService), ...prev]);
      }

      setIsServiceFormOpen(false);
      setEditingServiceId(null);
      resetServiceForm();
    } catch (error) {
      setLoadError('Failed to save service');
    }
  };

  const resetOfferForm = () => {
    setOfferForm({
      title: '',
      subtitle: '',
      description: '',
      price: '',
      rating: '4.9',
      reviewCount: '',
      badgeText: '',
      expiryDate: '',
      ctaText: 'Check availability',
      image: '',
      active: true,
    });
    setOfferImageFile(null);
  };

  const handleAddOfferClick = () => {
    setEditingOfferId(null);
    resetOfferForm();
    setIsOfferFormOpen(true);
  };

  const handleEditOfferClick = (offer: AdminOffer) => {
    setEditingOfferId(offer.id);
    setOfferForm({
      title: offer.title,
      subtitle: offer.subtitle,
      description: offer.description,
      price: offer.price.toString(),
      rating: offer.rating.toString(),
      reviewCount: offer.reviewCount.toString(),
      badgeText: offer.badgeText,
      expiryDate: formatOfferDateInput(offer.expiryDate),
      ctaText: offer.ctaText,
      image: offer.image,
      active: offer.active,
    });
    setOfferImageFile(null);
    setIsOfferFormOpen(true);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) {
      return;
    }

    try {
      await fetchJson(`/api/admin/offers/${offerId}`, { method: 'DELETE' });
      setOffersState((prev) => prev.filter((offer) => offer.id !== offerId));
      if (editingOfferId === offerId) {
        setEditingOfferId(null);
        setIsOfferFormOpen(false);
        resetOfferForm();
      }
    } catch (error) {
      setLoadError('Failed to delete offer');
    }
  };

  const handleOfferSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      title: offerForm.title.trim(),
      subtitle: offerForm.subtitle.trim(),
      description: offerForm.description.trim(),
      price: Number(offerForm.price) || 0,
      rating: Number(offerForm.rating) || 4.9,
      reviewCount: Number(offerForm.reviewCount) || 0,
      badgeText: offerForm.badgeText.trim(),
      expiryDate: offerForm.expiryDate || null,
      ctaText: offerForm.ctaText.trim(),
      image: offerForm.image.trim(),
      active: offerForm.active,
    };

    try {
      let offerId: string;
      let updatedOffer: any;

      if (editingOfferId) {
        updatedOffer = await fetchJson(`/api/admin/offers/${editingOfferId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        offerId = editingOfferId;
      } else {
        updatedOffer = await fetchJson('/api/admin/offers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        offerId = updatedOffer._id || updatedOffer.id;
      }

      if (offerImageFile) {
        try {
          const formData = new FormData();
          formData.append('image', offerImageFile);
          const uploadResponse = await fetchJson(`/api/admin/offers/${offerId}/upload-image`, {
            method: 'POST',
            body: formData,
            isFormData: true,
          });
          updatedOffer = uploadResponse.offer || updatedOffer;
          toast.success('Offer image uploaded successfully!');
        } catch (uploadError) {
          toast.error('Failed to upload offer image.');
        }
      }

      if (editingOfferId) {
        setOffersState((prev) =>
          prev.map((offer) => (offer.id === editingOfferId ? normalizeOffer(updatedOffer) : offer))
        );
      } else {
        setOffersState((prev) => [normalizeOffer(updatedOffer), ...prev]);
      }

      setIsOfferFormOpen(false);
      setEditingOfferId(null);
      resetOfferForm();
    } catch (error) {
      setLoadError('Failed to save offer');
    }
  };

  const toggleServiceBookingCategory = (categoryKey: string) => {
    const newSet = new Set(expandedServiceBookingCategories);
    if (newSet.has(categoryKey)) {
      newSet.delete(categoryKey);
    } else {
      newSet.add(categoryKey);
    }
    setExpandedServiceBookingCategories(newSet);
  };

  const handleExportBookings = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `bookings_backup_${timestamp}.json`;
    const dataStr = JSON.stringify(bookingsState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBookings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text) as AdminBooking[];

      if (!Array.isArray(importedData)) {
        alert('Invalid file format. Expected an array of bookings.');
        return;
      }

      const valid = importedData.every(
        (booking) =>
          booking.id &&
          booking.roomId &&
          booking.guestName &&
          booking.guestEmail &&
          booking.guestPhone &&
          booking.checkIn &&
          booking.checkOut &&
          booking.status
      );

      if (!valid) {
        alert('Some bookings are missing required fields. Please check the file.');
        return;
      }

      const response = await fetchJson('/api/admin/bookings/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ bookings: importedData }),
      });

      if (response.success) {
        const bookings = await fetchJson('/api/admin/bookings');
        setBookingsState(
          (bookings as any[]).map((booking) => ({
            id: booking._id || booking.id,
            roomId: booking.roomId,
            userId: booking.userId,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            bookingDate: booking.bookingDate,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            idVerified: booking.idVerified || 'pending',
            idProofUrl: booking.idProofUrl,
            idProofType: booking.idProofType,
            idProofUploadedAt: booking.idProofUploadedAt,
            totalPrice: booking.totalPrice,
          }))
        );
        alert(`Successfully imported ${response.count} bookings!`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import bookings. Please check the file format.';
      alert(message);
    }
  };

  const handleExportBookingsToExcel = async () => {
    try {
      const { utils, writeFile } = await import('xlsx');
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `bookings_${timestamp}.xlsx`;

      const data = bookingsState.map((booking) => ({
        'Booking ID': booking.id,
        'Guest Name': booking.guestName,
        'Guest Email': booking.guestEmail,
        'Guest Phone': booking.guestPhone || '',
        'Room ID': booking.roomId,
        'Check-In': new Date(booking.checkIn).toLocaleDateString(),
        'Check-Out': new Date(booking.checkOut).toLocaleDateString(),
        'Status': booking.status,
        'ID Verified': booking.idVerified || 'pending',
        'Total Price': booking.totalPrice,
        'Payment Status': booking.paymentStatus || 'pending',
      }));

      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Bookings');
      writeFile(wb, filename);
    } catch (error) {
      alert('Failed to export bookings to Excel');
    }
  };

  const handleImportBookingsFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const { read, utils } = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer, { type: 'array', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet) as any[];

      const toIsoDate = (value: unknown) => {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          return value.toISOString();
        }

        if (typeof value === 'number') {
          const excelEpoch = new Date(Date.UTC(1899, 11, 30));
          const millis = excelEpoch.getTime() + value * 86400000;
          const date = new Date(millis);
          return Number.isNaN(date.getTime()) ? null : date.toISOString();
        }

        if (typeof value === 'string' && value.trim()) {
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? null : date.toISOString();
        }

        return null;
      };

      const invalidRows: number[] = [];

      const bookings = jsonData
        .map((row, index) => {
          const roomId = String(row['Room ID'] ?? '').trim();
          const guestName = String(row['Guest Name'] ?? '').trim();
          const guestEmail = String(row['Guest Email'] ?? '').trim();
          const guestPhone = String(row['Guest Phone'] ?? '').trim() || 'N/A';
          const checkIn = toIsoDate(row['Check-In']);
          const checkOut = toIsoDate(row['Check-Out']);

          if (!roomId || !guestName || !guestEmail || !checkIn || !checkOut) {
            invalidRows.push(index + 2);
            return null;
          }

          const rawPaymentStatus = String(row['Payment Status'] ?? '').trim().toLowerCase();
          const paymentStatus = rawPaymentStatus === 'completed' ? 'paid' : rawPaymentStatus || 'pending';

          return {
            id: row['Booking ID'] || `BOOKING-${Date.now()}-${index}`,
            roomId,
            guestName,
            guestEmail,
            guestPhone,
            checkIn,
            checkOut,
            status: row['Status'] || 'confirmed',
            idVerified: row['ID Verified'] || 'pending',
            totalPrice: parseFloat(row['Total Price']) || 0,
            paymentStatus,
          };
        })
        .filter(Boolean);

      if (invalidRows.length > 0) {
        alert(`Missing required fields in rows: ${invalidRows.join(', ')}`);
        return;
      }

      const response = await fetchJson('/api/admin/bookings/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ bookings }),
      });

      if (response.success) {
        const updatedBookings = await fetchJson('/api/admin/bookings');
        setBookingsState(
          (updatedBookings as any[]).map((booking) => ({
            id: booking._id || booking.id,
            roomId: booking.roomId,
            userId: booking.userId,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            bookingDate: booking.bookingDate,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            idVerified: booking.idVerified || 'pending',
            idProofUrl: booking.idProofUrl,
            idProofType: booking.idProofType,
            idProofUploadedAt: booking.idProofUploadedAt,
            totalPrice: booking.totalPrice,
          }))
        );
        alert(`Successfully imported ${response.count} bookings!`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import bookings from Excel';
      alert(message);
    }
    event.target.value = '';
  };

  const handleAddServiceBookingClick = () => {
    setServiceBookingForm({
      serviceId: '',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      date: '',
      time: '',
      guests: '1',
      status: 'pending',
      specialRequests: '',
      paymentStatus: 'pending',
    });
    setIsServiceBookingFormOpen(true);
  };

  const handleSaveServiceBooking = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const payload = {
        serviceId: serviceBookingForm.serviceId,
        guestName: serviceBookingForm.guestName.trim(),
        guestEmail: serviceBookingForm.guestEmail.trim(),
        guestPhone: serviceBookingForm.guestPhone.trim().replace(/^\+/, ''),
        date: new Date(serviceBookingForm.date).toISOString(),
        time: serviceBookingForm.time.trim(),
        guests: Number(serviceBookingForm.guests) || 1,
        status: 'pending',
        specialRequests: serviceBookingForm.specialRequests.trim(),
        paymentStatus: serviceBookingForm.paymentStatus || 'pending',
      };

      const response = await fetchJson('/api/admin/service-bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response) {
        const updated = await fetchJson('/api/admin/service-bookings');
        setServiceBookingsState((updated as any[]).map(normalizeServiceBooking));
        setIsServiceBookingFormOpen(false);
        alert('Service booking created successfully!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save service booking';
      alert(message);
    }
  };

  const handleExportServiceBookingsToExcel = async () => {
    try {
      const { utils, writeFile } = await import('xlsx');
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `service_bookings_${timestamp}.xlsx`;

      const data = serviceBookingsState.map((booking) => ({
        'Booking ID': booking.id,
        'Service ID': booking.serviceId,
        'Service Name': booking.serviceName,
        'Category': booking.category,
        'Date': new Date(booking.date).toLocaleDateString(),
        'Time': booking.time,
        'Guests': booking.guests,
        'Guest Name': booking.guestName,
        'Guest Email': booking.guestEmail,
        'Guest Phone': booking.guestPhone,
        'Status': booking.status,
        'Special Requests': booking.specialRequests || '',
      }));

      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'ServiceBookings');
      writeFile(wb, filename);
    } catch (error) {
      alert('Failed to export service bookings to Excel');
    }
  };

  const handleDeleteNewsletterSubscription = async (id: string) => {
    try {
      await fetchJson(`/api/admin/newsletters/${id}`, { method: 'DELETE' });
      toast.success('Subscription deleted');
      setNewsletterSubscriptions(prev => prev.filter(sub => sub._id !== id));
    } catch (error) {
      toast.error('Failed to delete subscription');
    }
  };

  const handleExportNewsletterSubscriptions = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/admin/newsletters/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export subscriptions');
      }

      const csv = await response.text();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'newsletter-subscriptions.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Exported subscriptions');
    } catch (error) {
      toast.error('Failed to export subscriptions');
    }
  };

  const handleImportServiceBookingsFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const { read, utils } = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer, { type: 'array', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet) as any[];

      const toIsoDate = (value: unknown) => {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          return value.toISOString();
        }

        if (typeof value === 'number') {
          const excelEpoch = new Date(Date.UTC(1899, 11, 30));
          const millis = excelEpoch.getTime() + value * 86400000;
          const date = new Date(millis);
          return Number.isNaN(date.getTime()) ? null : date.toISOString();
        }

        if (typeof value === 'string' && value.trim()) {
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? null : date.toISOString();
        }

        return null;
      };

      const invalidRows: number[] = [];
      const allowedStatuses = new Set(['pending', 'confirmed', 'cancelled']);

      // Debug: Log column names from first row to see what we're working with
      if (jsonData.length > 0) {
        console.log('Excel column names found:', Object.keys(jsonData[0]));
        console.log('First row sample:', jsonData[0]);
      }

      const bookings = jsonData
        .map((row, index) => {
          // Try multiple possible column name variations
          const serviceId = String(row['Service ID'] ?? row['serviceId'] ?? row['ServiceID'] ?? '').trim();
          const serviceName = String(row['Service Name'] ?? row['serviceName'] ?? row['ServiceName'] ?? '').trim();
          const guestName = String(row['Guest Name'] ?? row['guestName'] ?? row['GuestName'] ?? '').trim();
          const guestEmail = String(row['Guest Email'] ?? row['guestEmail'] ?? row['GuestEmail'] ?? '').trim();
          const guestPhone = String(row['Guest Phone'] ?? row['guestPhone'] ?? row['GuestPhone'] ?? '').trim() || 'N/A';
          const date = toIsoDate(row['Date'] ?? row['date']);
          const time = String(row['Time'] ?? row['time'] ?? '').trim();
          const guests = Number(row['Guests'] ?? row['guests'] ?? 1) || 1;
          const statusRaw = String(row['Status'] ?? row['status'] ?? '').trim().toLowerCase();
          const status = allowedStatuses.has(statusRaw) ? statusRaw : 'pending';

          if ((!serviceId && !serviceName) || !guestName || !guestEmail || !date || !time) {
            invalidRows.push(index + 2);
            if (index === 0) {
              console.log('First row validation failed:', {
                serviceId,
                serviceName,
                guestName,
                guestEmail,
                date,
                time,
                guests,
                rowKeys: Object.keys(row)
              });
            }
            return null;
          }

          return {
            id: row['Booking ID'] ?? row['bookingId'] ?? row['BookingID'] ?? `SERVICE-${Date.now()}-${index}`,
            serviceId: serviceId || undefined,
            serviceName: serviceName || undefined,
            category: row['Category'] ?? row['category'] ?? undefined,
            date,
            time,
            guests,
            guestName,
            guestEmail,
            guestPhone,
            status,
            specialRequests: row['Special Requests'] ?? row['specialRequests'] ?? row['SpecialRequests'] ?? '',
          };
        })
        .filter(Boolean);

      if (invalidRows.length > 0) {
        alert(`Missing required fields in rows: ${invalidRows.join(', ')}`);
        return;
      }

      if (bookings.length === 0) {
        alert('No valid bookings found in the file. Please check your Excel file format.');
        return;
      }

      // Debug: Log first booking to see what we're sending
      console.log('Sample booking data being sent:', JSON.stringify(bookings[0], null, 2));
      console.log('All bookings being sent:', JSON.stringify(bookings.slice(0, 3), null, 2));
      console.log('Total bookings to import:', bookings.length);

      const response = await fetchJson('/api/admin/service-bookings/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ bookings }),
      });

      if (response.success) {
        const updated = await fetchJson('/api/admin/service-bookings');
        setServiceBookingsState((updated as any[]).map(normalizeServiceBooking));
        let message = `Successfully imported ${response.count} service booking(s)!`;
        if (response.errors && response.errors.length > 0) {
          message += `\n\n⚠️ ${response.errors.length} row(s) had errors:\n${response.errors.slice(0, 10).join('\n')}`;
          if (response.errors.length > 10) {
            message += `\n... and ${response.errors.length - 10} more error(s)`;
          }
        }
        toast.success(message);
      }
    } catch (error) {
      let message = 'Failed to import service bookings from Excel';
      let errorDetails: any = null;
      
      // Try to extract detailed error message from response
      if (error instanceof Error) {
        // Check if errorData was attached
        if ((error as any).errorData) {
          errorDetails = (error as any).errorData;
        } else {
          const errorMatch = error.message.match(/Request failed \(400\): (.+)/);
          if (errorMatch) {
            try {
              errorDetails = JSON.parse(errorMatch[1]);
            } catch {
              message = errorMatch[1];
            }
          }
        }
      }
      
      if (errorDetails) {
        if (errorDetails.errors && Array.isArray(errorDetails.errors) && errorDetails.errors.length > 0) {
          message = `Import failed:\n\n${errorDetails.errors.slice(0, 10).join('\n')}`;
          if (errorDetails.errors.length > 10) {
            message += `\n... and ${errorDetails.errors.length - 10} more error(s)`;
          }
        } else if (errorDetails.message) {
          message = errorDetails.message;
          if (errorDetails.errors && Array.isArray(errorDetails.errors) && errorDetails.errors.length > 0) {
            message += `\n\nErrors:\n${errorDetails.errors.slice(0, 10).join('\n')}`;
          }
        }
      }
      
      // Show error in alert for better visibility (toast might be too small)
      console.error('Import error:', error);
      console.error('Error details:', errorDetails);
      console.error('Full error object:', JSON.stringify(errorDetails, null, 2));
      
      // Build comprehensive error message
      if (errorDetails) {
        if (errorDetails.errors && Array.isArray(errorDetails.errors) && errorDetails.errors.length > 0) {
          message = `Import Failed!\n\n${errorDetails.message || 'No valid bookings to import'}\n\nErrors found:\n${errorDetails.errors.slice(0, 15).join('\n')}`;
          if (errorDetails.errors.length > 15) {
            message += `\n... and ${errorDetails.errors.length - 15} more error(s)`;
          }
        } else {
          message = errorDetails.message || message;
          if (errorDetails.totalRows !== undefined) {
            message += `\n\nTotal rows: ${errorDetails.totalRows}`;
            message += `\nValid rows: ${errorDetails.validRows || 0}`;
            message += `\nInvalid rows: ${errorDetails.invalidRows || errorDetails.totalRows}`;
          }
        }
      }
      
      alert(message);
      toast.error('Import failed - see alert for details', { duration: 5000 });
    }

    event.target.value = '';
  };

  const handleAddBookingClick = () => {
    setEditingBookingId(null);
    setBookingForm({
      roomId: '',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      checkIn: '',
      checkOut: '',
      status: 'pending',
      totalPrice: '',
    });
    setBookingIdProofFile(null);
    setBookingIdProofType('passport');
    setIsBookingFormOpen(true);
  };

  const handleSaveBooking = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const payload = {
        roomId: bookingForm.roomId,
        guestName: bookingForm.guestName.trim(),
        guestEmail: bookingForm.guestEmail.trim(),
        guestPhone: bookingForm.guestPhone.trim().replace(/^\+/, ''),
        checkIn: new Date(bookingForm.checkIn).toISOString(),
        checkOut: new Date(bookingForm.checkOut).toISOString(),
        status: bookingForm.status,
        totalPrice: parseFloat(bookingForm.totalPrice) || 0,
        guests: 1,
        rooms: 1,
        roomPrice: parseFloat(bookingForm.totalPrice) || 0,
        taxes: 0,
        serviceCharges: 0,
        userId: user?.id || '1',
        paymentStatus: 'pending',
      };

      const response = await fetchJson('/api/admin/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response) {
        if (bookingIdProofFile) {
          const bookingId = response._id || response.id;
          if (bookingId) {
            const token = getAuthToken();
            const formData = new FormData();
            formData.append('idProof', bookingIdProofFile);
            formData.append('idType', bookingIdProofType);

            const uploadResponse = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/id-proof`, {
              method: 'PATCH',
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              body: formData,
            });

            if (!uploadResponse.ok) {
              let message = `ID upload failed (${uploadResponse.status})`;
              try {
                const data = await uploadResponse.json();
                if (data?.message) {
                  message = data.message;
                }
              } catch {
                // ignore
              }
              throw new Error(message);
            }
          }
        }

        const bookings = await fetchJson('/api/admin/bookings');
        setBookingsState(
          (bookings as any[]).map((booking) => ({
            id: booking._id || booking.id,
            roomId: booking.roomId,
            userId: booking.userId,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            bookingDate: booking.bookingDate,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            idVerified: booking.idVerified || 'pending',
            idProofUrl: booking.idProofUrl,
            idProofType: booking.idProofType,
            idProofUploadedAt: booking.idProofUploadedAt,
            totalPrice: booking.totalPrice,
          }))
        );
        setIsBookingFormOpen(false);
        alert('Booking created successfully!');
      }
    } catch (error) {
      alert('Failed to save booking');
    }
  };

  // Swipeable Booking Row Component
  const SwipeableBookingRow = ({
    booking,
    room,
    isMobile,
    swipedBookingId,
    setSwipedBookingId,
    onIdVerificationChange,
    onUpdateStatus
  }: {
    booking: AdminBooking;
    room: Room | undefined;
    isMobile: boolean;
    swipedBookingId: string | null;
    setSwipedBookingId: (id: string | null) => void;
    onIdVerificationChange: (booking: AdminBooking, status: 'approved' | 'rejected') => void;
    onUpdateStatus: (id: string, status: string, paymentStatus?: string, paymentMethod?: 'cash' | 'online') => void;
  }) => {
    // Swipe functionality disabled: react-swipeable removed for build compatibility
    // const swipeHandlers = useSwipeable({
    //   onSwipedLeft: () => setSwipedBookingId(booking.id),
    //   onSwipedRight: () => setSwipedBookingId(null),
    //   trackMouse: false,
    // });

    // Desktop view
    if (!isMobile) {
      return (
        <tr className="border-b border-stone-100 hover:bg-stone-50">
          <td className="py-4 px-4">{booking.id}</td>
          <td className="py-4 px-4">
            <div>{booking.guestName}</div>
            <div className="text-sm text-stone-600">{booking.guestEmail}</div>
          </td>
          <td className="py-4 px-4">{(booking.guestPhone || 'N/A').replace(/^\+/, '')}</td>
          <td className="py-4 px-4">{room?.name}</td>
          <td className="py-4 px-4">
            <div className="text-sm">
              {new Date(booking.checkIn).toLocaleDateString()} -
            </div>
            <div className="text-sm">
              {new Date(booking.checkOut).toLocaleDateString()}
            </div>
          </td>
          <td className="py-4 px-4">
            <div className="flex flex-col gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${statusBadgeClass(booking.status)}`}>
                {booking.status === 'checked-in' ? 'Check-In' : booking.status === 'checked-out' ? 'Check-Out' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              {/* Show Check-In button if status is confirmed and ID is approved */}
              {booking.status === 'confirmed' && booking.idVerified === 'approved' && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-auto"
                  onClick={() => {
                    if (window.confirm("Check in this guest now?")) {
                      onUpdateStatus(booking.id, 'checked-in');
                    }
                  }}
                >
                  <LogIn className="w-3 h-3 mr-1" />
                  Check-In
                </Button>
              )}
              {/* Show Check-Out button if status is checked-in */}
              {booking.status === 'checked-in' && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 h-auto"
                  onClick={() => {
                    if (window.confirm("Confirm Check-Out for this guest?")) {
                      onUpdateStatus(booking.id, 'checked-out');
                    }
                  }}
                >
                  <DoorOpen className="w-3 h-3 mr-1" />
                  Check-Out
                </Button>
              )}
            </div>
          </td>
          <td className="py-4 px-4">
            {booking.idProofUrl ? (
              <div className="space-y-1">
                <a
                  href={`${API_BASE}${booking.idProofUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View ID
                </a>
                <div className="text-xs text-stone-500">
                  {booking.idProofType ? booking.idProofType.replace(/-/g, ' ') : 'Document'}
                </div>
                {booking.idProofUploadedAt && (
                  <div className="text-xs text-stone-500">
                    {new Date(booking.idProofUploadedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-stone-500">Not uploaded</span>
            )}
          </td>
          <td className="py-4 px-4">
            <span className={`px-3 py-1 rounded-full text-sm ${idVerifiedBadgeClass(booking.idVerified)}`}>
              {booking.idVerified || 'pending'}
            </span>
          </td>
          <td className="py-4 px-4">
            <span className={`px-3 py-1 rounded-full text-sm ${booking.paymentStatus === 'paid'
              ? 'bg-green-100 text-green-800'
              : booking.paymentStatus === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
              }`}>
              {booking.paymentStatus || 'pending'}
            </span>
            <div className="mt-1 text-xs text-stone-600">
              Pending Amount: ₹{booking.paymentStatus === 'paid' ? 0 : booking.totalPrice.toFixed(2)}
            </div>
          </td>
          <td className="py-4 px-4">₹{booking.totalPrice.toFixed(2)}</td>
          <td className="py-4 px-4">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {booking.idVerified === 'pending' && (
                    <>
                      <DropdownMenuItem onClick={() => onIdVerificationChange(booking, 'approved')}>Approve</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onIdVerificationChange(booking, 'rejected')}>Reject</DropdownMenuItem>
                    </>
                  )}
                  {/* Pay Now button if payment is not paid and checked-in */}
                  {booking.status === 'checked-in' && booking.paymentStatus !== 'paid' && (
                    <DropdownMenuItem>
                      <div className="flex flex-col">
                        <span className="font-semibold mb-1">Pay Now</span>
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await onUpdateStatus(booking.id, 'checked-in', 'paid', 'cash');
                                setBookingsState((prev) => prev.map(b => b.id === booking.id ? { ...b, paymentMethod: 'cash', paymentStatus: 'paid' } : b));
                                window.location.reload();
                              } catch { }
                            }}
                          >
                            Cash
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await onUpdateStatus(booking.id, 'checked-in', 'paid', 'online');
                                setBookingsState((prev) => prev.map(b => b.id === booking.id ? { ...b, paymentMethod: 'online', paymentStatus: 'paid' } : b));
                                window.location.reload();
                              } catch { }
                            }}
                          >
                            Online
                          </button>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </td>
        </tr>
      );
    }

    // Mobile view: remove actions field, show actions only on three dots click
    return (
      <tr className="border-b border-stone-100 hover:bg-stone-50" style={{ position: 'relative' }}>
        <td colSpan={11} style={{ padding: 0, background: 'transparent', position: 'relative' }}>
          <div className={`flex w-full transition-transform duration-300 ${swipedBookingId === booking.id ? 'translate-x-[-120px]' : ''}`}>
            {/* Swipeable fields */}
            <div className="flex-1 grid grid-cols-11">
              <div className="py-4 px-4">{booking.id}</div>
              <div className="py-4 px-4">
                <div>{booking.guestName}</div>
                <div className="text-sm text-stone-600">{booking.guestEmail}</div>
              </div>
              <div className="py-4 px-4">{(booking.guestPhone || 'N/A').replace(/^\+/, '')}</div>
              <div className="py-4 px-4">{room?.name}</div>
              <div className="py-4 px-4">
                <div className="text-sm">
                  {new Date(booking.checkIn).toLocaleDateString()} -
                </div>
                <div className="text-sm">
                  {new Date(booking.checkOut).toLocaleDateString()}
                </div>
              </div>
              <div className="py-4 px-4">
                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${statusBadgeClass(booking.status)}`}>
                    {booking.status === 'checked-in' ? 'Check-In' : booking.status === 'checked-out' ? 'Check-Out' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  {/* Show Check-In button if status is confirmed and ID is approved */}
                  {booking.status === 'confirmed' && booking.idVerified === 'approved' && (
                    <button
                      className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs flex items-center gap-1"
                      onClick={() => {
                        if (window.confirm("Check in this guest now?")) {
                          onUpdateStatus(booking.id, 'checked-in');
                        }
                      }}
                    >
                      <LogIn className="w-3 h-3" />
                      Check-In
                    </button>
                  )}
                  {/* Show Check-Out button if status is checked-in */}
                  {booking.status === 'checked-in' && (
                    <button
                      className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs flex items-center gap-1"
                      onClick={() => {
                        if (window.confirm("Confirm Check-Out for this guest?")) {
                          onUpdateStatus(booking.id, 'checked-out');
                        }
                      }}
                    >
                      <DoorOpen className="w-3 h-3" />
                      Check-Out
                    </button>
                  )}
                </div>
              </div>
              <div className="py-4 px-4">
                {booking.idProofUrl ? (
                  <div className="space-y-1">
                    <a
                      href={`${API_BASE}${booking.idProofUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View ID
                    </a>
                    <div className="text-xs text-stone-500">
                      {booking.idProofType ? booking.idProofType.replace(/-/g, ' ') : 'Document'}
                    </div>
                    {booking.idProofUploadedAt && (
                      <div className="text-xs text-stone-500">
                        {new Date(booking.idProofUploadedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-stone-500">Not uploaded</span>
                )}
              </div>
              <div className="py-4 px-4">
                <span className={`px-3 py-1 rounded-full text-sm ${idVerifiedBadgeClass(booking.idVerified)}`}>
                  {booking.idVerified || 'pending'}
                </span>
              </div>
              <div className="py-4 px-4">
                <span className={`px-3 py-1 rounded-full text-sm ${booking.paymentStatus === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : booking.paymentStatus === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                  }`}>
                  {booking.paymentStatus === 'paid' && booking.paymentMethod === 'cash' && 'Paid (Cash)'}
                  {booking.paymentStatus === 'paid' && booking.paymentMethod === 'online' && 'Paid (Online)'}
                  {booking.paymentStatus !== 'paid' && (booking.paymentStatus || 'pending')}
                </span>
              </div>
              <div className="py-4 px-4">₹{booking.totalPrice.toFixed(2)}</div>
            </div>
            {/* Three dots for actions */}
            <div style={{ minWidth: 48, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {booking.idVerified === 'pending' && (
                    <>
                      <DropdownMenuItem onClick={() => onIdVerificationChange(booking, 'approved')}>Approve</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onIdVerificationChange(booking, 'rejected')}>Reject</DropdownMenuItem>
                    </>
                  )}
                  {/* Pay Now button if payment is not paid and checked-in */}
                  {booking.status === 'checked-in' && booking.paymentStatus !== 'paid' && (
                    <DropdownMenuItem>
                      <div className="flex flex-col">
                        <span className="font-semibold mb-1">Pay Now</span>
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await onUpdateStatus(booking.id, 'checked-in', 'paid', 'cash');
                                setBookingsState((prev) => prev.map(b => b.id === booking.id ? { ...b, paymentMethod: 'cash', paymentStatus: 'paid' } : b));
                                window.location.reload();
                              } catch { }
                            }}
                          >
                            Cash
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await onUpdateStatus(booking.id, 'checked-in', 'paid', 'online');
                                setBookingsState((prev) => prev.map(b => b.id === booking.id ? { ...b, paymentMethod: 'online', paymentStatus: 'paid' } : b));
                                window.location.reload();
                              } catch { }
                            }}
                          >
                            Online
                          </button>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // Pagination Component
  const PaginationControls = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    startIndex,
    endIndex,
  }: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
    startIndex: number;
    endIndex: number;
  }) => {
    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-stone-200">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <span className="text-xs sm:text-sm text-stone-600 text-center sm:text-left">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} bookings
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-3 py-2 sm:py-1.5 rounded-lg border border-stone-300 bg-white text-xs sm:text-sm text-stone-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 min-h-[44px] sm:min-h-0"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 text-xs sm:text-sm px-3 sm:px-4"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1 overflow-x-auto">
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-1 sm:px-2 text-stone-400 text-xs sm:text-sm">...</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={
                    currentPage === page
                      ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 text-xs sm:text-sm"
                      : "border-stone-300 text-stone-700 hover:bg-stone-50 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 text-xs sm:text-sm"
                  }
                >
                  {page}
                </Button>
              )
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 text-xs sm:text-sm px-3 sm:px-4"
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-theme min-h-screen bg-[#3f4a40] text-[#f5f1e8] relative overflow-hidden pt-10 pl-0">
      {/* Background Gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(88,105,90,0.35), transparent 55%), radial-gradient(circle at 85% 60%, rgba(98,120,100,0.35), transparent 60%), linear-gradient(180deg, rgba(23,30,24,0.9), rgba(23,30,24,0.55))',
        }}
      />
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[linear-gradient(180deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:100%_160px]" />

      <div className="relative w-full flex flex-col lg:flex-row lg:pl-17">
        {/* Hamburger menu for mobile */}
        {/* {isMobile && !isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-20 left-4 z-40 p-2 rounded-lg bg-white shadow-md text-gray-700 hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )} */}

        {/* Overlay for mobile when sidebar is open */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Container */}
        <div
          id="admin-sideview"
          className={`fixed inset-y-0 left-0 z-50 bg-[#1c1f1c] border-r border-[#2e352c] shadow-[0_25px_60px_rgba(0,0,0,0.6)] transition-all duration-300 flex flex-col ${
            isMobile 
              ? (isSidebarOpen ? 'w-[280px] translate-x-0' : '-translate-x-full')
              : (isSidebarOpen ? 'w-70' : 'w-20')
          }`}
        >
          {/* Header Section */}
          <div className={`py-6 flex flex-col ${isSidebarOpen ? 'items-start px-6' : 'items-center px-2'} mb-4`}>
           
            {!isMobile && (
              <div className="flex items-center justify-between w-full">
                {isSidebarOpen && (
                  <div>
                    <h2 className="text-2xl font-serif tracking-wide text-[#f6edda]">Admin Panel</h2>
                    <p className="text-[#cbbfa8] text-sm">Admin User</p>
                  </div>
                )}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className=" m-4 rounded-lg hover:bg-[#2d342d] text-[#cbbfa8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#e7d6ad]"
                  aria-label={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            )}

            
            {isMobile && isSidebarOpen && (
              <div className="flex items-center justify-between w-full">
                <div>
                  <h2 className="text-xl font-serif tracking-wide text-[#f6edda]">Admin Panel</h2>
                  <p className="text-[#cbbfa8] text-xs">Admin User</p>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-[#2d342d] text-[#cbbfa8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#e7d6ad]"
                  aria-label="Close Sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 flex flex-col gap-2 px-2 overflow-y-auto custom-scrollbar">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'rooms', icon: Edit, label: 'Manage Rooms' },
              { id: 'services', icon: Bell, label: 'Manage Services' },
              { id: 'offers', icon: Tag, label: 'Manage Offers' },
              { id: 'bookings', icon: Calendar, label: 'Bookings' },
              { id: 'service-bookings', icon: ClipboardList, label: 'Service Bookings' },
              { id: 'payments', icon: FaIndianRupeeSign, label: 'Payments' },
              { id: 'contact-messages', icon: Mail, label: 'Contact Messages', section: 'contacts' },
              { id: 'newsletter', icon: MdSubscriptions, label: 'News Letter', section: 'newsletter' },
              { id: 'guests', icon: Users, label: 'Guests' },
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.section) {
                      setActiveTab(item.section);
                    } else {
                      handleNavSelect(item.id);
                    }
                    // Close sidebar on mobile after selection
                    if (isMobile) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`group flex items-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#e7d6ad] ${activeTab === (item.section || item.id)
                    ? 'bg-[#e7d6ad] text-[#1b1e18] rounded-2xl shadow-md'
                    : 'text-[#cbbfa8] hover:bg-[#2d342d] hover:text-[#fff1d6] rounded-2xl'
                    } ${isSidebarOpen ? 'gap-4 justify-start px-4 py-3' : 'justify-center p-3'}`}
                  title={!isSidebarOpen ? item.label : ''}
                >
                  <IconComponent className={`w-5 h-5 shrink-0 ${activeTab === (item.section || item.id) ? 'text-[#1b1e18]' : ''}`} />
                  {isSidebarOpen && (
                    <span className="text-[15px] font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Section */}

          <div className={`p-4 mt-auto border-t border-[#3f473d] ${isSidebarOpen ? 'px-6' : 'px-2'}`}>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to logout?")) {
                    logout();
                    navigate('/login');
                  }
                }}
                className={`flex items-center transition-all focus:outline-none focus:ring-2 focus:ring-red-400 ${isSidebarOpen
                  ? 'gap-4 justify-start px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl'
                  : 'justify-center p-3 text-red-400 hover:bg-red-500/10 rounded-2xl'
                  }`}
                title={!isSidebarOpen ? 'Logout' : ''}
              >
                <LogOut className="w-5 h-5" />
                {isSidebarOpen && <span className="text-[15px] font-medium">Logout</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 w-full ${isSidebarOpen && !isMobile ? 'lg:ml-72' : ''}`}>
          <div className="p-0 sm:p-4 md:p-6 lg:p-8 relative pt-20 sm:pt-24 lg:pt-8 pb-20 md:pb-8">
            {isLoading && (
              <div className="mb-0 sm:mb-6 rounded-xl border border-[#4b5246] bg-[#343a30] px-3 sm:px-4 py-2 sm:py-3 text-sm text-[#c9c3b6]">
                Loading admin data...
              </div>
            )}
            {loadError && (
              <div className="mb-0 sm:mb-6 rounded-xl border border-red-300/60 bg-[#3a2f2f] px-3 sm:px-4 py-2 sm:py-3 text-sm text-red-200">
                {loadError}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div>
                <div className="mb-0 sm:mb-8 mt-0 sm:mt-6 lg:mt-10 rounded-[20px] sm:rounded-[28px] border border-[#5b6255] bg-[#4a5449]/40 p-0 sm:p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                  <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight text-[#efece6]" style={{ fontFamily: "'Great Vibes', cursive" }}>
                        Dashboard Overview
                      </h1>
                      <p className="mt-2 text-xs uppercase tracking-[0.35em] text-[#c9c3b6]">
                        Luxury performance brief
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div className="rounded-xl sm:rounded-2xl border border-[#5b6255] bg-[#3f463d]/60 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
                        <p className="text-[#c9c3b6]">Live occupancy</p>
                        <p className="mt-1 text-base sm:text-lg font-serif text-[#efece6]">{stats.occupancyRate}%</p>
                      </div>
                      <div className="rounded-xl sm:rounded-2xl border border-[#5b6255] bg-[#3f463d]/60 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
                        <p className="text-[#c9c3b6]">Revenue today</p>
                        <p className="mt-1 text-base sm:text-lg font-serif text-[#efece6]">₹{stats.totalRevenue.toFixed(0)}</p>
                      </div>
                      <div className="rounded-xl sm:rounded-2xl border border-[#5b6255] bg-[#3f463d]/60 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
                        <p className="text-[#c9c3b6]">Bookings</p>
                        <p className="mt-1 text-base sm:text-lg font-serif text-[#efece6]">{stats.totalBookings}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-0 sm:mb-8">
                  <div className="bg-gradient-to-br from-[#fcf8f1] via-[#f6ead7] to-[#efe1c6] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_18px_40px_rgba(16,18,16,0.18)] border border-[#e7d6b9] text-[#1c1f1a]">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f1dfc0] rounded-xl flex items-center justify-center">
                        <Hotel className="w-5 h-5 sm:w-6 sm:h-6 text-[#6f5122]" />
                      </div>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#a27c2f]" />
                    </div>
                    <div className="text-2xl sm:text-3xl mb-1 font-serif">{stats.totalRooms}</div>
                    <div className="text-[#6b6256] text-xs sm:text-sm">Total Rooms</div>
                  </div>

                  <div className="bg-gradient-to-br from-[#fcf8f1] via-[#f6ead7] to-[#efe1c6] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_18px_40px_rgba(16,18,16,0.18)] border border-[#e7d6b9] text-[#1c1f1a]">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f1dfc0] rounded-xl flex items-center justify-center">
                        <Hotel className="w-5 h-5 sm:w-6 sm:h-6 text-[#6f5122]" />
                      </div>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#a27c2f]" />
                    </div>
                    <div className="text-2xl sm:text-3xl mb-1 font-serif">{stats.availableRooms}</div>
                    <div className="text-[#6b6256] text-xs sm:text-sm">Available Rooms</div>
                  </div>

                  <div className="bg-gradient-to-br from-[#fcf8f1] via-[#f6ead7] to-[#efe1c6] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_18px_40px_rgba(16,18,16,0.18)] border border-[#e7d6b9] text-[#1c1f1a]">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f1dfc0] rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#6f5122]" />
                      </div>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#a27c2f]" />
                    </div>
                    <div className="text-2xl sm:text-3xl mb-1 font-serif">{stats.totalBookings}</div>
                    <div className="text-[#6b6256] text-xs sm:text-sm">Total Bookings</div>
                  </div>

                  <div className="bg-gradient-to-br from-[#fcf8f1] via-[#f6ead7] to-[#efe1c6] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_18px_40px_rgba(16,18,16,0.18)] border border-[#e7d6b9] text-[#1c1f1a]">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f1dfc0] rounded-xl flex items-center justify-center">
                        <FaIndianRupeeSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#6f5122]" />
                      </div>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#a27c2f]" />
                    </div>
                    <div className="text-2xl sm:text-3xl mb-1 font-serif">₹{stats.totalRevenue.toFixed(0)}</div>
                    <div className="text-[#6b6256] text-xs sm:text-sm">Total Revenue</div>
                  </div>

                  <div className="bg-gradient-to-br from-[#fcf8f1] via-[#f6ead7] to-[#efe1c6] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_18px_40px_rgba(16,18,16,0.18)] border border-[#e7d6b9] text-[#1c1f1a]">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f1dfc0] rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#6f5122]" />
                      </div>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#a27c2f]" />
                    </div>
                    <div className="text-2xl sm:text-3xl mb-1 font-serif">{stats.occupancyRate}%</div>
                    <div className="text-[#6b6256] text-xs sm:text-sm">Occupancy Rate</div>
                  </div>
                </div>

                {/* Recent Room Bookings */}
                <div className="rounded-3xl border border-[#5b6255] bg-[#4a5449]/40 p-0 sm:p-8 text-[#efece6] shadow-[0_18px_40px_rgba(16,18,16,0.18)] backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-0 sm:mb-6">
                    <h2 className="text-2xl font-serif">Recent Room Bookings</h2>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('bookings')}
                      className="border-[#6b7264] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6]"
                    >
                      View All
                    </Button>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar -mx-2 sm:-mx-3 sm:mx-0">
                    <table className="w-full min-w-[600px] sm:min-w-full">
                      <thead>
                        <tr className="border-b border-[#5b6255]">
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Booking ID</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Guest</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Phone No.</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Room</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Check-in</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Status</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Payment</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBookings.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 px-4 text-center text-[#c9c3b6]">
                              No recent bookings
                            </td>
                          </tr>
                        ) : (
                          recentBookings.map((booking) => {
                            const room = roomsState.find(r => r.id === booking.roomId);
                            const user = usersState.find(u => u.id === booking.userId);
                            const phone = (booking.guestPhone || user?.phone || 'N/A').replace(/^\+/, '');
                            return (
                              <tr key={booking.id} className="border-b border-[#4b5246]">
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{booking.id.substring(0, 8)}...</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{booking.guestName}</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{phone}</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{room?.name || 'N/A'}</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{new Date(booking.checkIn).toLocaleDateString()}</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4">
                                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${statusBadgeClass(booking.status)}`}>
                                    {booking.status === 'checked-in' ? 'Check-In' : booking.status === 'checked-out' ? 'Check-Out' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </span>
                                </td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4">
                                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${booking.paymentStatus === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.paymentStatus === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {booking.paymentStatus || 'pending'}
                                  </span>
                                </td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">₹{booking.totalPrice.toFixed(2)}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Service Bookings */}
                <div className="rounded-3xl border border-[#5b6255] bg-[#4a5449]/40 p-0 sm:p-8 text-[#efece6] shadow-[0_18px_40px_rgba(16,18,16,0.18)] backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-0 sm:mb-6">
                    <h2 className="text-2xl font-serif">Recent Service Bookings</h2>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('service-bookings')}
                      className="border-[#6b7264] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6]"
                    >
                      View All
                    </Button>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar -mx-2 sm:-mx-3 sm:mx-0">
                    <table className="w-full min-w-[700px] sm:min-w-full">
                      <thead>
                        <tr className="border-b border-[#5b6255]">
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Booking ID</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Guest</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Phone No.</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Service</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Date</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Time</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Status</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Payment</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[#c9c3b6] text-xs sm:text-sm">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentServiceBookings.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-6 sm:py-8 px-2 sm:px-4 text-center text-[#c9c3b6] text-xs sm:text-sm">
                              No recent service bookings
                            </td>
                          </tr>
                        ) : (
                          recentServiceBookings.map((booking) => {
                            const service = servicesState.find(s => s.id === booking.serviceId);
                            const paymentStatus = (booking.status === 'confirmed' ? 'paid' : booking.status === 'cancelled' ? 'failed' : 'pending');
                            let amount = 0;
                            if (service?.priceRange) {
                              const match = String(service.priceRange).match(/\d+(\.\d+)?/);
                              if (match) amount = parseFloat(match[0]);
                            }
                            return (
                              <tr key={booking.id} className="border-b border-[#4b5246]">
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{booking.id.substring(0, 8)}...</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{booking.guestName}</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{(booking.guestPhone || 'N/A').replace(/^\+/, '')}</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{service?.name || booking.serviceName || 'N/A'}</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{new Date(booking.date).toLocaleDateString()}</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{booking.time}</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4">
                                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${statusBadgeClass(booking.status)}`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4">
                                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${paymentStatus === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : paymentStatus === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {paymentStatus}
                                  </span>
                                </td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">₹{amount.toFixed(2)}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rooms' && (
              <div>
                <div className="mt-0 sm:mt-15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-0 sm:mb-8">
                  <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "'Great Vibes', cursive" }}>Manage Rooms</h1>
                  <Button onClick={handleAddRoomClick} className="bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6] min-h-[44px] px-4 py-2 text-sm sm:text-base">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Room
                  </Button>
                </div>

                {isRoomFormOpen && (
                  <form onSubmit={handleRoomSubmit} className="max-w-xl mx-auto bg-[#232b23] rounded-2xl p-4 sm:p-8 shadow-lg mb-0 sm:mb-10 border border-[#3a463a] text-[#f5f1e8]">
                    <h2 className="text-2xl font-serif mb-6 text-center tracking-wide">{editingRoomId ? 'Update Room' : 'Add Room'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400 h-12 sm:h-10 text-base sm:text-sm"
                        placeholder="Room name"
                        value={roomForm.name}
                        onChange={(event) => setRoomForm({ ...roomForm, name: event.target.value })}
                        required
                      />
                      <select
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] rounded-md px-3 h-12 sm:h-10 text-base sm:text-sm focus:ring-amber-400"
                        value={roomForm.type}
                        onChange={(event) => setRoomForm({ ...roomForm, type: event.target.value })}
                      >
                        <option value="Single">Single</option>
                        <option value="Double">Double</option>
                        <option value="Suite">Suite</option>
                        <option value="Deluxe">Deluxe</option>
                      </select>
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        type="number"
                        placeholder="Price per night"
                        value={roomForm.price}
                        onChange={(event) => setRoomForm({ ...roomForm, price: event.target.value })}
                        required
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Enter location"
                        value={roomForm.location}
                        onChange={(event) => setRoomForm({ ...roomForm, location: event.target.value })}
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Image URLs (optional, comma separated)"
                        value={roomForm.images}
                        onChange={(event) => setRoomForm({ ...roomForm, images: event.target.value })}
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        type="number"
                        placeholder="Max guests"
                        value={roomForm.maxGuests ?? ''}
                        onChange={(event) =>
                          setRoomForm((prev) => ({ ...prev, maxGuests: event.target.value }))
                        }
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        type="number"
                        placeholder="Size (sqm)"
                        value={roomForm.size}
                        onChange={(event) => setRoomForm({ ...roomForm, size: event.target.value })}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[#e6e6e6] mb-2">
                        Upload Room Images (optional)
                      </label>
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] file:bg-[#232b23] file:text-[#f5f1e8] file:border-none file:rounded file:px-3 file:py-1 cursor-pointer"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={(event) => {
                          if (event.target.files) {
                            setRoomImageFiles(Array.from(event.target.files));
                          }
                        }}
                      />
                      {roomImageFiles.length > 0 && (
                        <div className="mt-2 text-xs text-[#b6b6b6]">
                          <p className="font-medium">Selected files ({roomImageFiles.length}):</p>
                          <ul className="list-disc list-inside mt-1">
                            {roomImageFiles.map((file, idx) => (
                              <li key={idx}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[#e6e6e6] mb-2">
                        Upload Room Video (optional)
                      </label>
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] file:bg-[#232b23] file:text-[#f5f1e8] file:border-none file:rounded file:px-3 file:py-1 cursor-pointer"
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={(event) => setRoomVideoFile(event.target.files?.[0] || null)}
                      />
                      {roomVideoFile && (
                        <p className="mt-2 text-xs text-[#b6b6b6]">Selected: {roomVideoFile.name}</p>
                      )}
                    </div>
                    <Textarea
                      className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400 mb-4"
                      placeholder="Description"
                      value={roomForm.description}
                      onChange={(event) => setRoomForm({ ...roomForm, description: event.target.value })}
                    />
                    <Input
                      className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400 mb-4"
                      placeholder="Amenities (comma separated)"
                      value={roomForm.amenities}
                      onChange={(event) => setRoomForm({ ...roomForm, amenities: event.target.value })}
                    />
                    <div className="flex items-center justify-between mt-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={roomForm.available}
                          onChange={(event) =>
                            setRoomForm({ ...roomForm, available: event.target.checked })
                          }
                          className="accent-amber-400"
                        />
                        Available
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsRoomFormOpen(false)} className="bg-[#e6e1d6] text-[#232b23] hover:bg-[#efece6] border-none min-h-[44px] px-4 py-2 text-sm sm:text-base">
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-amber-400 hover:bg-amber-500 text-[#232b23] border-none min-h-[44px] px-4 py-2 text-sm sm:text-base">
                          {editingRoomId ? 'Update Room' : 'Add Room'}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
                  {roomsState.slice(0, 5).map((room) => {
                    const imageUrl = room.images[0];
                    const displayImage = imageUrl?.startsWith('/uploads/')
                      ? `${API_BASE}${imageUrl}`
                      : imageUrl;
                    const displayVideo = room.video?.startsWith('/uploads/')
                      ? `${API_BASE}${room.video}`
                      : room.video;

                    return (
                      <div
                        key={room.id}
                        className="group rounded-2xl border border-[#5b6659] bg-[#2f3a32]/90 overflow-hidden shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
                      >
                        <div className="relative h-40 overflow-hidden">
                          {displayVideo ? (
                            <video
                              src={displayVideo}
                              className="h-full w-full object-cover"
                              autoPlay
                              muted
                              loop
                              playsInline
                              poster={displayImage || undefined}
                            />
                          ) : displayImage ? (
                            <img
                              src={displayImage}
                              alt={room.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full bg-[#222a22]" />
                          )}
                          <div className="absolute top-3 left-3 rounded-full bg-[#1e2520]/80 px-3 py-1 text-[10px] text-[#d7d2c5] border border-[#5b6659]">
                            {room.available ? 'Available' : 'Occupied'}
                          </div>
                        </div>

                        <div className="p-0 sm:p-4 text-[#efece6]">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base text-[#efece6]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {room.name}
                              </h3>
                              <p className="text-xs text-[#cfc9bb] mt-1">
                                {room.type} · {room.maxGuests} guests
                              </p>
                              {room.location && (
                                <p className="text-xs text-[#cfc9bb] mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-amber-400" />
                                  {room.location}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-[#f0e7d6]">₹ {room.price} night</div>
                              <div className="text-[10px] text-[#cfc9bb]">4.9 (84)</div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-3 text-[11px] text-[#cfc9bb]">
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {room.maxGuests} guests
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Maximize2 className="w-3.5 h-3.5" />
                              {room.size} m2
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {room.amenities.slice(0, 4).map((amenity, idx) => {
                              const Icon = amenityIcons[amenity] || Coffee;
                              return (
                                <span
                                  key={`${room.id}-${amenity}-${idx}`}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-[#5b6659] bg-[#243026] px-2.5 py-1 text-[10px] text-[#d7d2c5]"
                                >
                                  <Icon className="w-3 h-3" />
                                  {amenity}
                                </span>
                              );
                            })}
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 rounded-full border border-[#5b6659] bg-transparent text-[#efece6] hover:bg-white/10"
                              onClick={() => handleEditRoomClick(room)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 rounded-full border border-rose-300/40 bg-transparent text-rose-200 hover:bg-rose-500/10"
                              onClick={() => handleDeleteRoom(room.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <div className="mt-0 sm:mt-15 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-0 sm:mb-8">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-serif text-[#f6edda]" style={{ fontFamily: "'Great Vibes', cursive" }}>Services</h1>
                    <p className="text-[#cbbfa8] mt-1 text-sm">Manage hotel offerings</p>
                  </div>
                  <Button
                    onClick={handleAddServiceClick}
                    className="bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6] shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>

                {isServiceFormOpen && (
                  <form
                    onSubmit={handleServiceSubmit}
                    className="max-w-xl mx-auto bg-[#232b23] rounded-2xl p-4 sm:p-8 shadow-lg mb-0 sm:mb-10 border border-[#3a463a] text-[#f5f1e8]"
                  >
                    <h2 className="text-2xl font-serif mb-6 text-center tracking-wide">{editingServiceId ? 'Edit Service' : 'Add Service'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Service name"
                        value={serviceForm.name}
                        onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
                        required
                      />
                      <select
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] rounded-md px-3 h-10 focus:ring-amber-400"
                        value={serviceForm.category}
                        onChange={(event) =>
                          setServiceForm({
                            ...serviceForm,
                            category: event.target.value as AdminService['category'],
                          })
                        }
                      >
                        <option value="dining">Room Service (In-room dining)</option>
                        <option value="restaurant">Bite Book (Bite Book)</option>
                        <option value="spa">Spa & wellness</option>
                        <option value="bar">Bar & lounge</option>
                      </select>
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Price range"
                        value={serviceForm.priceRange}
                        onChange={(event) => setServiceForm({ ...serviceForm, priceRange: event.target.value })}
                      />
                      <div className="space-y-1">
                        <label className="text-xs text-[#e6e6e6]">Image URL (optional)</label>
                        <Input
                          className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                          placeholder="https://..."
                          value={serviceForm.image}
                          onChange={(event) => setServiceForm({ ...serviceForm, image: event.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-[#e6e6e6]">Upload image (optional)</label>
                        <Input
                          className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] file:bg-[#232b23] file:text-[#f5f1e8] file:border-none file:rounded file:px-3 file:py-1 cursor-pointer"
                          type="file"
                          accept="image/*"
                          onChange={(event) => setServiceImageFile(event.target.files?.[0] || null)}
                        />
                        {serviceImageFile && (
                          <p className="text-xs text-[#b6b6b6]">Selected: {serviceImageFile.name}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-[#e6e6e6]">Upload video (optional)</label>
                        <Input
                          className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] file:bg-[#232b23] file:text-[#f5f1e8] file:border-none file:rounded file:px-3 file:py-1 cursor-pointer"
                          type="file"
                          accept="video/mp4,video/webm,video/ogg"
                          onChange={(event) => setServiceVideoFile(event.target.files?.[0] || null)}
                        />
                        {serviceVideoFile && (
                          <p className="text-xs text-[#b6b6b6]">Selected: {serviceVideoFile.name}</p>
                        )}
                      </div>
                    </div>
                    <Textarea
                      className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400 mb-4"
                      placeholder="Description"
                      value={serviceForm.description}
                      onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })}
                    />
                    <Input
                      className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400 mb-4"
                      placeholder="Available times (comma separated)"
                      value={serviceForm.availableTimes}
                      onChange={(event) => setServiceForm({ ...serviceForm, availableTimes: event.target.value })}
                    />
                    <div className="flex gap-2 justify-end mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsServiceFormOpen(false)}
                        className="bg-[#e6e1d6] text-[#232b23] hover:bg-[#efece6] border-none"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-amber-400 hover:bg-amber-500 text-[#232b23] border-none">
                        {editingServiceId ? 'Update' : 'Add'}
                      </Button>
                    </div>
                  </form>
                )}

                {servicesState.length === 0 ? (
                  <div className="text-center py-16 bg-[#2f3931] rounded-2xl border border-dashed border-[#556054]">
                    <p className="text-[#d6cdb8]">No services available</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {serviceCategories.map((category) => {
                        const isActive = activeServiceCategory === category.key;
                        return (
                          <button
                            key={category.key}
                            type="button"
                            onClick={() => setActiveServiceCategory(category.key)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide border transition-colors ${isActive
                              ? 'bg-amber-500 text-stone-900 border-amber-400'
                              : 'bg-[#2f3931] text-[#d7d2c5] border-[#5b6659] hover:bg-[#364036]'
                              }`}
                          >
                            {category.label}
                          </button>
                        );
                      })}
                    </div>

                    {servicesForActiveCategory.length === 0 ? (
                      <p className="text-sm text-[#cbbfa8] py-8">No services in this category</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {servicesForActiveCategory.map((service) => {
                          const displayImage = service.image?.startsWith('/uploads/')
                            ? `${API_BASE}${service.image}`
                            : service.image;
                          const displayVideo = service.video?.startsWith('/uploads/')
                            ? `${API_BASE}${service.video}`
                            : service.video;

                          return (
                            <div
                              key={service.id}
                              className="group rounded-2xl border border-[#5b6659] bg-[#2f3a32]/90 overflow-hidden shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
                            >
                              <div className="relative h-40 overflow-hidden">
                                {displayVideo ? (
                                  <video
                                    src={displayVideo}
                                    className="h-full w-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    poster={displayImage || undefined}
                                  />
                                ) : displayImage ? (
                                  <img
                                    src={displayImage}
                                    alt={service.name}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-[#222a22]" />
                                )}
                                <div className="absolute top-3 left-3 rounded-full bg-[#1e2520]/80 px-3 py-1 text-[10px] text-[#d7d2c5] border border-[#5b6659]">
                                  Available
                                </div>
                              </div>
                              <div className="p-4 text-[#efece6]">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h3 className="text-base text-[#efece6]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                      {service.name}
                                    </h3>
                                    <p className="text-xs text-[#cfc9bb] mt-1">
                                      {serviceCategoryLabel(service.category)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-[#f0e7d6]">{service.priceRange || 'Custom'} </div>
                                    <div className="text-[10px] text-[#cfc9bb]">Hotel service</div>
                                  </div>
                                </div>

                                <p className="mt-3 text-[11px] text-[#cfc9bb] line-clamp-2">{service.description}</p>

                                {service.availableTimes.length > 0 && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {service.availableTimes.slice(0, 4).map((time) => (
                                      <span
                                        key={`${service.id}-${time}`}
                                        className="inline-flex items-center rounded-full border border-[#5b6659] bg-[#243026] px-2.5 py-1 text-[10px] text-[#d7d2c5]"
                                      >
                                        {time}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="mt-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 rounded-full border border-[#5b6659] bg-transparent text-[#efece6] hover:bg-white/10"
                                    onClick={() => handleEditServiceClick(service)}
                                  >
                                    Edit
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 rounded-full border border-rose-300/40 bg-transparent text-rose-200 hover:bg-rose-500/10"
                                        onClick={() => handleDeleteService(service.id)}
                                      >
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Service</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this service? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setServiceToDelete(null)} disabled={serviceDeleteLoading}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={confirmDeleteService} disabled={serviceDeleteLoading} className="bg-red-600 hover:bg-red-700 text-white">
                                          {serviceDeleteLoading ? 'Deleting...' : 'Delete'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'offers' && (
              <div>
                <div className="mt-0 sm:mt-15 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-0 sm:mb-8">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-stone-900" style={{ fontFamily: "'Great Vibes', cursive" }}>Offers</h1>
                    <p className="text-stone-600 mt-1 text-sm">Create and publish seasonal promotions.</p>
                  </div>
                  <Button onClick={handleAddOfferClick} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Offer
                  </Button>
                </div>

                {isOfferFormOpen && (
                  <form onSubmit={handleOfferSubmit} className="max-w-xl mx-auto bg-[#232b23] rounded-2xl p-4 sm:p-8 shadow-lg mb-0 sm:mb-10 border border-[#3a463a] text-[#f5f1e8]">
                    <h2 className="text-2xl font-serif mb-6 text-center tracking-wide">{editingOfferId ? 'Edit Offer' : 'Add Offer'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Offer title"
                        value={offerForm.title}
                        onChange={(event) => setOfferForm({ ...offerForm, title: event.target.value })}
                        required
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Subtitle"
                        value={offerForm.subtitle}
                        onChange={(event) => setOfferForm({ ...offerForm, subtitle: event.target.value })}
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        type="number"
                        placeholder="Price"
                        value={offerForm.price}
                        onChange={(event) => setOfferForm({ ...offerForm, price: event.target.value })}
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        type="number"
                        step="0.1"
                        placeholder="Rating"
                        value={offerForm.rating}
                        onChange={(event) => setOfferForm({ ...offerForm, rating: event.target.value })}
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Review count"
                        value={offerForm.reviewCount}
                        onChange={(event) => setOfferForm({ ...offerForm, reviewCount: event.target.value })}
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Badge text (e.g. 25% OFF)"
                        value={offerForm.badgeText}
                        onChange={(event) => setOfferForm({ ...offerForm, badgeText: event.target.value })}
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        type="date"
                        placeholder="Expiry date"
                        value={offerForm.expiryDate}
                        onChange={(event) => setOfferForm({ ...offerForm, expiryDate: event.target.value })}
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="CTA text"
                        value={offerForm.ctaText}
                        onChange={(event) => setOfferForm({ ...offerForm, ctaText: event.target.value })}
                      />
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs text-[#e6e6e6]">Image URL (optional)</label>
                        <Input
                          className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                          placeholder="https://..."
                          value={offerForm.image}
                          onChange={(event) => setOfferForm({ ...offerForm, image: event.target.value })}
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs text-[#e6e6e6]">Upload image (optional)</label>
                        <Input
                          className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] file:bg-[#232b23] file:text-[#f5f1e8] file:border-none file:rounded file:px-3 file:py-1 cursor-pointer"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(event) => setOfferImageFile(event.target.files?.[0] || null)}
                        />
                        {offerImageFile && (
                          <p className="text-xs text-[#b6b6b6]">Selected: {offerImageFile.name}</p>
                        )}
                      </div>
                    </div>
                    <Textarea
                      className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400 mb-4"
                      placeholder="Offer description"
                      value={offerForm.description}
                      onChange={(event) => setOfferForm({ ...offerForm, description: event.target.value })}
                    />
                    <div className="flex items-center justify-between mt-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={offerForm.active}
                          onChange={(event) => setOfferForm({ ...offerForm, active: event.target.checked })}
                          className="accent-amber-400"
                        />
                        Active
                      </label>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsOfferFormOpen(false)} className="bg-[#e6e1d6] text-[#232b23] hover:bg-[#efece6] border-none">
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-amber-400 hover:bg-amber-500 text-[#232b23] border-none">
                          {editingOfferId ? 'Update' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}

                {offersState.length === 0 ? (
                  <div className="text-center py-16 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                    <p className="text-stone-600">No offers available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offersState.map((offer) => {
                      const displayImage = offer.image?.startsWith('/uploads/')
                        ? `${API_BASE}${offer.image}`
                        : offer.image;
                      return (
                        <div key={offer.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                          {displayImage ? (
                            <div className="h-40 bg-stone-200 overflow-hidden">
                              <img src={displayImage} alt={offer.title} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-40 bg-stone-100" />
                          )}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <h3 className="font-semibold text-stone-900">{offer.title}</h3>
                                {offer.subtitle && (
                                  <p className="text-xs text-stone-500 mt-1">{offer.subtitle}</p>
                                )}
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs ${offer.active ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-700'}`}>
                                {offer.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 line-clamp-2 mb-3">{offer.description || 'No description yet.'}</p>
                            <div className="flex items-center justify-between text-xs text-stone-600 mb-4">
                              <span>₹{offer.price.toFixed(0)}</span>
                              {offer.expiryDate && (
                                <span>Expiry {formatOfferDateInput(offer.expiryDate)}</span>
                              )}
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-stone-100">
                              <button
                                onClick={() => handleEditOfferClick(offer)}
                                className="flex-1 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <div className="mt-0 sm:mt-15 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between mb-0 sm:mb-8">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ fontFamily: "'Great Vibes', cursive" }}>All Bookings</h1>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center flex-wrap">
                    <select
                      className="px-3 sm:px-5 py-2.5 sm:py-2 h-11 sm:h-12 rounded-xl border border-[#3a463a] bg-[#232b23] text-[#efece6] text-sm sm:text-base font-medium focus:ring-amber-400 shadow-sm"
                      value={bookingStatusFilter}
                      onChange={(event) => setBookingStatusFilter(event.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="checked-in">Checked-in</option>
                      <option value="checked-out">Checked-out</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Button
                      onClick={handleAddBookingClick}
                      className="bg-amber-600 hover:bg-amber-700 text-white shadow-md min-h-[44px] text-sm sm:text-base"
                      title="Add booking manually"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                    <Button
                      onClick={handleExportBookingsToExcel}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-md min-h-[44px] text-sm sm:text-base"
                      title="Download bookings as Excel"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <input
                      id="import-bookings-excel"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportBookingsFromExcel}
                      className="hidden"
                      title="Upload bookings Excel file"
                    />
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md min-h-[44px] text-sm sm:text-base"
                      onClick={() => document.getElementById('import-bookings-excel')?.click()}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                    <a
                      href="/sample_bookings.xlsx"
                      download="sample_bookings.xlsx"
                      className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 font-medium text-xs sm:text-sm shadow-sm min-h-[44px]"
                      title="Download sample bookings template"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Sample
                    </a>
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={bookingSearchQuery}
                        onChange={(e) => setBookingSearchQuery(e.target.value)}
                        className="pl-9 pr-3 h-11 sm:h-10 rounded-xl border border-stone-300 bg-stone-50 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {isBookingFormOpen && (
                  <form onSubmit={handleSaveBooking} className="bg-[#232b23] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl mb-0 sm:mb-8 border border-[#3a463a] max-w-4xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-serif text-[#fffbe6] mb-4 sm:mb-8 text-center">Add Booking</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
                      <div className="flex flex-col gap-2">
                        <label className="text-[#e6e6e6] text-xs sm:text-sm font-medium">Select Room</label>
                        <select
                          className="h-11 sm:h-12 rounded-lg border border-[#3a463a] bg-[#2e362e] text-[#efece6] px-3 sm:px-4 text-sm sm:text-base focus:ring-amber-400"
                          value={bookingForm.roomId}
                          onChange={(event) => setBookingForm({ ...bookingForm, roomId: event.target.value })}
                          required
                        >
                          <option value="">Select Room</option>
                          {roomsState.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name} - ₹{room.price}/night
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[#e6e6e6] text-xs sm:text-sm font-medium">Guest Name</label>
                        <Input
                          className="h-11 sm:h-12 rounded-lg border border-[#3a463a] bg-[#2e362e] text-[#efece6] px-3 sm:px-4 text-sm sm:text-base placeholder:text-[#b6b6b6] focus:ring-amber-400"
                          placeholder="Guest Name"
                          value={bookingForm.guestName}
                          onChange={(event) => setBookingForm({ ...bookingForm, guestName: event.target.value })}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[#e6e6e6] text-sm font-medium">Guest Email</label>
                        <Input
                          className="h-12 rounded-lg border border-[#3a463a] bg-[#2e362e] text-[#efece6] px-4 text-base placeholder:text-[#b6b6b6] focus:ring-amber-400"
                          placeholder="Guest Email"
                          type="email"
                          value={bookingForm.guestEmail}
                          onChange={(event) => setBookingForm({ ...bookingForm, guestEmail: event.target.value })}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[#e6e6e6] text-sm font-medium">Guest Phone</label>
                        <Input
                          className="h-12 rounded-lg border border-[#3a463a] bg-[#2e362e] text-[#efece6] px-4 text-base placeholder:text-[#b6b6b6] focus:ring-amber-400"
                          placeholder="Guest Phone"
                          value={bookingForm.guestPhone.replace(/^\+/, '')}
                          onChange={(event) => setBookingForm({ ...bookingForm, guestPhone: event.target.value.replace(/^\+/, '') })}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[#e6e6e6] text-sm font-medium">Check-In Date</label>
                        <Input
                          className="h-12 rounded-lg border border-[#3a463a] bg-[#2e362e] text-[#efece6] px-4 text-base placeholder:text-[#b6b6b6] focus:ring-amber-400"
                          placeholder="Check-In Date"
                          type="date"
                          value={bookingForm.checkIn}
                          onChange={(event) => setBookingForm({ ...bookingForm, checkIn: event.target.value })}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[#e6e6e6] text-sm font-medium">Check-Out Date</label>
                        <Input
                          className="h-12 rounded-lg border border-[#3a463a] bg-[#2e362e] text-[#efece6] px-4 text-base placeholder:text-[#b6b6b6] focus:ring-amber-400"
                          placeholder="Check-Out Date"
                          type="date"
                          value={bookingForm.checkOut}
                          onChange={(event) => setBookingForm({ ...bookingForm, checkOut: event.target.value })}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[#e6e6e6] text-sm font-medium">Status</label>
                        <select
                          className="h-12 rounded-lg border border-[#3a463a] bg-[#2e362e] text-[#efece6] px-4 text-base focus:ring-amber-400"
                          value={bookingForm.status}
                          onChange={(event) => setBookingForm({ ...bookingForm, status: event.target.value as any })}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="checked-in">Check-in</option>
                          <option value="checked-out">Check-out</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[#e6e6e6] text-sm font-medium">Total Amount</label>
                        <Input
                          className="h-12 rounded-lg border border-[#3a463a] bg-[#2e362e] text-[#efece6] px-4 text-base placeholder:text-[#b6b6b6] focus:ring-amber-400"
                          placeholder="Total Amount"
                          type="number"
                          step="0.01"
                          value={bookingForm.totalPrice}
                          onChange={(event) => setBookingForm({ ...bookingForm, totalPrice: event.target.value })}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[#e6e6e6] text-sm font-medium">Upload ID proof (optional)</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          onChange={(event) => setBookingIdProofFile(event.target.files?.[0] || null)}
                          className="w-full text-base text-[#efece6] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-base file:font-semibold file:bg-[#232b23] file:text-[#efece6] hover:file:bg-[#2e362e]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 justify-end mt-8">
                      <Button type="button" variant="outline" className="bg-white text-[#232b23] border-none px-8 py-3 rounded-xl text-base font-semibold hover:bg-[#efece6]" onClick={() => setIsBookingFormOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#ffc107] hover:bg-[#ffb300] text-[#232b23] px-8 py-3 rounded-xl text-base font-semibold border-none">
                        Save Booking
                      </Button>
                    </div>
                  </form>
                )}

                <div className="bg-white rounded-3xl p-4 sm:p-8 shadow-sm">
                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {paginatedBookings.length === 0 ? (
                      <div className="py-8 text-center text-stone-500">
                        No bookings found
                      </div>
                    ) : (
                      paginatedBookings.map((booking) => {
                        const room = roomsState.find(r => r.id === booking.roomId);
                        return (
                          <div key={booking.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="font-semibold text-stone-900 mb-1">{booking.guestName}</div>
                                <div className="text-sm text-stone-600">{booking.guestEmail}</div>
                                <div className="text-xs text-stone-500 mt-1">ID: {booking.id}</div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="rounded-full h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {booking.idVerified === 'pending' && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleIdVerificationChange(booking, 'approved')}>Approve ID</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleIdVerificationChange(booking, 'rejected')}>Reject ID</DropdownMenuItem>
                                    </>
                                  )}
                                  {booking.status === 'checked-in' && booking.paymentStatus !== 'paid' && (
                                    <DropdownMenuItem>
                                      <div className="flex flex-col">
                                        <span className="font-semibold mb-1">Pay Now</span>
                                        <div className="flex gap-2">
                                          <button
                                            className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                await updateBookingStatus(booking.id, 'checked-in', 'paid', 'cash');
                                                window.location.reload();
                                              } catch { }
                                            }}
                                          >
                                            Cash
                                          </button>
                                          <button
                                            className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                await updateBookingStatus(booking.id, 'checked-in', 'paid', 'online');
                                                window.location.reload();
                                              } catch { }
                                            }}
                                          >
                                            Online
                                          </button>
                                        </div>
                                      </div>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-stone-500 text-xs">Phone</div>
                                <div className="text-stone-900">{(booking.guestPhone || 'N/A').replace(/^\+/, '')}</div>
                              </div>
                              <div>
                                <div className="text-stone-500 text-xs">Room</div>
                                <div className="text-stone-900">{room?.name || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-stone-500 text-xs">Check-In</div>
                                <div className="text-stone-900">{new Date(booking.checkIn).toLocaleDateString()}</div>
                              </div>
                              <div>
                                <div className="text-stone-500 text-xs">Check-Out</div>
                                <div className="text-stone-900">{new Date(booking.checkOut).toLocaleDateString()}</div>
                              </div>
                              <div>
                                <div className="text-stone-500 text-xs">Status</div>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusBadgeClass(booking.status)}`}>
                                  {booking.status === 'checked-in' ? 'Check-In' : booking.status === 'checked-out' ? 'Check-Out' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                                {booking.status === 'confirmed' && booking.idVerified === 'approved' && (
                                  <button
                                    className="mt-2 w-full px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs flex items-center justify-center gap-1"
                                    onClick={() => {
                                      if (window.confirm("Check in this guest now?")) {
                                        updateBookingStatus(booking.id, 'checked-in');
                                      }
                                    }}
                                  >
                                    <LogIn className="w-3 h-3" />
                                    Check-In
                                  </button>
                                )}
                                {booking.status === 'checked-in' && (
                                  <button
                                    className="mt-2 w-full px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs flex items-center justify-center gap-1"
                                    onClick={() => {
                                      if (window.confirm("Confirm Check-Out for this guest?")) {
                                        updateBookingStatus(booking.id, 'checked-out');
                                      }
                                    }}
                                  >
                                    <DoorOpen className="w-3 h-3" />
                                    Check-Out
                                  </button>
                                )}
                              </div>
                              <div>
                                <div className="text-stone-500 text-xs">Payment</div>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${booking.paymentStatus === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.paymentStatus === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                  }`}>
                                  {booking.paymentStatus === 'paid' && booking.paymentMethod === 'cash' && 'Paid (Cash)'}
                                  {booking.paymentStatus === 'paid' && booking.paymentMethod === 'online' && 'Paid (Online)'}
                                  {booking.paymentStatus !== 'paid' && (booking.paymentStatus || 'pending')}
                                </span>
                              </div>
                              <div>
                                <div className="text-stone-500 text-xs">ID Status</div>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${idVerifiedBadgeClass(booking.idVerified)}`}>
                                  {booking.idVerified || 'pending'}
                                </span>
                              </div>
                              <div>
                                <div className="text-stone-500 text-xs">Amount</div>
                                <div className="text-stone-900 font-semibold">₹{booking.totalPrice.toFixed(2)}</div>
                              </div>
                              {booking.idProofUrl && (
                                <div className="col-span-2">
                                  <div className="text-stone-500 text-xs mb-1">ID Proof</div>
                                  <a
                                    href={`${API_BASE}${booking.idProofUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    View ID Document
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto custom-scrollbar -mx-2 sm:-mx-3 sm:mx-0" style={{ paddingBottom: 16, minWidth: '100%' }}>
                    <table className="w-full min-w-[800px] sm:min-w-full">
                      <thead>
                        <tr className="border-b border-stone-200">
                          <th className="text-left py-3 px-4 text-stone-600">Booking ID</th>
                          <th className="text-left py-3 px-4 text-stone-600">Guest Details</th>
                          <th className="text-left py-3 px-4 text-stone-600">Phone No.</th>
                          <th className="text-left py-3 px-4 text-stone-600">Room</th>
                          <th className="text-left py-3 px-4 text-stone-600">Dates</th>
                          <th className="text-left py-3 px-4 text-stone-600">Status</th>
                          <th className="text-left py-3 px-4 text-stone-600">ID Proof</th>
                          <th className="text-left py-3 px-4 text-stone-600">ID Status</th>
                          <th className="text-left py-3 px-4 text-stone-600">Payment</th>
                          <th className="text-left py-3 px-4 text-stone-600">Amount</th>
                          <th className="text-left py-3 px-4 text-stone-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedBookings.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="py-8 px-4 text-center text-stone-500">
                              No bookings found
                            </td>
                          </tr>
                        ) : (
                          paginatedBookings.map((booking) => {
                            const room = roomsState.find(r => r.id === booking.roomId);
                            return (
                              <SwipeableBookingRow
                                key={booking.id}
                                booking={booking}
                                room={room}
                                isMobile={false}
                                swipedBookingId={swipedBookingId}
                                setSwipedBookingId={setSwipedBookingId}
                                onIdVerificationChange={handleIdVerificationChange}
                                onUpdateStatus={updateBookingStatus}
                              />
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredBookings.length > 0 && (
                    <PaginationControls
                      currentPage={bookingsPage}
                      totalPages={bookingsTotalPages}
                      totalItems={filteredBookings.length}
                      itemsPerPage={bookingsPerPage}
                      onPageChange={setBookingsPage}
                      onItemsPerPageChange={setBookingsPerPage}
                      startIndex={bookingsStartIndex}
                      endIndex={bookingsEndIndex}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'service-bookings' && (
              <div>
                <div className="mt-0 sm:mt-15 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-0 sm:mb-8">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-serif text-[#f6edda]" style={{ fontFamily: "'Great Vibes', cursive" }}>Service Bookings</h1>
                    <p className="text-[#cbbfa8] mt-1 text-sm">Manage hotel service reservations</p>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <select
                      className="px-5 py-2 h-12 rounded-xl border border-[#3a463a] bg-[#232b23] text-[#efece6] text-base font-medium focus:ring-amber-400 shadow-sm"
                      value={serviceBookingStatusFilter}
                      onChange={(event) => setServiceBookingStatusFilter(event.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Button
                      onClick={handleAddServiceBookingClick}
                      className="bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                      title="Add service booking manually"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                    <Button
                      onClick={handleExportServiceBookingsToExcel}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                      title="Download service bookings as Excel"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <input
                      id="import-service-bookings-excel"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleImportServiceBookingsFromExcel}
                      className="hidden"
                      title="Upload service bookings Excel file"
                    />
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      onClick={() => document.getElementById('import-service-bookings-excel')?.click()}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                    <a
                      href="/sample_service_bookings.csv"
                      download="sample_service_bookings.csv"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 font-medium text-sm shadow-sm"
                      title="Download sample service bookings template"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Sample
                    </a>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={serviceBookingSearchQuery}
                        onChange={(e) => setServiceBookingSearchQuery(e.target.value)}
                        className="pl-9 pr-3 h-10 rounded-xl border border-stone-300 bg-stone-50 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {isServiceBookingFormOpen && (
                  <form
                    onSubmit={handleSaveServiceBooking}
                    className="max-w-xl mx-auto bg-[#232b23] rounded-2xl p-8 shadow-lg mb-10 border border-[#3a463a] text-[#f5f1e8]"
                  >
                    <h2 className="text-2xl font-serif mb-6 text-center">Add Service Booking</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <select
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] rounded-md px-3 h-10 focus:ring-amber-400"
                        value={serviceBookingForm.serviceId}
                        onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, serviceId: event.target.value, time: '' })}
                        required
                      >
                        <option value="">Select Service</option>
                        {servicesState.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Guest Name"
                        value={serviceBookingForm.guestName}
                        onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, guestName: event.target.value })}
                        required
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Guest Email"
                        type="email"
                        value={serviceBookingForm.guestEmail}
                        onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, guestEmail: event.target.value })}
                        required
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Guest Phone"
                        value={serviceBookingForm.guestPhone.replace(/^\+/, '')}
                        onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, guestPhone: event.target.value.replace(/^\+/, '') })}
                        required
                      />
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Date"
                        type="date"
                        value={serviceBookingForm.date}
                        onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, date: event.target.value })}
                        required
                      />
                      {serviceBookingTimes.length > 0 ? (
                        <select
                          className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] rounded-md px-3 h-10 focus:ring-amber-400"
                          value={serviceBookingForm.time}
                          onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, time: event.target.value })}
                          required
                        >
                          <option value="">Select Time</option>
                          {serviceBookingTimes.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                          placeholder="Time (e.g., 7:00 PM)"
                          value={serviceBookingForm.time}
                          onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, time: event.target.value })}
                          required
                        />
                      )}
                      <Input
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                        placeholder="Guests"
                        type="number"
                        min="1"
                        value={serviceBookingForm.guests}
                        onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, guests: event.target.value })}
                        required
                      />
                      <select
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] rounded-md px-3 h-10 focus:ring-amber-400"
                        value={serviceBookingForm.status}
                        onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, status: event.target.value as any })}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <select
                        className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] rounded-md px-3 h-10 focus:ring-amber-400"
                        value={serviceBookingForm.paymentStatus || 'pending'}
                        onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, paymentStatus: event.target.value as any })}
                        required
                      >
                        <option value="pending">Payment Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    <Textarea
                      className="bg-[#2e362e] border border-[#3a463a] text-[#f5f1e8] placeholder:text-[#b6b6b6] focus:ring-amber-400 mb-4"
                      placeholder="Special Requests"
                      value={serviceBookingForm.specialRequests}
                      onChange={(event) => setServiceBookingForm({ ...serviceBookingForm, specialRequests: event.target.value })}
                    />
                    <div className="flex gap-2 justify-end mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsServiceBookingFormOpen(false)}
                        className="bg-[#e6e1d6] text-[#232b23] hover:bg-[#efece6] border-none"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-600 text-[#232b23] font-semibold shadow-md"
                      >
                        Add
                      </Button>
                    </div>
                  </form>
                )}

                {filteredServiceBookings.length === 0 ? (
                  <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                    <p className="text-stone-600">No service bookings yet</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {serviceCategories.map((category) => {
                        const isActive = activeServiceBookingCategory === category.key;
                        return (
                          <button
                            key={category.key}
                            type="button"
                            onClick={() => setActiveServiceBookingCategory(category.key)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide border transition-colors ${isActive
                              ? 'bg-amber-500 text-stone-900 border-amber-400'
                              : 'bg-[#2f3931] text-[#d7d2c5] border-[#5b6659] hover:bg-[#364036]'
                              }`}
                          >
                            {category.label}
                          </button>
                        );
                      })}
                    </div>

                    {serviceBookingsForActiveCategory.length === 0 ? (
                      <p className="text-sm text-[#cbbfa8] py-8">No service bookings in this category</p>
                    ) : (
                      <div className="bg-white rounded-3xl p-8 shadow-sm">
                        <div className="overflow-x-auto" style={{ paddingBottom: 16, minWidth: '100%' }}>
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-stone-200">
                                <th className="text-left py-3 px-4 text-stone-600">Booking ID</th>
                                <th className="text-left py-3 px-4 text-stone-600">Guest Details</th>
                                <th className="text-left py-3 px-4 text-stone-600">Phone No.</th>
                                <th className="text-left py-3 px-4 text-stone-600">Service</th>
                                <th className="text-left py-3 px-4 text-stone-600">Date</th>
                                <th className="text-left py-3 px-4 text-stone-600">Time</th>
                                <th className="text-left py-3 px-4 text-stone-600">Guests</th>
                                <th className="text-left py-3 px-4 text-stone-600">Status</th>
                                <th className="text-left py-3 px-4 text-stone-600">Payment</th>
                                <th className="text-left py-3 px-4 text-stone-600">Amount</th>
                                <th className="text-left py-3 px-4 text-stone-600">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedServiceBookings.length === 0 ? (
                                <tr>
                                  <td colSpan={11} className="py-8 px-4 text-center text-stone-500">
                                    No service bookings found
                                  </td>
                                </tr>
                              ) : (
                                paginatedServiceBookings.map((booking) => {
                            return (
                              <tr key={booking.id} className="border-b border-stone-100 hover:bg-stone-50">
                                <td className="py-4 px-4">
                                  <div className="text-sm font-mono text-stone-600">{booking.id.slice(0, 8)}</div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="font-medium text-stone-900">{booking.guestName}</div>
                                  <div className="text-sm text-stone-600">{booking.guestEmail}</div>
                                </td>
                                <td className="py-4 px-4">{(booking.guestPhone || 'N/A').replace(/^\+/, '')}</td>
                                <td className="py-4 px-4">
                                  <div className="font-medium text-stone-900">{booking.serviceName || 'N/A'}</div>
                                  <div className="text-xs text-stone-500">{serviceCategoryLabel(booking.category)}</div>
                                </td>
                                <td className="py-4 px-4">{new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td className="py-4 px-4">{booking.time}</td>
                                <td className="py-4 px-4">{booking.guests}</td>
                                <td className="py-4 px-4">
                                  <span className={`px-3 py-1 rounded-full text-sm ${statusBadgeClass(booking.status)}`}>
                                    {booking.status === 'pending' ? 'Pending' : booking.status === 'confirmed' ? 'Approved' : booking.status === 'cancelled' ? 'Rejected' : booking.status}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`px-3 py-1 rounded-full text-sm ${
                                    booking.paymentStatus === 'paid' 
                                      ? 'bg-green-100 text-green-800' 
                                      : booking.paymentStatus === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentStatus === 'failed' ? 'Failed' : 'Pending'}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="font-semibold text-stone-900">₹{(booking.totalPrice || 0).toFixed(2)}</div>
                                  {booking.priceRange && (
                                    <div className="text-xs text-stone-500">{booking.priceRange}</div>
                                  )}
                                </td>
                                <td className="py-4 px-4">
                                  {booking.status === 'pending' ? (
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                        onClick={() => handleServiceBookingActionClick(booking.id, 'approve')}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                        onClick={() => handleServiceBookingActionClick(booking.id, 'reject')}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                      booking.status === 'confirmed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {booking.status === 'confirmed' ? 'Approved' : 'Rejected'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          }))}
                        </tbody>
                      </table>
                    </div>
                    {serviceBookingsForActiveCategory.length > 0 && (
                      <PaginationControls
                        currentPage={serviceBookingsPage}
                        totalPages={serviceBookingsTotalPages}
                        totalItems={serviceBookingsForActiveCategory.length}
                        itemsPerPage={serviceBookingsPerPage}
                        onPageChange={setServiceBookingsPage}
                        onItemsPerPageChange={setServiceBookingsPerPage}
                        startIndex={serviceBookingsStartIndex}
                        endIndex={serviceBookingsEndIndex}
                      />
                    )}
                  </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h1 className="mt-0 sm:mt-15 text-3xl sm:text-4xl mb-0 sm:mb-8" style={{ fontFamily: "'Great Vibes', cursive" }}>
                  Payment Management
                </h1>
                <div className="bg-white rounded-3xl p-0 sm:p-8 shadow-sm">
                  {usersState.length === 0 ? (
                    <div className="text-center py-16 text-stone-600">No payment records yet.</div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar -mx-2 sm:-mx-3 sm:mx-0">
                      <table className="w-full min-w-[600px] sm:min-w-full">
                        <thead>
                          <tr className="border-b border-stone-200">
                            <th className="text-left py-3 px-4 text-stone-600">User</th>
                            <th className="text-left py-3 px-4 text-stone-600">Room Amount</th>
                            <th className="text-left py-3 px-4 text-stone-600">Service Amount</th>
                            <th className="text-left py-3 px-4 text-stone-600">Total Amount</th>
                            <th className="text-left py-3 px-4 text-stone-600">Pending Amount</th>
                            <th className="text-left py-3 px-4 text-stone-600">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersState.map((user) => {
                            if (!user || !user.id) return null;

                            // 1. Room Calculation Logic
                            const userRoomBookings = bookingsState.filter(b => b.userId === user.id);
                            const roomTotal = userRoomBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
                            const roomPaid = userRoomBookings
                              .filter(b => b.paymentStatus === 'paid')
                              .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
                            const roomPending = roomTotal - roomPaid;

                            // 2. Service Calculation Logic (Robust Update)
                            const userServiceBookings = serviceBookingsState.filter(sb => sb.userId === user.id);

                            const parsePrice = (range) => {
                              if (!range) return 0;
                              // This matches numbers like "500" or "500.00"
                              const match = String(range).match(/\d+(\.\d+)?/);
                              return match ? parseFloat(match[0]) : 0;
                            };

                            const serviceTotal = userServiceBookings.reduce((sum, sb) => sum + parsePrice(sb.priceRange), 0);

                            // IMPROVED: Case-insensitive check and trim to match 'paid', 'Paid', or 'PAID'
                            const servicePaid = userServiceBookings
                              .filter(sb => sb.paymentStatus && sb.paymentStatus.toString().toLowerCase().trim() === 'paid')
                              .reduce((sum, sb) => sum + parsePrice(sb.priceRange), 0);

                            const servicePending = serviceTotal - servicePaid;

                            // 3. Final Calculation for the Row
                            const grandTotal = roomTotal + serviceTotal;
                            const grandPending = roomPending + servicePending;

                            // Agar user ne koi booking nahi ki toh row mat dikhao
                            if (grandTotal === 0) return null;

                            return (
                              <tr key={user.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors text-stone-900">
                                <td className="py-4 px-4">
                                  <span className="font-medium">{user.name}</span>
                                  <span className="block text-xs text-stone-400">{user.email}</span>
                                </td>
                                <td className="py-4 px-4">₹{roomTotal.toFixed(2)}</td>
                                <td className="py-4 px-4">₹{serviceTotal.toFixed(2)}</td>
                                <td className="py-4 px-4 font-bold">₹{grandTotal.toFixed(2)}</td>
                                <td className={`py-4 px-4 font-semibold ${grandPending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ₹{grandPending.toFixed(2)}
                                </td>
                                <td className="py-4 px-4">
                                  {grandPending <= 0 ? (
                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                      Fully Paid
                                    </span>
                                  ) : (
                                    <div className="flex flex-col gap-1">
                                      {roomPending > 0 && (
                                        <span className="bg-amber-100 text-amber-800 text-[10px] font-medium px-2 py-0.5 rounded-full w-fit">
                                          Room Pending
                                        </span>
                                      )}
                                      {servicePending > 0 && (
                                        <span className="bg-blue-100 text-blue-800 text-[10px] font-medium px-2 py-0.5 rounded-full w-fit">
                                          Service Pending
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'guests' && (
              <div>
                <h1 className="mt-0 sm:mt-15 text-3xl sm:text-4xl mb-0 sm:mb-8" style={{ fontFamily: "'Great Vibes', cursive" }}>Guest Management</h1>

                {/* Users List */}
                <div className="bg-[#232b23] rounded-3xl p-0 sm:p-8 shadow-lg border border-[#3a463a] text-[#f5f1e8]">
                  {usersState.length === 0 ? (
                    <div className="text-center py-16">No guests found.</div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar -mx-2 sm:-mx-3 sm:mx-0">
                      <table className="w-full min-w-[600px] sm:min-w-full">
                        <thead>
                          <tr className="border-b border-[#3a463a]">
                            <th className="text-left py-3 px-4 text-[#c9c3b6]">Name</th>
                            <th className="text-left py-3 px-4 text-[#c9c3b6]">Email</th>
                            <th className="text-left py-3 px-4 text-[#c9c3b6]">Phone</th>
                            <th className="text-left py-3 px-4 text-[#c9c3b6]">Role</th>
                            <th className="text-left py-3 px-4 text-[#c9c3b6]">Bookings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersState.map((guest) => {
                            if (!guest || !guest.id) return null;
                            const bookingCount = bookingsState.filter(
                              (booking) => booking.userId && booking.userId === guest.id
                            ).length;
                            return (
                              <tr key={guest.id} className="border-b border-[#3a463a] hover:bg-[#2e362e]">
                                <td className="py-4 px-4">{guest.name}</td>
                                <td className="py-4 px-4">{guest.email || '—'}</td>
                                <td className="py-4 px-4">{guest.phone || '—'}</td>
                                <td className="py-4 px-4">{guest.role}</td>
                                <td className="py-4 px-4">{bookingCount}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div>
                <div className="mt-0 sm:mt-15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-0 sm:mb-8">
                  <div>
                    <h1 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: "'Great Vibes', cursive" }}>Contact Messages</h1>
                    <p className="text-stone-600">Manage customer inquiries and feedback</p>
                  </div>
                  {contactStatsState && (
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-white rounded-2xl px-6 py-3 shadow-sm">
                        <div className="text-sm text-stone-500">Total</div>
                        <div className="text-2xl font-bold">{contactStatsState.total}</div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-3">
                        <div className="text-sm text-red-600">New</div>
                        <div className="text-2xl font-bold text-red-700">{contactStatsState.new}</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-3">
                        <div className="text-sm text-green-600">Replied</div>
                        <div className="text-2xl font-bold text-green-700">{contactStatsState.replied}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm">
                  {contactsState.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-stone-400" />
                      <h3 className="text-2xl mb-2">No contact messages</h3>
                      <p className="text-stone-600">Customer inquiries will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contactsState.map((contact) => {
                        const statusColors = {
                          new: 'bg-red-100 text-red-800 border-red-200',
                          read: 'bg-blue-100 text-blue-800 border-blue-200',
                          replied: 'bg-green-100 text-green-800 border-green-200',
                          archived: 'bg-stone-100 text-stone-800 border-stone-200',
                        };

                        return (
                          <div
                            key={contact._id}
                            className={`border-2 rounded-3xl p-6 transition-all ${contact.status === 'new' ? 'border-red-200 bg-red-50/30' : 'border-stone-200 bg-white'
                              }`}
                          >
                            <div className="flex items-start gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${contact.status === 'new' ? 'bg-red-100' : 'bg-stone-100'
                                }`}>
                                <Mail className={`w-7 h-7 ${contact.status === 'new' ? 'text-red-600' : 'text-stone-600'}`} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-stone-800 mb-1">{contact.name}</h3>
                                    <div className="flex flex-wrap gap-3 text-sm text-stone-600">
                                      <span className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {contact.email}
                                      </span>
                                      {contact.phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="w-4 h-4" />
                                          {contact.phone}
                                        </span>
                                      )}
                                    </div>
                                    {contact.subject && (
                                      <div className="mt-2 text-sm font-semibold text-stone-700">
                                        Subject: {contact.subject}
                                      </div>
                                    )}
                                  </div>
                                  <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${statusColors[contact.status]}`}>
                                    {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                                  </span>
                                </div>

                                <div className="bg-stone-50 rounded-2xl p-4 mb-4 border border-stone-200">
                                  <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{contact.message}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-stone-500">
                                    Received: {new Date(contact.createdAt).toLocaleDateString()} at{' '}
                                    {new Date(contact.createdAt).toLocaleTimeString()}
                                  </div>
                                  <div className="flex gap-2">
                                    {contact.status === 'new' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateContactStatus(contact._id, 'read')}
                                        className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                                      >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Mark Read
                                      </Button>
                                    )}
                                    {(contact.status === 'new' || contact.status === 'read') && (
                                      <Button
                                        size="sm"
                                        onClick={() => updateContactStatus(contact._id, 'replied')}
                                        className="rounded-xl bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Mark Replied
                                      </Button>
                                    )}
                                    {contact.status !== 'archived' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateContactStatus(contact._id, 'archived')}
                                        className="rounded-xl"
                                      >
                                        Archive
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteContact(contact._id)}
                                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'newsletter' && (
              <div>
                <div className="mt-0 sm:mt-15 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-0 sm:mb-8">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-serif text-[#f6edda]" style={{ fontFamily: "'Great Vibes', cursive" }}>Newsletter Subscriptions</h1>
                    <p className="text-[#cbbfa8] mt-1 text-sm">Manage newsletter subscribers and export the latest list</p>
                  </div>
                  <Button
                    onClick={handleExportNewsletterSubscriptions}
                    className="h-12 px-6 rounded-xl bg-[#c9a35d] text-[#2a3429] hover:bg-[#b8934d]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {newsletterLoading && (
                  <div className="rounded-xl border border-[#5b6255] bg-[#2f3a32]/80 px-4 py-3 text-sm text-[#d7d2c5] mb-6">
                    Loading subscriptions...
                  </div>
                )}

                {newsletterSubscriptions.length === 0 && !newsletterLoading && (
                  <div className="rounded-2xl border border-[#5b6255] bg-[#2f3a32]/80 px-4 py-10 text-center text-[#d7d2c5]">
                    <Mail className="w-8 h-8 mx-auto mb-3 text-[#a89f90]" />
                    No newsletter subscriptions yet.
                  </div>
                )}

                {newsletterSubscriptions.length > 0 && (
                  <div className="rounded-2xl border border-[#5b6255] bg-[#2f3a32]/90 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto custom-scrollbar -mx-2 sm:-mx-3 sm:mx-0">
                      <table className="w-full min-w-[600px] sm:min-w-full">
                        <thead className="bg-[#384237]">
                          <tr>
                            <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#cfc9bb]">
                              Email
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#cfc9bb]">
                              Subscribed At
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#cfc9bb]">
                              Status
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#cfc9bb]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {newsletterSubscriptions.map((sub) => (
                            <tr key={sub._id} className="border-b border-[#465045] last:border-b-0">
                              <td className="px-6 py-4 text-sm text-[#efece6]">{sub.email}</td>
                              <td className="px-6 py-4 text-sm text-[#cfc9bb]">
                                {new Date(sub.subscribedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    sub.active
                                      ? 'bg-emerald-500/20 text-emerald-200'
                                      : 'bg-rose-500/20 text-rose-200'
                                  }`}
                                >
                                  {sub.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-rose-300/40 text-rose-200 hover:bg-rose-500/10"
                                  onClick={() => handleDeleteNewsletterSubscription(sub._id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h1 className=" mt-15 text-4xl mb-2 text-[#efece6]" style={{ fontFamily: "'Great Vibes', cursive" }}>Settings</h1>
                <p className="text-[#cfc9bb] mb-8">Configure system settings</p>
                {settingsSavedAt && (
                  <div className="mb-6 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    Settings updated at {settingsSavedAt}.
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#2f3a32]/90 rounded-3xl p-6 shadow-sm border border-[#5b6659]">
                    <h3 className="text-xl mb-4 text-[#efece6]">Profile Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-[#cfc9bb]">Name</label>
                        <Input
                          value={profileSettings.name}
                          onChange={(e) => setProfileSettings(prev => ({ ...prev, name: e.target.value }))}
                          className={settingsInputClass}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#cfc9bb]">Email</label>
                        <Input
                          type="email"
                          value={profileSettings.email}
                          onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                          className={settingsInputClass}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#cfc9bb]">Phone</label>
                        <Input
                          value={profileSettings.phone}
                          onChange={(e) => setProfileSettings(prev => ({ ...prev, phone: e.target.value }))}
                          className={settingsInputClass}
                        />
                      </div>
                      <Button className="rounded-xl bg-[#c9a35d] text-[#2a3429] hover:bg-[#b8934d]" onClick={handleSaveSettings}>
                        Save Profile
                      </Button>
                    </div>
                  </div>

                  <div className="bg-[#2f3a32]/90 rounded-3xl p-6 shadow-sm border border-[#5b6659]">
                    <h3 className="text-xl mb-4 text-[#efece6]">Security</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-[#cfc9bb]">Current Password</label>
                        <Input
                          type="password"
                          value={securityForm.currentPassword}
                          onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className={settingsInputClass}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#cfc9bb]">New Password</label>
                        <Input
                          type="password"
                          value={securityForm.newPassword}
                          onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className={settingsInputClass}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#cfc9bb]">Confirm Password</label>
                        <Input
                          type="password"
                          value={securityForm.confirmPassword}
                          onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={settingsInputClass}
                        />
                      </div>
                      {securityError && (
                        <div className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                          {securityError}
                        </div>
                      )}
                      <Button className="rounded-xl bg-[#c9a35d] text-[#2a3429] hover:bg-[#b8934d]" onClick={handleSecuritySave}>
                        Update Password
                      </Button>
                    </div>
                  </div>

                  <div className="bg-[#2f3a32]/90 rounded-3xl p-6 shadow-sm border border-[#5b6659]">
                    <h3 className="text-xl mb-4 text-[#efece6]">Hotel Info</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-[#cfc9bb]">Hotel Name</label>
                        <Input
                          value={hotelSettings.name}
                          onChange={(e) => setHotelSettings(prev => ({ ...prev, name: e.target.value }))}
                          className={settingsInputClass}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#cfc9bb]">Address</label>
                        <Input
                          value={hotelSettings.address}
                          onChange={(e) => setHotelSettings(prev => ({ ...prev, address: e.target.value }))}
                          className={settingsInputClass}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-[#cfc9bb]">Phone</label>
                          <Input
                            value={hotelSettings.phone}
                            onChange={(e) => setHotelSettings(prev => ({ ...prev, phone: e.target.value }))}
                            className={settingsInputClass}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-[#cfc9bb]">Email</label>
                          <Input
                            type="email"
                            value={hotelSettings.email}
                            onChange={(e) => setHotelSettings(prev => ({ ...prev, email: e.target.value }))}
                            className={settingsInputClass}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-[#cfc9bb]">Check-in Time</label>
                          <Input
                            type="time"
                            value={hotelSettings.checkInTime}
                            onChange={(e) => setHotelSettings(prev => ({ ...prev, checkInTime: e.target.value }))}
                            className={settingsInputClass}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-[#cfc9bb]">Check-out Time</label>
                          <Input
                            type="time"
                            value={hotelSettings.checkOutTime}
                            onChange={(e) => setHotelSettings(prev => ({ ...prev, checkOutTime: e.target.value }))}
                            className={settingsInputClass}
                          />
                        </div>
                      </div>
                      <Button className="rounded-xl bg-[#c9a35d] text-[#2a3429] hover:bg-[#b8934d]" onClick={handleSaveSettings}>
                        Save Hotel Info
                      </Button>
                    </div>
                  </div>

                  <div className="bg-[#2f3a32]/90 rounded-3xl p-6 shadow-sm border border-[#5b6659]">
                    <h3 className="text-xl mb-4 text-[#efece6]">Billing & Payments</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-[#cfc9bb]">Razorpay Key ID</label>
                        <Input
                          value={billingSettings.razorpayKeyId}
                          onChange={(e) => setBillingSettings(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
                          className={settingsInputClass}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#cfc9bb]">Payout Account</label>
                        <Input
                          value={billingSettings.payoutAccount}
                          onChange={(e) => setBillingSettings(prev => ({ ...prev, payoutAccount: e.target.value }))}
                          className={settingsInputClass}
                        />
                      </div>
                      <Button className="rounded-xl bg-[#c9a35d] text-[#2a3429] hover:bg-[#b8934d]" onClick={handleSaveSettings}>
                        Save Billing
                      </Button>
                    </div>
                  </div>

                  <div className="bg-[#2f3a32]/90 rounded-3xl p-6 shadow-sm border border-[#5b6659]">
                    <h3 className="text-xl mb-4 text-[#efece6]">Theme & Branding</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-[#cfc9bb]">Upload Logo</label>
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => setBrandingLogoFile(e.target.files?.[0] || null)}
                          className={settingsInputClass}
                        />
                        {brandingLogoFile && (
                          <p className="mt-2 text-xs text-[#cfc9bb]">Selected: {brandingLogoFile.name}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-[#cfc9bb]">Facebook Link</label>
                          <Input
                            type="url"
                            value={brandingSettings.facebook}
                            onChange={e => setBrandingSettings(prev => ({ ...prev, facebook: e.target.value }))}
                            placeholder="https://facebook.com/yourpage"
                            className={settingsInputClass}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-[#cfc9bb]">Instagram Link</label>
                          <Input
                            type="url"
                            value={brandingSettings.instagram}
                            onChange={e => setBrandingSettings(prev => ({ ...prev, instagram: e.target.value }))}
                            placeholder="https://instagram.com/yourpage"
                            className={settingsInputClass}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-[#cfc9bb]">YouTube Link</label>
                          <Input
                            type="url"
                            value={brandingSettings.youtube}
                            onChange={e => setBrandingSettings(prev => ({ ...prev, youtube: e.target.value }))}
                            placeholder="https://youtube.com/yourchannel"
                            className={settingsInputClass}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-[#cfc9bb]">Twitter Link</label>
                          <Input
                            type="url"
                            value={brandingSettings.twitter}
                            onChange={e => setBrandingSettings(prev => ({ ...prev, twitter: e.target.value }))}
                            placeholder="https://twitter.com/yourprofile"
                            className={settingsInputClass}
                          />
                        </div>
                      </div>
                      <Button className="rounded-xl bg-[#c9a35d] text-[#2a3429] hover:bg-[#b8934d]" onClick={handleSaveSettings}>
                        Save Social Links
                      </Button>
                    </div>
                  </div>

                  <div className="bg-[#2f3a32]/90 rounded-3xl p-6 shadow-sm border border-[#5b6659]">
                    <h3 className="text-xl mb-4 text-[#efece6]">Maintenance Mode</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-2xl border border-[#5b6659] px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-[#efece6]">Enable maintenance banner</p>
                          <p className="text-xs text-[#cfc9bb]">Show a site-wide notice for guests.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={maintenanceEnabled}
                          onChange={(e) => setMaintenanceEnabled(e.target.checked)}
                          className="h-5 w-5 accent-stone-700"
                        />
                      </div>
                      <Button className="rounded-xl bg-[#c9a35d] text-[#2a3429] hover:bg-[#b8934d]" onClick={handleSaveSettings}>
                        {maintenanceEnabled ? 'Save & Enable' : 'Save & Disable'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Booking Confirmation Dialog */}
      {serviceBookingConfirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-md w-full border border-stone-200">
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 mb-2">
              Confirm {serviceBookingConfirmDialog.action === 'approve' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="text-sm sm:text-base text-stone-600 mb-6">
              Are you sure you want to <strong>{serviceBookingConfirmDialog.action}</strong> the service booking for{' '}
              <strong>{serviceBookingConfirmDialog.bookingName}</strong>?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setServiceBookingConfirmDialog({ show: false, bookingId: null, action: null })}
                className="border-stone-300 text-stone-700 hover:bg-stone-50 w-full sm:w-auto min-h-[44px] sm:min-h-0"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdateServiceBookingStatus}
                className={`w-full sm:w-auto min-h-[44px] sm:min-h-0 ${
                  serviceBookingConfirmDialog.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {serviceBookingConfirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <MobileBottomNav />
      <Footer isAdmin />
    </div>
  );
};

export default AdminDashboard;