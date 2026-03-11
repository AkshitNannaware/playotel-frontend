import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { User, Mail, Phone, CreditCard, CheckCircle2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { format, differenceInCalendarDays } from 'date-fns';
import type { Room } from '../types/room';

const Booking = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { currentBooking, confirmBooking, submitIdProof } = useBooking();
  const [adminBooking, setAdminBooking] = useState(null);
  const [loadingAdminBooking, setLoadingAdminBooking] = useState(false);
  const [adminBookingError, setAdminBookingError] = useState(null);
  const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000';
  const bookingIdFromUrl = window.location.pathname.split('/').pop();
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [idType, setIdType] = useState('Government ID');
  const [idProof, setIdProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoadError, setRoomLoadError] = useState<string | null>(null);
  const fallbackRoomImage = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200';

  const resolveImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return fallbackRoomImage;
    return imageUrl.startsWith('/uploads/') ? `${API_BASE}${imageUrl}` : imageUrl;
  };

  // Auto-populate from logged-in user
  useEffect(() => {
    if (user) {
      setGuestName(user.name || '');
      setGuestEmail(user.email || '');
      setGuestPhone((user.phone || '').replace(/^\+/, ''));
    }
  }, [user]);

  if (user?.role === 'admin') {
    // If admin is on /checkin/:bookingId, fetch booking by ID
    if (bookingIdFromUrl && bookingIdFromUrl.length > 10) {
      useEffect(() => {
        setLoadingAdminBooking(true);
        setAdminBookingError(null);
        const auth = localStorage.getItem('auth');
        let token = '';
        if (auth) {
          try {
            token = JSON.parse(auth).token;
          } catch {}
        }
        fetch(`${API_BASE}/api/admin/bookings/${bookingIdFromUrl}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
          .then(res => res.ok ? res.json() : Promise.reject('Booking not found'))
          .then(data => {
            setAdminBooking(data);
            setLoadingAdminBooking(false);
          })
          .catch(err => {
            setAdminBookingError('Booking not found');
            setLoadingAdminBooking(false);
          });
      }, [bookingIdFromUrl]);
      if (loadingAdminBooking) {
        return <div className="min-h-screen flex items-center justify-center"><div>Loading booking...</div></div>;
      }
      if (adminBookingError) {
        return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h2 className="text-2xl mb-4">Booking not found</h2><Button onClick={() => navigate('/profile')}>Back to Profile</Button></div></div>;
      }
      if (adminBooking) {
        // Render check-in info page for adminBooking
        return (
          <div className="min-h-screen bg-[#3f4a40] text-[#efece6] pt-10">
            <section className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[#3f4a40]"/>
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />
              <div className="relative max-w-6xl mx-auto px-4 py-12">
                <div className="rounded-[2rem] border border-[#4b5246] bg-[#3a4035]/95 shadow-2xl overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#4b5246]">
                    <h1 className="text-2xl sm:text-3xl text-[#efece6]">Check-In Information</h1>
                    <button type="button" onClick={() => navigate(-1)} className="h-9 w-9 rounded-full border border-[#5b6255] text-[#d7d0bf] hover:bg-white/10 flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 p-6 lg:p-8">
                    <div>
                      <div className="mb-6">
                        <h2 className="text-xl text-[#efece6]">Check-in Date</h2>
                        <div className="h-px w-20 bg-[#5b6255] mt-3" />
                        <div className="mt-2 text-lg">{new Date(adminBooking.checkIn).toLocaleDateString()}</div>
                      </div>
                      <div className="mb-6">
                        <h2 className="text-xl text-[#efece6]">Select Check-in Time *</h2>
                        <select className="mt-2 w-full h-11 px-4 rounded-xl bg-[#343a30] border border-[#4b5246] text-[#efece6]">
                          <option>2:00 PM (Standard)</option>
                        </select>
                        <div className="mt-2 text-xs text-[#c9c3b6]">Standard check-in time is 2:00 PM. Early check-in subject to availability.</div>
                      </div>
                      <div className="mb-6">
                        <h2 className="text-xl text-[#efece6]">ID Type *</h2>
                        <select className="mt-2 w-full h-11 px-4 rounded-xl bg-[#343a30] border border-[#4b5246] text-[#efece6]">
                          <option>Government ID</option>
                        </select>
                      </div>
                      <div className="mb-6">
                        <h2 className="text-xl text-[#efece6]">Upload ID Proof *</h2>
                        <input type="file" className="mt-2 w-full h-11 px-4 rounded-xl border border-[#4b5246] bg-[#343a30] text-sm text-[#c9c3b6]" />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm uppercase tracking-[0.2em] text-[#c9c3b6]">Booking Details</h3>
                        <span className="text-xs text-[#c9c3b6]">ID: {adminBooking.id.slice(-6)}</span>
                      </div>
                      <div className="space-y-2 text-sm text-[#d7d0bf]">
                        <div className="flex justify-between"><span>Check-in</span><span>{new Date(adminBooking.checkIn).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span>Check-out</span><span>{new Date(adminBooking.checkOut).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span>Nights</span><span>{(() => {
                          const checkInDate = new Date(adminBooking.checkIn);
                          const checkOutDate = new Date(adminBooking.checkOut);
                          const nights = Math.max(1, Number((checkOutDate.getTime() - checkInDate.getTime()) / (1000*60*60*24)));
                          return nights;
                        })()}</span></div>
                        <div className="flex justify-between"><span>Guests</span><span>{adminBooking.guests}</span></div>
                        <div className="flex justify-between"><span>Room Charges</span><span>₹{adminBooking.roomPrice.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Status</span><span className="text-green-600">{adminBooking.status}</span></div>
                      </div>
                      <Button className="mt-5 w-full rounded-xl border border-[#5b6255] bg-[#efece6] text-[#232b23] hover:bg-[#e5ddca]">Complete Check-In <CheckCircle2 className="w-4 h-4 ml-2" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );
      }
      // fallback
      return null;
    }
    // fallback for admin not on checkin page
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Admins cannot book rooms</h2>
          <p className="text-stone-600 mb-6">Switch to a guest account to create a booking.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/admin')} variant="outline">Go to Admin Dashboard</Button>
            <Button onClick={() => navigate('/rooms')}>Browse Rooms</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">No booking selected</h2>
          <Button onClick={() => navigate('/rooms')}>Browse Rooms</Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadRoom = async () => {
      setRoomLoadError(null);
      try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentBooking.roomId}`);
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

    if (currentBooking?.roomId) {
      loadRoom();
    }
  }, [API_BASE, currentBooking?.roomId]);

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idProof) {
      toast.error('Please upload a government ID');
      return;
    }
    try {
      const booking = await confirmBooking({
        name: guestName,
        email: guestEmail,
        phone: guestPhone.replace(/^\+/, ''),
      });

      setIsUploading(true);
      await submitIdProof(booking.id, idProof, idType);

      // Optionally save to user profile if logged in and checkbox is checked
      if (user && saveToProfile) {
        try {
          const auth = JSON.parse(localStorage.getItem('auth') || '{}');
          const token = auth.token;
          
          if (token) {
            await fetch(`${API_BASE}/api/auth/profile`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: guestName,
                email: guestEmail,
                phone: guestPhone
              })
            });
            // Update user in AuthContext and localStorage
            updateUser({
              name: guestName,
              email: guestEmail,
              phone: guestPhone
            });
          }
        } catch (error) {
          console.warn('Failed to update profile:', error);
          // Don't block booking on profile update failure
        }
      }

      toast.success('Booking and ID uploaded successfully!');
      navigate(`/payment/${booking.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create booking or upload ID';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const nights = Math.max(1, differenceInCalendarDays(new Date(currentBooking.checkOut), new Date(currentBooking.checkIn)));
  const stayLabel = room ? `${room.name} · ${room.type} room` : 'Stay details';

  // Early check-in/late check-out fee logic
  const STANDARD_CHECKIN = '14:00';
  const STANDARD_CHECKOUT = '12:00';
  const EARLY_CHECKIN_FEE = 30; // Flat fee, can be changed
  const LATE_CHECKOUT_FEE = 40; // Flat fee, can be changed

  let earlyCheckInFee = 0;
  let lateCheckOutFee = 0;
  if (currentBooking.checkInTime && currentBooking.checkInTime < STANDARD_CHECKIN) {
    earlyCheckInFee = EARLY_CHECKIN_FEE;
  }
  if (currentBooking.checkOutTime && currentBooking.checkOutTime > STANDARD_CHECKOUT) {
    lateCheckOutFee = LATE_CHECKOUT_FEE;
  }

  // GST calculation based on room price per night
  let gstRate = 0;
  if (room) {
    if (room.price < 1000) {
      gstRate = 0;
    } else if (room.price >= 1000 && room.price <= 7500) {
      gstRate = 0.05;
    } else if (room.price > 7500) {
      gstRate = 0.18;
    }
  }
  const gstAmount = room ? room.price * gstRate * nights : 0;

  // Update taxes to use GST
  const taxes = gstAmount;
  const totalWithExtras = currentBooking.roomPrice + taxes + currentBooking.serviceCharges + earlyCheckInFee + lateCheckOutFee;

  return (
    <div className="min-h-screen bg-[#3f4a40] text-[#efece6] pt-10">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#3f4a40]"/>
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />

        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <div className="rounded-[2rem] border border-[#4b5246] bg-[#3a4035]/95 shadow-2xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#4b5246]">
              <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.25em] text-[#c9c3b6]">
                {[
                  'Choose Your Room',
                  'Select Dates & Guests',
                  'Guest Information',
                  'Payment',
                ].map((label, index) => {
                  const step = index + 1;
                  const isActive = step === 3;
                  const isComplete = step < 3;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <div
                        className={`h-7 w-7 rounded-full border text-xs flex items-center justify-center ${
                          isActive
                            ? 'border-[#d7d0bf] text-[#1f241f] bg-[#d7d0bf]'
                            : isComplete
                            ? 'border-[#9aa191] text-[#9aa191]'
                            : 'border-[#5b6255] text-[#c9c3b6]'
                        }`}
                      >
                        {isComplete ? '✓' : step}
                      </div>
                      <span className={isActive ? 'text-[#efece6]' : ''}>{label}</span>
                      {step < 4 && <span className="h-px w-8 bg-[#5b6255]" />}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-9 w-9 rounded-full border border-[#5b6255] text-[#d7d0bf] hover:bg-white/10 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 p-6 lg:p-8">
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl text-[#efece6]">Guest Information</h1>
                  <div className="h-px w-20 bg-[#5b6255] mt-3" />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="guestName" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                      First and last name*
                    </Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9c3b6]" />
                      <Input
                        id="guestName"
                        type="text"
                        placeholder="Enter your full name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guestEmail" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                      Email*
                    </Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9c3b6]" />
                      <Input
                        id="guestEmail"
                        type="email"
                        placeholder="Enter your email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guestPhone" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                      Phone number*
                    </Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9c3b6]" />
                      <Input
                        id="guestPhone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={guestPhone.replace(/^\+/, '')}
                        onChange={(e) => setGuestPhone(e.target.value.replace(/^\+/, ''))}
                        className="pl-10 h-11 rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialRequests" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                      Special requests
                    </Label>
                    <textarea
                      id="specialRequests"
                      placeholder="Any special requirements or requests?"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="mt-2 w-full h-28 px-4 py-3 rounded-xl bg-[#343a30] border border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191] resize-none focus:outline-none focus:ring-2 focus:ring-[#7f876f]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="idType" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                        ID type*
                      </Label>
                      <select
                        id="idType"
                        value={idType}
                        onChange={(event) => setIdType(event.target.value)}
                        className="mt-2 w-full h-11 px-4 rounded-xl bg-[#343a30] border border-[#4b5246] text-[#efece6]"
                        required
                      >
                        <option value="Government ID">Government ID</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="idProof" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                        Upload ID*
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
                          className="flex items-center justify-between gap-3 px-4 h-11 rounded-xl border border-[#4b5246] bg-[#343a30] text-sm text-[#c9c3b6] cursor-pointer"
                        >
                          <span>{idProof ? idProof.name : 'Select file'}</span>
                          <span className="text-[11px] uppercase tracking-[0.2em]">Browse</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#4b5246] bg-[#2f352b] px-4 py-3 text-xs text-[#c9c3b6]">
                    Your check-in is available only after admin approval.
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 text-sm text-[#d7d0bf]">
                      <input
                        type="checkbox"
                        id="terms"
                        className="mt-1 h-4 w-4 rounded border-[#5b6255] bg-transparent text-[#d7d0bf]"
                        required
                      />
                      I agree to the hotel's terms, cancellation policy, and privacy policy.
                    </label>
                    <label className="flex items-start gap-3 text-sm text-[#d7d0bf]">
                      <input
                        type="checkbox"
                        id="marketing"
                        className="mt-1 h-4 w-4 rounded border-[#5b6255] bg-transparent text-[#d7d0bf]"
                      />
                      Send me exclusive offers and updates via email.
                    </label>
                    {user && (
                      <label className="flex items-start gap-3 text-sm text-[#d7d0bf]">
                        <input
                          type="checkbox"
                          id="saveProfile"
                          checked={saveToProfile}
                          onChange={(e) => setSaveToProfile(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-[#5b6255] bg-transparent text-[#d7d0bf]"
                        />
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#d7d0bf]" />
                          Save these details to my profile for future bookings.
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-[#c9c3b6]">Stay details</h3>
                  <span className="text-xs text-[#c9c3b6]">{room ? room.name : 'Suite'}</span>
                </div>
                <div className="space-y-2 text-sm text-[#d7d0bf]">
                  <div className="flex justify-between">
                    <span>Arrive</span>
                    <span>{format(currentBooking.checkIn, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depart</span>
                    <span>{format(currentBooking.checkOut, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nights</span>
                    <span>{nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guests</span>
                    <span>{currentBooking.guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Room Count</span>
                    <span>{currentBooking.rooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Room Type</span>
                    <span>{room?.type || 'Suite'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#4b5246] text-sm text-[#c9c3b6]">
                  {stayLabel}
                </div>
                <div className="mt-4 pt-4 border-t border-[#4b5246] text-sm text-[#d7d0bf] space-y-2">
                  <div className="flex justify-between">
                    <span>Room Charges</span>
                    <span>₹{currentBooking.roomPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({gstRate * 100}%)</span>
                    <span>₹{taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charges</span>
                    <span>₹{currentBooking.serviceCharges.toFixed(2)}</span>
                  </div>
                </div>
                {earlyCheckInFee > 0 && (
                  <div className="flex justify-between text-[#eab308]">
                    <span>Early Check-In Fee</span>
                    <span>₹{earlyCheckInFee.toFixed(2)}</span>
                  </div>
                )}
                {lateCheckOutFee > 0 && (
                  <div className="flex justify-between text-[#eab308]">
                    <span>Late Check-Out Fee</span>
                    <span>₹{lateCheckOutFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-[#4b5246] flex items-center justify-between text-[#efece6]">
                  <span className="text-sm">Grand Total</span>
                  <span className="text-lg">₹{totalWithExtras.toFixed(2)}</span>
                </div>
                <Button
                  type="submit"
                  className="mt-5 w-full rounded-xl border border-[#5b6255] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca]"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading ID...' : 'Continue to Payment'}
                  <CreditCard className="w-4 h-4 ml-2" />
                </Button>
                {!room && roomLoadError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    {roomLoadError}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Booking;
