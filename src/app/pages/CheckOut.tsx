import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Calendar, Clock, DollarSign, CheckCircle, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useBooking } from '../context/BookingContext';
import { toast } from 'sonner';
import { format, differenceInCalendarDays } from 'date-fns';
import type { Room } from '../types/room';

const CheckOut = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { bookings, updateBookingStatus } = useBooking();
  const booking = bookings.find(b => b.id === bookingId);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoadError, setRoomLoadError] = useState<string | null>(null);
  const [lateCheckout, setLateCheckout] = useState(false);
  const [lateCheckoutTime, setLateCheckoutTime] = useState('14:00');
  const [step, setStep] = useState(1);
  const [pendingPaid, setPendingPaid] = useState(false);

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

  const lateCheckoutPrices: Record<string, number> = {
    '14:00': 50,
    '16:00': 75,
    '18:00': 100,
    '20:00': 150,
  };

  const additionalCharges = lateCheckout ? lateCheckoutPrices[lateCheckoutTime] : 0;
  const nights = Math.max(1, differenceInCalendarDays(new Date(booking?.checkOut || new Date()), new Date(booking?.checkIn || new Date())));

  const handleCheckOut = () => {
    if (!booking) return;
    // Prevent check-out if payment is not completed
    if (booking.paymentStatus !== 'paid') {
      toast.error('Full payment is required before check-out.');
      return;
    }
    // Prevent check-out if booking is in the past
    const now = new Date();
    const bookingCheckout = new Date(booking.checkOut);
    if (now > bookingCheckout) {
      toast.error('Check-out is not allowed for past bookings.');
      return;
    }
    // Prevent check-out if pending late/early fee not paid
    if (pendingAmount > 0 && !pendingPaid) {
      toast.error('Please pay the pending amount before checking out.');
      return;
    }
    updateBookingStatus(booking.id, 'check-out');
    setStep(2);
    toast.success('Check-out successful!');
  };

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

                <h1 className="text-4xl mb-3 text-[white]">Check-Out Complete!</h1>
                <p className="text-xl text-[#efece6] mb-8">
                  Thank you for staying with us
                </p>

                <div className="max-w-2xl mx-auto">
                  <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] p-6 mb-8 text-left">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm uppercase tracking-[0.2em] text-[#c9c3b6]">Booking Summary</h3>
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

                    <div className="space-y-2 text-sm text-[#d7d0bf] mb-4">
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
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#c9c3b6]">Room Charges</span>
                        <span className="text-[#d7d0bf]">${booking.totalPrice.toFixed(2)}</span>
                      </div>
                      {additionalCharges > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#c9c3b6]">Late Check-out</span>
                          <span className="text-[#d7d0bf]">${additionalCharges.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#4b5246] flex items-center justify-between text-[#efece6]">
                      <span className="text-sm">Total Amount</span>
                      <span className="text-2xl">${(booking.totalPrice + additionalCharges).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-[#4b5246] bg-[#2f352b] px-4 py-3 text-sm text-[#c9c3b6] text-left">
                      <p className="mb-2"><strong>We hope you enjoyed your stay!</strong></p>
                      <p>A detailed invoice has been sent to your email. Please check your belongings before leaving.</p>
                    </div>

                    <Button 
                      onClick={() => navigate('/')} 
                      className="w-full h-12 rounded-xl border border-[#5b6255] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca]"
                    >
                      Back to Home
                    </Button>

                    <Button 
                      onClick={() => navigate('/profile')} 
                      variant="outline"
                      className="w-full h-12 rounded-xl border border-[#5b6255] text-[#d7d0bf] hover:bg-white/10"
                    >
                      View My Bookings
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

  // Prevent check-out UI if payment not done or booking is in the past
  const now = new Date();
  const bookingCheckout = new Date(booking.checkOut);
  if (booking.paymentStatus !== 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Full payment required</h2>
          <p className="text-stone-600 mb-6">You must complete payment before you can check out.</p>
          <Button onClick={() => navigate('/profile')}>Back to Profile</Button>
        </div>
      </div>
    );
  }
  if (now > bookingCheckout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Check-out not allowed</h2>
          <p className="text-stone-600 mb-6">Check-out is not allowed for past bookings.</p>
          <Button onClick={() => navigate('/profile')}>Back to Profile</Button>
        </div>
      </div>
    );
  }

  // Calculate pending amount for late check-out
  const pendingAmount = lateCheckout ? lateCheckoutPrices[lateCheckoutTime] : 0;

  // Simulate payment for pending amount
  const handlePendingPayment = () => {
    // In real app, redirect to payment gateway for pendingAmount
    setTimeout(() => {
      setPendingPaid(true);
      toast.success('Pending amount paid successfully!');
    }, 1000);
  };

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
              {/* Left Column - Check-Out Options */}
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl text-[#efece6]">Check-Out</h1>
                  <div className="h-px w-20 bg-[#5b6255] mt-3" />
                </div>

                <div className="space-y-6">
                  {/* Late Check-Out Card */}
                  <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] p-5">
                    <h3 className="text-sm uppercase tracking-[0.2em] text-[#c9c3b6] mb-4">Late Check-Out (Optional)</h3>

                    <RadioGroup value={lateCheckout ? 'yes' : 'no'} onValueChange={(value) => setLateCheckout(value === 'yes')}>
                      <div className="space-y-3">
                        <div className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${
                          !lateCheckout 
                            ? 'border-[#7f876f] bg-[#3a4035]' 
                            : 'border-[#4b5246] bg-[#2f352b] hover:bg-[#3a4035]'
                        }`}>
                          <RadioGroupItem value="no" id="no-late" className="mr-3 border-[#5b6255] text-[#d7d0bf]" />
                          <Label htmlFor="no-late" className="cursor-pointer flex-1 text-[#d7d0bf]">
                            <span className="block">Standard Check-out (12:00 PM)</span>
                            <span className="text-xs text-[#9aa191]">No additional charge</span>
                          </Label>
                          <span className="text-[#d7d0bf]">$0</span>
                        </div>

                        <div className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${
                          lateCheckout 
                            ? 'border-[#7f876f] bg-[#3a4035]' 
                            : 'border-[#4b5246] bg-[#2f352b] hover:bg-[#3a4035]'
                        }`}>
                          <RadioGroupItem value="yes" id="yes-late" className="mr-3 border-[#5b6255] text-[#d7d0bf]" />
                          <Label htmlFor="yes-late" className="cursor-pointer flex-1 text-[#d7d0bf]">
                            <span className="block">Request Late Check-out</span>
                            <span className="text-xs text-[#9aa191]">Subject to availability</span>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>

                    {lateCheckout && (
                      <div className="mt-4 pt-4 border-t border-[#4b5246]">
                        <Label htmlFor="lateTime" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">
                          Select Late Check-out Time
                        </Label>
                        <select
                          id="lateTime"
                          value={lateCheckoutTime}
                          onChange={(e) => setLateCheckoutTime(e.target.value)}
                          className="mt-2 w-full h-11 px-4 rounded-xl bg-[#2f352b] border-[#4b5246] text-[#efece6] focus:outline-none focus:ring-2 focus:ring-[#7f876f]"
                        >
                          <option value="14:00">2:00 PM - $50</option>
                          <option value="16:00">4:00 PM - $75</option>
                          <option value="18:00">6:00 PM - $100</option>
                          <option value="20:00">8:00 PM - $150</option>
                        </select>

                        <div className="mt-4 rounded-xl border border-[#4b5246] bg-[#2f352b] px-4 py-3 text-xs text-[#c9c3b6]">
                          Late check-out is subject to room availability and will be confirmed upon request.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Before You Leave Card */}
                  <div className="rounded-xl border border-[#4b5246] bg-[#2f352b] px-4 py-3 text-sm text-[#c9c3b6]">
                    <p className="mb-2"><strong>Before you leave:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Please return your room key card at reception</li>
                      <li>Check for personal belongings in the room</li>
                      <li>Settle any mini-bar or room service charges</li>
                      <li>Provide feedback about your stay</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column - Payment Summary Card */}
              <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] p-5 h-fit">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-[#c9c3b6]">Payment Summary</h3>
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

                <div className="space-y-2 text-sm text-[#d7d0bf] mb-4">
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

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#c9c3b6]">Room Charges</span>
                    <span className="text-[#d7d0bf]">${booking.totalPrice.toFixed(2)}</span>
                  </div>
                  {lateCheckout && (
                    <div className="flex justify-between">
                      <span className="text-[#c9c3b6]">Late Check-out ({lateCheckoutTime})</span>
                      <span className="text-[#d7d0bf]">${lateCheckoutPrices[lateCheckoutTime].toFixed(2)}</span>
                    </div>
                  )}
                  {pendingAmount > 0 && !pendingPaid && (
                    <div className="flex justify-between text-[#eab308]">
                      <span>Pending Amount</span>
                      <span>${pendingAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#4b5246] flex items-center justify-between text-[#efece6]">
                  <span className="text-sm">Total Amount</span>
                  <span className="text-2xl">${(booking.totalPrice + additionalCharges).toFixed(2)}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#4b5246]">
                  <div className="flex items-center justify-between text-[#efece6] mb-4">
                    <span className="text-sm">Status</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      booking.status === 'confirmed' ? 'bg-green-900/50 text-green-400' :
                      booking.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-blue-900/50 text-blue-400'
                    }`}>
                      {booking.status || 'confirmed'}
                    </span>
                  </div>

                  {pendingAmount > 0 && !pendingPaid ? (
                    <Button
                      onClick={handlePendingPayment}
                      className="w-full h-12 rounded-xl border border-[#eab308] bg-[#eab308] text-[#1f241f] hover:bg-[#ffe066]"
                    >
                      Pay Pending Amount (${pendingAmount.toFixed(2)})
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCheckOut}
                      className="w-full h-12 rounded-xl border border-[#5b6255] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca]"
                      disabled={pendingAmount > 0 && !pendingPaid}
                    >
                      Complete Check-Out
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>

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

export default CheckOut;