import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Calendar, Clock, Upload, CheckCircle, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useBooking } from '../context/BookingContext';
import { toast } from 'sonner';
import { format, differenceInCalendarDays } from 'date-fns';
import type { Room } from '../types/room';
import { useAuth } from '../context/AuthContext';

const CheckIn = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { bookings, bookingsLoading, updateBookingStatus, submitIdProof, refreshBookings } = useBooking();
  const { isAdmin } = useAuth();
  const booking = bookings.find(b => b.id === bookingId);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoadError, setRoomLoadError] = useState<string | null>(null);

  // Auto-select check-in date from booking
  const [checkInDate, setCheckInDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [idType, setIdType] = useState('Government ID');
  const [idProof, setIdProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1);

  // Set check-in date from booking when available
  useEffect(() => {
    if (booking?.checkIn) {
      setCheckInDate(format(new Date(booking.checkIn), 'yyyy-MM-dd'));
    }
  }, [booking?.checkIn]);

  const resolveImageUrl = (imageUrl: string) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400';
    return imageUrl.startsWith('/uploads/') ? `${API_BASE}${imageUrl}` : imageUrl;
  };

  // Always call all hooks unconditionally
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

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdProof(e.target.files[0]);
    }
  };

  const handleIdSubmission = async () => {
    if (!idProof) {
      toast.error('Please upload ID proof');
      return;
    }

    setIsUploading(true);
    try {
      await submitIdProof(booking.id, idProof, idType);
      toast.success('ID proof submitted for verification');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload ID proof';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!isAdmin) {
      if (!checkInTime) {
        toast.error('Please select check-in time');
        return;
      }
      if (booking.idVerified !== 'approved') {
        toast.error('Your ID verification is still pending');
        return;
      }
      // Early check-in fee logic
      const STANDARD_CHECKIN = '14:00';
      let earlyCheckInFee = 0;
      if (checkInTime < STANDARD_CHECKIN) {
        earlyCheckInFee = 30; // Flat fee, can be changed
      }
      // If early check-in, update booking with pending fee
      if (earlyCheckInFee > 0) {
        try {
          const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).token : null;
          await fetch(`${API_BASE}/api/bookings/${booking.id}/early-checkin-fee`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ earlyCheckInFee }),
          });
          toast.info('Early check-in fee added. Please pay the pending amount.');
        } catch (err) {
          toast.error('Failed to add early check-in fee.');
        }
      }
    }
    // For admin, skip checks and check-in directly
    await updateBookingStatus(booking.id, 'check-in');
    setStep(2);
    toast.success('Check-in successful!');
  };



  // Handle loading state after all hooks
  if (bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-lg text-[#efece6]">Loading booking...</div>
      </div>
    );
  }

  // Handle not found state after all hooks
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

  const nights = Math.max(1, differenceInCalendarDays(new Date(booking.checkOut), new Date(booking.checkIn)));

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#3f4a40] text-[#efece6] pt-10">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[#3f4a40]"/>
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />

          <div className="relative max-w-6xl mx-auto px-4 py-12">
            <div className="rounded-[2rem] border border-[#4b5246] bg-[#3a4035]/95 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-end gap-4 px-6 py-4 border-b border-[#4b5246]">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="h-9 w-9 rounded-full border border-[#5b6255] text-[#d7d0bf] hover:bg-white/10 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 lg:p-8 text-center">
                <div className="w-20 h-20 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>

                <h1 className="text-4xl mb-3 text-[white]">Check-In Complete!</h1>
                <p className="text-xl text-[#efece6] mb-8">
                  Welcome to Grand Luxe Hotel
                </p>

                <div className="max-w-2xl mx-auto">
                  <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] p-6 mb-8 text-left">
                    {room && (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm uppercase tracking-[0.2em] text-[#c9c3b6]">Room Details</h3>
                          <span className="text-xs text-[#c9c3b6]">{room.name}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                          <div>
                            <div className="text-sm text-[#c9c3b6] mb-1">Check-in Date</div>
                            <div className="text-lg text-[#efece6]">{format(new Date(checkInDate), 'MMM dd, yyyy')}</div>
                          </div>
                          <div>
                            <div className="text-sm text-[#c9c3b6] mb-1">Check-in Time</div>
                            <div className="text-lg text-[#efece6]">{checkInTime}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <div className="text-sm text-[#c9c3b6] mb-1">Room Number</div>
                            <div className="text-lg text-[#efece6]">A-{Math.floor(Math.random() * 900) + 100}</div>
                          </div>
                          <div>
                            <div className="text-sm text-[#c9c3b6] mb-1">Floor</div>
                            <div className="text-lg text-[#efece6]">{Math.floor(Math.random() * 10) + 1}th Floor</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-[#4b5246] bg-[#2f352b] px-4 py-3 text-sm text-[#c9c3b6] text-left">
                      <p className="mb-2"><strong>Important Information:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your key card is ready at the reception</li>
                        <li>Breakfast is served from 7:00 AM to 10:30 AM</li>
                        <li>WiFi password: GrandLuxe2024</li>
                        <li>Contact extension 100 for any assistance</li>
                      </ul>
                    </div>

                    <Button 
                      onClick={() => navigate('/profile')} 
                      className="w-full h-12 rounded-xl border border-[#5b6255] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca]"
                    >
                      Back to My Bookings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3f4a40] text-[#efece6] pt-10">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#3f4a40]"/>
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />

        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <div className="rounded-[2rem] border border-[#4b5246] bg-[#3a4035]/95 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-end gap-4 px-6 py-4 border-b border-[#4b5246]">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-9 w-9 rounded-full border border-[#5b6255] text-[#d7d0bf] hover:bg-white/10 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 p-6 lg:p-8">
              {/* Check-In Information Form */}
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl text-[#efece6]">Check-In Information</h1>
                  <div className="h-px w-20 bg-[#5b6255] mt-3" />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="checkInDate" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                      Check-In Date
                    </Label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9c3b6]" />
                      <Input
                        id="checkInDate"
                        type="date"
                        value={checkInDate}
                        readOnly
                        className="pl-10 h-11 rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6] opacity-80 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-[#9aa191] mt-2">
                      Check-in date is pre-selected from your booking
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="checkInTime" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                      Select Check-In Time *
                    </Label>
                    <div className="relative mt-2">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9c3b6]" />
                      <select
                        id="checkInTime"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="w-full pl-10 h-11 rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6] focus:outline-none focus:ring-2 focus:ring-[#7f876f]"
                      >
                        <option value="14:00">2:00 PM (Standard)</option>
                        <option value="12:00">12:00 PM (Early Check-in - $50)</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                        <option value="18:00">6:00 PM (Late Check-in)</option>
                      </select>
                    </div>
                    <p className="text-xs text-[#9aa191] mt-2">
                      Standard check-in time is 2:00 PM. Early check-in subject to availability.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="idType" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                      ID Type *
                    </Label>
                    <select
                      id="idType"
                      value={idType}
                      onChange={(event) => setIdType(event.target.value)}
                      className="mt-2 w-full h-11 px-4 rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6] focus:outline-none focus:ring-2 focus:ring-[#7f876f]"
                      required
                    >
                      <option value="Government ID">Government ID</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="idProof" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                      Upload ID Proof *
                    </Label>
                    <div className="mt-2">
                      <input
                        id="idProof"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleIdUpload}
                        className="hidden"
                        required
                      />
                      <label
                        htmlFor="idProof"
                        className="flex items-center justify-between gap-3 px-4 h-11 rounded-xl border border-[#4b5246] bg-[#343a30] text-sm text-[#c9c3b6] cursor-pointer hover:bg-[#3a4035]"
                      >
                        <span>{idProof ? idProof.name : 'Select file'}</span>
                        <span className="text-[11px] uppercase tracking-[0.2em]">Browse</span>
                      </label>
                    </div>
                  </div>
                  
                  {booking.idVerified === 'rejected' && (
                    <p className="text-xs text-red-400 mt-1">
                      Your ID was rejected. Please upload a new document.
                    </p>
                  )}
                </div>
              </div>

              {/* Booking Details Card - Matching booking page style */}
              <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] p-5 h-fit">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-[#c9c3b6]">Booking Details</h3>
                  <span className="text-xs text-[#c9c3b6]">ID: {booking.id.slice(-8)}</span>
                </div>

                {room && (
                  <div className="mb-4 pb-4 border-b border-[#4b5246]">
                    <div className="flex gap-3">
                      <img
                        src={resolveImageUrl(room.images?.[0] || '')}
                        alt={room.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400';
                        }}
                      />
                      <div>
                        <h4 className="text-sm text-[#efece6]">{room.name}</h4>
                        <p className="text-xs text-[#c9c3b6] mt-1">{room.type} Room</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm text-[#d7d0bf]">
                  <div className="flex justify-between">
                    <span className="text-[#c9c3b6]">Check-in</span>
                    <span>{format(booking.checkIn, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#c9c3b6]">Check-out</span>
                    <span>{format(booking.checkOut, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#c9c3b6]">Nights</span>
                    <span>{nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#c9c3b6]">Guests</span>
                    <span>{booking.guests || 2}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#4b5246] space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#c9c3b6]">Room Charges</span>
                    <span className="text-[#d7d0bf]">${booking.totalPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#4b5246] flex items-center justify-between text-[#efece6]">
                  <span className="text-sm">Status</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    booking.status === 'confirmed' ? 'bg-green-900/50 text-green-400' :
                    booking.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-blue-900/50 text-blue-400'
                  }`}>
                    {booking.status || 'confirmed'}
                  </span>
                </div>


                {/* Hide check-in button if already checked in */}
                {booking.status !== 'check-in' && (
                  <Button
                    onClick={handleCheckIn}
                    className="mt-5 w-full rounded-xl border border-[#5b6255] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca]"
                    disabled={!isAdmin && booking.idVerified !== 'approved'}
                  >
                    {isAdmin ? 'Check-In (Admin)' : 'Complete Check-In'}
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {!room && roomLoadError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    {roomLoadError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CheckIn;