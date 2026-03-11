import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface BookingDetails {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
  totalPrice: number;
  roomPrice: number;
  taxes: number;
  serviceCharges: number;
  checkInTime?: string;
  checkOutTime?: string;
  earlyCheckInFee?: number;
  lateCheckOutFee?: number;
}

export interface Booking extends BookingDetails {
  id: string;
  userId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: 'pending' | 'confirmed' | 'check-in' | 'check-out' | 'checked-in' | 'checked-out' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  idVerified: 'pending' | 'approved' | 'rejected';
  idProofUrl?: string;
  idProofType?: string;
  idProofUploadedAt?: Date;
  bookingDate: Date;
}

interface BookingContextType {
  currentBooking: BookingDetails | null;
  bookings: Booking[];
  bookingsLoading: boolean;
  setCurrentBooking: (booking: BookingDetails | null) => void;
  confirmBooking: (guestDetails: { name: string; email: string; phone: string }) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  updatePaymentStatus: (bookingId: string, paymentStatus: Booking['paymentStatus']) => Promise<void>;
  submitIdProof: (bookingId: string, idProof: File, idType: string) => Promise<Booking>;
  refreshBookings: () => Promise<void>;
}


export const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentBooking, setCurrentBooking] = useState<BookingDetails | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getAuthToken = () => {
    const stored = localStorage.getItem('auth');
    if (!stored) {
      return null;
    }
    try {
      const parsed = JSON.parse(stored);
      return parsed.token || null;
    } catch {
      return null;
    }
  };

  const getUserId = () => {
    const stored = localStorage.getItem('auth');
    if (!stored) {
      return '1';
    }
    try {
      const parsed = JSON.parse(stored);
      return parsed.user?.id || '1';
    } catch {
      return '1';
    }
  };

  const refreshBookings = useCallback(async () => {
    setBookingsLoading(true);
    const token = getAuthToken();
    if (!token) {
      setBookings([]);
      setBookingsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setBookingsLoading(false);
        return;
      }

      const data = await response.json();
      const normalized = (data as any[]).map((booking) => ({
        id: booking._id || booking.id,
        roomId: booking.roomId,
        checkIn: new Date(booking.checkIn),
        checkOut: new Date(booking.checkOut),
        guests: booking.guests,
        rooms: booking.rooms,
        totalPrice: booking.totalPrice,
        roomPrice: booking.roomPrice,
        taxes: booking.taxes,
        serviceCharges: booking.serviceCharges,
        userId: booking.userId || getUserId(),
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        idVerified: booking.idVerified || 'pending',
        idProofUrl: booking.idProofUrl,
        idProofType: booking.idProofType,
        idProofUploadedAt: booking.idProofUploadedAt ? new Date(booking.idProofUploadedAt) : undefined,
        bookingDate: new Date(booking.bookingDate || Date.now()),
      }));

      setBookings(normalized);
    } catch {
      // ignore load errors
    } finally {
      setBookingsLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      setCurrentBooking(null);
      return;
    }

    refreshBookings();
  }, [user, refreshBookings]);

  const confirmBooking = async (guestDetails: { name: string; email: string; phone: string }): Promise<Booking> => {
    if (!currentBooking) throw new Error('No current booking');
    const payload = {
      ...currentBooking,
      checkIn: currentBooking.checkIn instanceof Date ? currentBooking.checkIn.toISOString() : currentBooking.checkIn,
      checkOut: currentBooking.checkOut instanceof Date ? currentBooking.checkOut.toISOString() : currentBooking.checkOut,
      guestName: guestDetails.name,
      guestEmail: guestDetails.email,
      guestPhone: guestDetails.phone,
      userId: getUserId(),
    };

    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let message = `Booking failed (${response.status})`;
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

    const saved = await response.json();
    const booking: Booking = {
      ...currentBooking,
      id: saved._id || saved.id,
      userId: saved.userId || getUserId(),
      guestName: saved.guestName,
      guestEmail: saved.guestEmail,
      guestPhone: saved.guestPhone,
      status: saved.status,
      paymentStatus: saved.paymentStatus,
      idVerified: saved.idVerified || 'pending',
      idProofUrl: saved.idProofUrl,
      idProofType: saved.idProofType,
      idProofUploadedAt: saved.idProofUploadedAt ? new Date(saved.idProofUploadedAt) : undefined,
      bookingDate: new Date(saved.bookingDate || Date.now()),
    };

    setBookings((prev) => [booking, ...prev]);
    return booking;
  };

  const cancelBooking = async (bookingId: string) => {
    await updateBookingStatus(bookingId, 'cancelled');
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    // Map UI status to backend expected status
    let backendStatus = status;
    if (status === 'check-in') backendStatus = 'checked-in';
    if (status === 'check-out') backendStatus = 'checked-out';
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status: backendStatus }),
    });

    if (!response.ok) {
      let message = `Status update failed (${response.status})`;
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

    const updated = await response.json();
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status: updated.status || status }
          : booking
      )
    );
  };

  const updatePaymentStatus = async (bookingId: string, paymentStatus: Booking['paymentStatus']) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/payment-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ paymentStatus }),
    });

    if (!response.ok) {
      let message = `Payment status update failed (${response.status})`;
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

    const updated = await response.json();
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? { ...booking, paymentStatus: updated.paymentStatus || paymentStatus }
          : booking
      )
    );
  };

  const submitIdProof = async (bookingId: string, idProof: File, idType: string): Promise<Booking> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('idProof', idProof);
    formData.append('idType', idType);

    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/id-proof`, {
      method: 'PATCH',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      let message = `ID proof upload failed (${response.status})`;
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

    const updated = await response.json();
    const normalized: Booking = {
      id: updated._id || updated.id,
      roomId: updated.roomId,
      checkIn: new Date(updated.checkIn),
      checkOut: new Date(updated.checkOut),
      guests: updated.guests,
      rooms: updated.rooms,
      totalPrice: updated.totalPrice,
      roomPrice: updated.roomPrice,
      taxes: updated.taxes,
      serviceCharges: updated.serviceCharges,
      userId: updated.userId || getUserId(),
      guestName: updated.guestName,
      guestEmail: updated.guestEmail,
      guestPhone: updated.guestPhone,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      idVerified: updated.idVerified || 'pending',
      idProofUrl: updated.idProofUrl,
      idProofType: updated.idProofType,
      idProofUploadedAt: updated.idProofUploadedAt ? new Date(updated.idProofUploadedAt) : undefined,
      bookingDate: new Date(updated.bookingDate || Date.now()),
    };

    setBookings((prev) =>
      prev.map((booking) => (booking.id === bookingId ? normalized : booking))
    );
    return normalized;
  };

  return (
    <BookingContext.Provider value={{
      currentBooking,
      bookings,
      bookingsLoading,
      setCurrentBooking,
      confirmBooking,
      cancelBooking,
      updateBookingStatus,
      updatePaymentStatus,
      submitIdProof,
      refreshBookings,
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
