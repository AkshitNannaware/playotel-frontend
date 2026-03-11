import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, Clock, User, Mail, Phone, CreditCard, CheckCircle, XCircle, DollarSign, MapPin, Hotel, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useBooking } from '../context/BookingContext';
import { toast } from 'sonner';
import type { Room } from '../types/room';
import { FaIndianRupeeSign } from "react-icons/fa6";

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { bookings, cancelBooking } = useBooking();
  const booking = bookings.find(b => b.id === bookingId);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoadError, setRoomLoadError] = useState<string | null>(null);

  const resolveImageUrl = (imageUrl: string) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400';
    return imageUrl.startsWith('/uploads/') ? `${API_BASE}${imageUrl}` : imageUrl;
  };

  useEffect(() => {
    const loadRoom = async () => {
      if (!booking?.roomId) return;
      
      setRoomLoadError(null);
      try {
        const response = await fetch(`${API_BASE}/api/rooms/${booking.roomId}`);
        if (!response.ok) {
          throw new Error(`Failed to load room (${response.status})`);
        }
        const data = await response.json();
        setRoom({
          id: data._id || data.id,
          name: data.name,
          type: data.type,
          price: data.price,
          images: data.images || [],
          description: data.description || '',
          amenities: data.amenities || [],
          maxGuests: data.maxGuests || 1,
          size: data.size || 0,
          available: data.available ?? true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load room';
        setRoomLoadError(message);
      }
    };

    loadRoom();
  }, [API_BASE, booking?.roomId]);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Booking not found</h2>
          <Button onClick={() => navigate('/profile')}>Back to Profile</Button>
        </div>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'check-in': return 'bg-blue-100 text-blue-800';
      case 'check-out': return 'bg-stone-100 text-stone-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  const paymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  const idVerifiedColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-[#3f4a40] border-b border-[#5b6659] py-4">
        <div className="max-w-5xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="text-[#efece6] hover:bg-[#2f3a32]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </div>
      </div>

      <div className="min-h-screen bg-[#3f4a40] text-[#efece6] py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl mb-2 text-[#efece6]">Booking Details</h1>
            <p className="text-[#d7d2c5]">Booking ID: {booking.id}</p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Status */}
            <div className="bg-[#2f3a32]/70 border border-[#5b6659] rounded-3xl p-6">
              <h2 className="text-2xl mb-4 text-[#efece6]">Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-[#d7d2c5] mb-2">Booking Status</p>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[#d7d2c5] mb-2">Payment Status</p>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${paymentStatusColor(booking.paymentStatus)}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[#d7d2c5] mb-2">ID Verification</p>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${idVerifiedColor(booking.idVerified)}`}>
                    {booking.idVerified || 'pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="bg-[#2f3a32]/70 border border-[#5b6659] rounded-3xl p-6">
              <h2 className="text-2xl mb-4 flex items-center gap-2 text-[#efece6]">
                <User className="w-6 h-6" />
                Guest Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-[#d7d2c5] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#d7d2c5]">Name</p>
                    <p className="font-medium text-[#efece6]">{booking.guestName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#d7d2c5] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#d7d2c5]">Email</p>
                    <p className="font-medium text-[#efece6]">{booking.guestEmail}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#d7d2c5] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#d7d2c5]">Phone</p>
                    <p className="font-medium text-[#efece6]">{(booking.guestPhone || '').replace(/^\+/, '')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="bg-[#2f3a32]/70 border border-[#5b6659] rounded-3xl p-6">
              <h2 className="text-2xl mb-4 flex items-center gap-2 text-[#efece6]">
                <Calendar className="w-6 h-6" />
                Stay Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-[#d7d2c5] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#d7d2c5]">Check-in</p>
                      <p className="font-medium text-[#efece6]">{new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#d7d2c5] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#d7d2c5]">Check-out</p>
                      <p className="font-medium text-[#efece6]">{new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <User className="w-5 h-5 text-[#d7d2c5] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#d7d2c5]">Guests</p>
                      <p className="font-medium text-[#efece6]">{booking.guests} Guest{booking.guests > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Hotel className="w-5 h-5 text-[#d7d2c5] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#d7d2c5]">Rooms</p>
                      <p className="font-medium text-[#efece6]">{booking.rooms} Room{booking.rooms > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Information */}
            {room && (
              <div className="bg-[#2f3a32]/70 border border-[#5b6659] rounded-3xl p-6">
                <h2 className="text-2xl mb-4 flex items-center gap-2 text-[#efece6]">
                  <Hotel className="w-6 h-6" />
                  Room Information
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <img
                    src={resolveImageUrl(room.images?.[0] || '')}
                    alt={room.name}
                    className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-[#efece6]">{room.name}</h3>
                    <p className="text-[#d7d2c5] mb-2">{room.type} Room</p>
                    <p className="text-sm text-[#c0b9b0]">{room.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/room/${room.id}`)}
                      className="mt-3 border-[#5b6659] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6]"
                    >
                      View Room Details
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ID Proof */}
            {booking.idProofUrl && (
              <div className="bg-[#2f3a32]/70 border border-[#5b6659] rounded-3xl p-6">
                <h2 className="text-2xl mb-4 flex items-center gap-2 text-[#efece6]">
                  <FileText className="w-6 h-6" />
                  ID Proof
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#d7d2c5]">Document Type</p>
                    <p className="font-medium text-[#efece6] capitalize">{booking.idProofType?.replace(/-/g, ' ')}</p>
                  </div>
                  {booking.idProofUploadedAt && (
                    <div>
                      <p className="text-sm text-[#d7d2c5]">Uploaded On</p>
                      <p className="font-medium text-[#efece6]">{new Date(booking.idProofUploadedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  <a
                    href={`${API_BASE}${booking.idProofUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-blue-400 hover:underline text-sm"
                  >
                    View Document →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Price Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#2f3a32]/70 border border-[#5b6659] rounded-3xl p-6 sticky top-4">
              <h3 className="text-xl mb-6 flex items-center gap-2 text-[#efece6]">
                <FaIndianRupeeSign className="w-6 h-6" />
                Payment Summary
              </h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-[#5b6659]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#d7d2c5]">Room Charges</span>
                  <span className="font-medium text-[#efece6]">₹{booking.roomPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#d7d2c5]">Taxes</span>
                  <span className="font-medium text-[#efece6]">₹{booking.taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#d7d2c5]">Service Charges</span>
                  <span className="font-medium text-[#efece6]">₹{booking.serviceCharges.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-[#efece6]">Total Amount</span>
                <span className="text-3xl font-bold text-[#efece6]">₹{booking.totalPrice.toFixed(2)}</span>
              </div>

              <div className="space-y-3">
                {booking.status === 'confirmed' && booking.idVerified === 'approved' && booking.paymentStatus !== 'paid' && (
                  <Button
                    onClick={() => navigate(`/payment/${booking.id}`)}
                    className="w-full h-12 rounded-xl bg-[#2f8f5e] hover:bg-[#247a4b]"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay Now
                  </Button>
                )}
                {booking.status === 'confirmed' && booking.idVerified === 'approved' && (
                  <Button
                    onClick={() => navigate(`/checkin/${booking.id}`)}
                    className="w-full h-12 rounded-xl border border-[#5b6659] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6]"
                    variant="outline"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Check In
                  </Button>
                )}
                {booking.status === 'check-in' && (
                  <Button
                    onClick={() => navigate(`/checkout/${booking.id}`)}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Check Out
                  </Button>
                )}
                {booking.status === 'confirmed' && booking.idVerified !== 'approved' && (
                  <Button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to cancel this booking?')) {
                        try {
                          await cancelBooking(booking.id);
                          toast.success('Booking cancelled successfully');
                          navigate('/profile?tab=bookings');
                        } catch (error) {
                          toast.error('Failed to cancel booking');
                        }
                      }
                    }}
                    className="w-full h-12 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-950/30"
                    variant="outline"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Cancel Booking
                  </Button>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-[#5b6659]">
                <div className="text-sm text-[#d7d2c5]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Booked on {new Date(booking.bookingDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default BookingDetails;
