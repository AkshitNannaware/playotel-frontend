import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { X, Lock, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useBooking } from '../context/BookingContext';
import { toast } from 'sonner';
import type { Room } from '../types/room';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const Payment = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
  const { bookingId, serviceBookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { bookings, refreshBookings } = useBooking();
  const [serviceBooking, setServiceBooking] = useState<any | null>(null);
  const [serviceBookingLoading, setServiceBookingLoading] = useState(false);
  const [serviceBookingError, setServiceBookingError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoadError, setRoomLoadError] = useState<string | null>(null);
  const isServicePayment = location.pathname.startsWith('/payment/service/');
  const booking = !isServicePayment ? bookings.find((b) => b.id === bookingId) : null;
    // Fetch service booking if needed
    useEffect(() => {
      if (!isServicePayment || !serviceBookingId) return;
      setServiceBookingLoading(true);
      setServiceBookingError(null);
      const fetchServiceBooking = async () => {
        try {
          const auth = JSON.parse(localStorage.getItem('auth') || '{}');
          const token = auth.token as string | undefined;
          if (!token) throw new Error('Session expired. Please log in again.');
          const response = await fetch(`${API_BASE}/api/service-bookings/${serviceBookingId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error(`Failed to load service booking (${response.status})`);
          const data = await response.json();
          setServiceBooking(data);
        } catch (error) {
          setServiceBookingError(error instanceof Error ? error.message : 'Failed to load service booking');
        } finally {
          setServiceBookingLoading(false);
        }
      };
      fetchServiceBooking();
    }, [isServicePayment, serviceBookingId, API_BASE]);

  const isCancelled = booking?.status === 'cancelled';
  const isIdApproved = booking?.idVerified === 'approved';
  const isPaymentLocked = Boolean(booking && (!isIdApproved || isCancelled));
  const paymentLockMessage = isCancelled
    ? 'This booking was cancelled. Payment is not available.'
    : 'Your ID proof must be approved by the admin before you can pay.';

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

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  useEffect(() => {
    refreshBookings().catch(() => {});
  }, []);

  useEffect(() => {
    const loadRoom = async () => {
      setRoomLoadError(null);
      try {
        const roomId = booking?.roomId;
        if (!roomId) {
          return;
        }
        const response = await fetch(`${API_BASE}/api/rooms/${roomId}`);
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

  if (isServicePayment) {
    if (serviceBookingLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">Loading service booking...</div>
        </div>
      );
    }
    if (!serviceBooking || serviceBookingError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl mb-4">Service Booking not found</h2>
            <Button onClick={() => navigate('/services')}>Browse Services</Button>
          </div>
        </div>
      );
    }
    // Razorpay handler for service payment
    const handleServicePayment = async (e: React.FormEvent) => {
      e.preventDefault();
      setProcessing(true);
      if (!RAZORPAY_KEY_ID) {
        toast.error('Razorpay key is not configured');
        setProcessing(false);
        return;
      }
      if (!serviceBookingId) {
        toast.error('Missing service booking ID');
        setProcessing(false);
        return;
      }
      const token = getAuthToken();
      if (!token) {
        toast.error('Please sign in to continue');
        setProcessing(false);
        return;
      }
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay checkout');
        setProcessing(false);
        return;
      }
      try {
        // Create Razorpay order for service booking
        const orderResponse = await fetch(`${API_BASE}/api/payments/razorpay/service-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ serviceBookingId }),
        });
        if (!orderResponse.ok) {
          let message = `Failed to create order (${orderResponse.status})`;
          try {
            const data = await orderResponse.json();
            if (data?.message) message = data.message;
          } catch {}
          throw new Error(message);
        }
        const order = await orderResponse.json();
        const options: any = {
          key: RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Service Payment',
          description: `Service Booking ${serviceBooking.id || serviceBooking._id}`,
          order_id: order.orderId,
          prefill: {
            name: serviceBooking.guestName,
            email: serviceBooking.guestEmail,
            contact: serviceBooking.guestPhone,
          },
          notes: {
            serviceBookingId: serviceBooking.id || serviceBooking._id,
          },
          modal: {
            ondismiss: () => setProcessing(false),
          },
          handler: async (response: any) => {
            try {
              const verifyResponse = await fetch(`${API_BASE}/api/payments/razorpay/service-verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  serviceBookingId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              if (!verifyResponse.ok) {
                throw new Error('Payment verification failed');
              }
              navigate(`/payment-success/service/${serviceBookingId}`);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Payment verification failed';
              toast.error(message);
              navigate(`/payment-failed/service/${serviceBookingId}`);
            } finally {
              setProcessing(false);
            }
          },
        };
        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', (response: any) => {
          const description = response?.error?.description || 'Payment failed';
          toast.error(description);
          navigate(`/payment-failed/service/${serviceBookingId}`);
          setProcessing(false);
        });
        razorpay.open();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Payment failed';
        toast.error(message);
        setProcessing(false);
      }
    };

    // Show service payment UI similar to room payment
    return (
      <div className="min-h-screen bg-[#3f4a40] text-[#efece6] pt-10">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[#3f4a40]" />
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />
          <div className="relative max-w-6xl mx-auto px-4 py-12">
            <div className="rounded-[2rem] border border-[#4b5246] bg-[#3a4035]/95 shadow-2xl overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#4b5246]">
                <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.25em] text-[#c9c3b6]">
                  {[' Service Payment'].map((label, index) => {
                    const step = index + 1;
                    const isActive = step === 4;
                    const isComplete = step < 4;
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
                          {isComplete ? 'OK' : step}
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

              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 p-6 lg:p-8">
                <div>
                  <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl text-[#efece6]">Service Payment</h1>
                    <div className="h-px w-20 bg-[#5b6255] mt-3" />
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] px-5 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6] mb-2">One-click book</div>
                      <Button
                        className="w-full rounded-xl border border-[#5b6255] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca]"
                        disabled={processing}
                        onClick={handleServicePayment}
                      >
                        {processing ? 'Processing...' : 'Book with GPay'}
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] px-5 py-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Pay with credit card</div>
                          <p className="text-sm text-[#9aa191] mt-1">Secure payment powered by Razorpay.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#c9c3b6]">
                          <Lock className="w-4 h-4" />
                          SSL secured
                        </div>
                      </div>

                      <form className="space-y-3" onSubmit={handleServicePayment}>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Card holder name</label>
                          <Input
                            placeholder="Card holder name"
                            className="mt-2 h-11 rounded-xl bg-[#2f352b] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Card number</label>
                          <Input
                            placeholder="Card number"
                            className="mt-2 h-11 rounded-xl bg-[#2f352b] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Expiration date</label>
                            <Input
                              placeholder="MM/YY"
                              className="mt-2 h-11 rounded-xl bg-[#2f352b] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">CVC</label>
                            <Input
                              placeholder="CVC"
                              className="mt-2 h-11 rounded-xl bg-[#2f352b] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full rounded-xl border border-[#5b6255] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca]"
                          disabled={processing}
                        >
                          {processing ? 'Processing...' : 'Confirm Reservation'}
                          <CreditCard className="w-4 h-4 ml-2" />
                        </Button>
                      </form>
                    </div>

                    <div className="rounded-2xl border border-[#4b5246] bg-[#2f352b] px-5 py-4 text-xs text-[#c9c3b6]">
                      Cancellation policy: Service bookings are charged the total price upon confirmation.
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm uppercase tracking-[0.2em] text-[#c9c3b6]">Service details</h3>
                    <span className="text-xs text-[#c9c3b6]">₹{serviceBooking.totalPrice || serviceBooking.priceRange || 'N/A'}</span>
                  </div>
                  <div className="space-y-2 text-sm text-[#d7d0bf]">
                    <div className="flex justify-between">
                      <span>Service</span>
                      <span>{serviceBooking.serviceName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date</span>
                      <span>{serviceBooking.date ? new Date(serviceBooking.date).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time</span>
                      <span>{serviceBooking.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Guests</span>
                      <span>{serviceBooking.guests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category</span>
                      <span>{serviceBooking.category}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#4b5246] text-sm text-[#d7d0bf] space-y-2">
                    <div className="flex justify-between">
                      <span>Grand Total</span>
                      <span>₹{serviceBooking.totalPrice || serviceBooking.priceRange || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Now</span>
                      <span>₹{serviceBooking.totalPrice || serviceBooking.priceRange || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due at Hotel</span>
                      <span>₹0.00</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl border border-[#5b6255] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca]"
                    disabled={processing}
                  >
                    Pay at Service
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePaymentWithMethod();
  };

  const handleUPIPayment = async () => {
    await handlePaymentWithMethod('upi');
  };

  const handlePaymentWithMethod = async (method?: string) => {
    setProcessing(true);

    if (isPaymentLocked) {
      toast.error(paymentLockMessage);
      setProcessing(false);
      return;
    }

    if (!RAZORPAY_KEY_ID) {
      toast.error('Razorpay key is not configured');
      setProcessing(false);
      return;
    }

    if (!bookingId) {
      toast.error('Missing booking ID');
      setProcessing(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error('Please sign in to continue');
      setProcessing(false);
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Failed to load Razorpay checkout');
      setProcessing(false);
      return;
    }

    try {
      const orderResponse = await fetch(`${API_BASE}/api/payments/razorpay/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!orderResponse.ok) {
        let message = `Failed to create order (${orderResponse.status})`;
        try {
          const data = await orderResponse.json();
          if (data?.message) {
            message = data.message;
          }
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const order = await orderResponse.json();

      const options: any = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Hotel Booking',
        description: `Booking ${booking.id}`,
        order_id: order.orderId,
        prefill: {
          name: booking.guestName,
          email: booking.guestEmail,
          contact: booking.guestPhone,
        },
        notes: {
          bookingId: booking.id,
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch(`${API_BASE}/api/payments/razorpay/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            navigate(`/payment-success/${bookingId}`);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Payment verification failed';
            toast.error(message);
            navigate(`/payment-failed/${bookingId}`);
          } finally {
            setProcessing(false);
          }
        },
      };

      if (method === 'upi') {
        options.method = { upi: true };
      }

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        const description = response?.error?.description || 'Payment failed';
        toast.error(description);
        navigate(`/payment-failed/${bookingId}`);
        setProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      toast.error(message);
      setProcessing(false);
    }
  };

  const handlePayAtCheckIn = () => {
    toast.success('Booking confirmed! Payment will be collected at check-in.');
    setTimeout(() => {
      navigate(`/payment-success/${bookingId}?payAtCheckin=true`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#3f4a40] text-[#efece6] pt-10">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#3f4a40]"/>
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />

        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <div className="rounded-[2rem] border border-[#4b5246] bg-[#3a4035]/95 shadow-2xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#4b5246]">
              <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.25em] text-[#c9c3b6]">
                {['Select Dates & Guests', 'Choose Your Room', 'Guest Information', 'Payment'].map((label, index) => {
                  const step = index + 1;
                  const isActive = step === 4;
                  const isComplete = step < 4;
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
                        {isComplete ? 'OK' : step}
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

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 p-6 lg:p-8">
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl text-[#efece6]">Payment</h1>
                  <div className="h-px w-20 bg-[#5b6255] mt-3" />
                </div>

                {isPaymentLocked && (
                  <div className="mb-6 rounded-xl border border-amber-200 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                    {paymentLockMessage}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] px-5 py-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6] mb-2">One-click book</div>
                    <Button
                      onClick={handleUPIPayment}
                      className="w-full rounded-xl border border-[#5b6255] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca]"
                      disabled={processing || isPaymentLocked}
                    >
                      {processing ? 'Processing...' : 'Book with GPay'}
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] px-5 py-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Pay with credit card</div>
                        <p className="text-sm text-[#9aa191] mt-1">Secure payment powered by Razorpay.</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#c9c3b6]">
                        <Lock className="w-4 h-4" />
                        SSL secured
                      </div>
                    </div>

                    <form onSubmit={handlePayment} className="space-y-3">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Card holder name</label>
                        <Input
                          placeholder="Card holder name"
                          className="mt-2 h-11 rounded-xl bg-[#2f352b] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Card number</label>
                        <Input
                          placeholder="Card number"
                          className="mt-2 h-11 rounded-xl bg-[#2f352b] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Expiration date</label>
                          <Input
                            placeholder="MM/YY"
                            className="mt-2 h-11 rounded-xl bg-[#2f352b] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">CVC</label>
                          <Input
                            placeholder="CVC"
                            className="mt-2 h-11 rounded-xl bg-[#2f352b] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full rounded-xl border border-[#5b6255] bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca]"
                        disabled={processing || isPaymentLocked}
                      >
                        {processing ? 'Processing...' : 'Confirm Reservation'}
                        <CreditCard className="w-4 h-4 ml-2" />
                      </Button>
                    </form>
                  </div>

                  <div className="rounded-2xl border border-[#4b5246] bg-[#2f352b] px-5 py-4 text-xs text-[#c9c3b6]">
                    Cancellation policy: Bookings are charged the total price upon confirmation.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#4b5246] bg-[#343a30] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-[#c9c3b6]">Stay details</h3>
                  <span className="text-xs text-[#c9c3b6]">₹{booking?.totalPrice !== undefined ? booking.totalPrice.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="space-y-2 text-sm text-[#d7d0bf]">
                  <div className="flex justify-between">
                    <span>Arrive</span>
                    <span>{booking?.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depart</span>
                    <span>{booking?.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nights</span>
                    <span>{booking?.checkIn && booking?.checkOut ? Math.max(1, Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guests</span>
                    <span>{booking?.guests ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Room Type</span>
                    <span>{room?.type || 'Suite'}</span>
                  </div>
                </div>

                {roomLoadError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    {roomLoadError}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-[#4b5246]">
                  <label className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Coupon</label>
                  <Input
                    placeholder="Enter coupon code"
                    className="mt-2 h-11 rounded-xl bg-[#2f352b] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-[#4b5246] text-sm text-[#d7d0bf] space-y-2">
                  <div className="flex justify-between">
                    <span>Grand Total</span>
                    <span>₹{booking.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Now</span>
                    <span>₹{booking.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due at Hotel</span>
                    <span>₹0.00</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 w-full rounded-xl border-[#5b6255] text-[#d7d0bf] hover:bg-white/10"
                  onClick={handlePayAtCheckIn}
                  disabled={processing}
                >
                  Pay at Check-in
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Payment;
