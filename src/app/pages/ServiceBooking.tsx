// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router';
// import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';
// import { Button } from '../components/ui/button';
// import { Input } from '../components/ui/input';
// import { Label } from '../components/ui/label';
// import { toast } from 'sonner';
// import { useAuth } from '../context/AuthContext';

// type Service = {
//   id: string;
//   name: string;
//   category: 'dining' | 'restaurant' | 'spa' | 'bar';
//   description: string;
//   image: string;
//   video: string;
//   priceRange: string;
//   availableTimes: string[];
// };

// const ServiceBooking = () => {
//   const { serviceId } = useParams();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [service, setService] = useState<Service | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [loadError, setLoadError] = useState<string | null>(null);
//   const [bookingId, setBookingId] = useState<string | null>(null);
//   const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000';

//   const resolveImageUrl = (imageUrl: string) => {
//     if (!imageUrl) return '';
//     const trimmed = imageUrl.trim();
//     if (!trimmed) return '';
//     if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
//       return trimmed;
//     }
//     if (trimmed.startsWith('/uploads/')) {
//       return `${API_BASE}${trimmed}`;
//     }
//     if (trimmed.startsWith('uploads/')) {
//       return `${API_BASE}/${trimmed}`;
//     }
//     if (trimmed.startsWith('/')) {
//       return `${API_BASE}${trimmed}`;
//     }
//     return `${API_BASE}/${trimmed}`;
//   };

//   const resolveVideoUrl = (videoUrl: string) => {
//     if (!videoUrl) return '';
//     const trimmed = videoUrl.trim();
//     if (!trimmed) return '';
//     if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
//       return trimmed;
//     }
//     if (trimmed.startsWith('/uploads/')) {
//       return `${API_BASE}${trimmed}`;
//     }
//     if (trimmed.startsWith('uploads/')) {
//       return `${API_BASE}/${trimmed}`;
//     }
//     if (trimmed.startsWith('/')) {
//       return `${API_BASE}${trimmed}`;
//     }
//     return `${API_BASE}/${trimmed}`;
//   };

//   const [date, setDate] = useState('');
//   const [time, setTime] = useState('');
//   const [guests, setGuests] = useState('2');
//   const [specialRequests, setSpecialRequests] = useState('');
//   const [step, setStep] = useState(1);

//   useEffect(() => {
//     if (!serviceId) {
//       setLoadError('Missing service ID');
//       return;
//     }

//     const loadService = async () => {
//       setIsLoading(true);
//       setLoadError(null);
//       try {
//         const response = await fetch(`${API_BASE}/api/services/${serviceId}`);
//         if (!response.ok) {
//           throw new Error(`Failed to load service (${response.status})`);
//         }
//         const data = await response.json();
//         setService({
//           id: data._id || data.id,
//           name: data.name,
//           category: String(data.category || '').toLowerCase(),
//           description: data.description || '',
//           image: data.image || '',
//           video: data.video || '',
//           priceRange: data.priceRange || '',
//           availableTimes: data.availableTimes || [],
//         });
//       } catch (error) {
//         const message = error instanceof Error ? error.message : 'Failed to load service';
//         setLoadError(message);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadService();
//   }, [API_BASE, serviceId]);

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-stone-600">Loading service...</div>
//       </div>
//     );
//   }

//   if (loadError || !service) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl mb-4">Service not found</h2>
//           {loadError && <p className="text-stone-600 mb-4">{loadError}</p>}
//           <Button onClick={() => navigate('/services')}>Back to Services</Button>
//         </div>
//       </div>
//     );
//   }

//   const getAuthToken = () => {
//     const stored = localStorage.getItem('auth');
//     if (!stored) {
//       return null;
//     }
//     try {
//       const parsed = JSON.parse(stored);
//       return parsed.token as string | undefined;
//     } catch {
//       return null;
//     }
//   };

//   const handleBooking = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!date || !time) {
//       toast.error('Please select date and time');
//       return;
//     }

//     if (!user) {
//       toast.error('Please sign in to book a service');
//       navigate('/login');
//       return;
//     }

//     const token = getAuthToken();
//     if (!token) {
//       toast.error('Please sign in to book a service');
//       navigate('/login');
//       return;
//     }

//     try {
//       const response = await fetch(`${API_BASE}/api/service-bookings`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           serviceId: service?.id,
//           date,
//           time,
//           guests: Number(guests) || 1,
//           specialRequests,
//           guestName: user.name,
//           guestEmail: user.email,
//           guestPhone: user.phone,
//         }),
//       });

//       if (!response.ok) {
//         let message = `Booking failed (${response.status})`;
//         try {
//           const data = await response.json();
//           if (data?.message) {
//             message = data.message;
//           }
//         } catch {
//           // ignore
//         }
//         throw new Error(message);
//       }

//       const saved = await response.json();
//       setBookingId(saved._id || saved.id || null);
//       setStep(2);
//       toast.success('Service booked successfully!');
//     } catch (error) {
//       const message = error instanceof Error ? error.message : 'Service booking failed';
//       toast.error(message);
//     }
//   };

//   if (step === 2) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-green-50 to-stone-50 flex items-center justify-center px-4 py-8">
//         <div className="max-w-2xl w-full">
//           <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
//             <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
//               <CheckCircle className="w-12 h-12 text-white" />
//             </div>

//             <h1 className="text-4xl mb-3">Booking Confirmed!</h1>
//             <p className="text-xl text-stone-600 mb-8">
//               Your {service.name.toLowerCase()} reservation is confirmed
//             </p>

//             <div className="bg-stone-50 rounded-2xl p-6 mb-8 text-left">
//               <div className="mb-6">
//                 <div className="text-sm text-stone-600 mb-1">Service</div>
//                 <div className="text-2xl">{service.name}</div>
//                 <div className="text-stone-600">{service.description}</div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
//                 <div>
//                   <div className="text-sm text-stone-600 mb-1">Date</div>
//                   <div className="text-lg">{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
//                 </div>
//                 <div>
//                   <div className="text-sm text-stone-600 mb-1">Time</div>
//                   <div className="text-lg">{time}</div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
//                 <div>
//                   <div className="text-sm text-stone-600 mb-1">Number of Guests</div>
//                   <div className="text-lg">{guests}</div>
//                 </div>
//                 <div>
//                   <div className="text-sm text-stone-600 mb-1">Booking ID</div>
//                   <div className="text-lg">{bookingId ? bookingId : 'SRV'}</div>
//                 </div>
//               </div>

//               {specialRequests && (
//                 <div className="pt-6 border-t border-stone-200">
//                   <div className="text-sm text-stone-600 mb-1">Special Requests</div>
//                   <div>{specialRequests}</div>
//                 </div>
//               )}
//             </div>

//             <div className="space-y-3">
//               <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 text-left">
//                 <p className="mb-2"><strong>Confirmation sent!</strong></p>
//                 <p>A confirmation email has been sent with all the details. Please arrive 10 minutes before your reservation time.</p>
//               </div>

//               <Button onClick={() => navigate('/services')} className="w-full h-12 rounded-xl">
//                 Browse More Services
//               </Button>

//               <Button onClick={() => navigate('/')} variant="outline" className="w-full h-12 rounded-xl">
//                 Back to Home
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-stone-50 py-8">
//       <div className="max-w-5xl mx-auto px-4">
//         <div className="mb-8">
//           <Button variant="ghost" onClick={() => navigate('/services')} className="mb-4">
//             ← Back to Services
//           </Button>
//           <h1 className="text-4xl mb-2">Book {service.name}</h1>
//           <p className="text-stone-600">{service.description}</p>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Booking Form */}
//           <div className="lg:col-span-2">
//             <form onSubmit={handleBooking} className="space-y-6">
//               <div className="bg-white rounded-3xl p-8 shadow-sm">
//                 <h2 className="text-2xl mb-6">Reservation Details</h2>

//                 <div className="space-y-5">
//                   <div>
//                     <Label htmlFor="date">Select Date *</Label>
//                     <div className="relative mt-2">
//                       <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
//                       <Input
//                         id="date"
//                         type="date"
//                         value={date}
//                         onChange={(e) => setDate(e.target.value)}
//                         className="pl-10 h-12"
//                         min={new Date().toISOString().split('T')[0]}
//                         required
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <Label htmlFor="time">Select Time *</Label>
//                     <div className="relative mt-2">
//                       <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
//                       <select
//                         id="time"
//                         value={time}
//                         onChange={(e) => setTime(e.target.value)}
//                         className="w-full pl-10 h-12 px-4 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
//                         required
//                       >
//                         <option value="">Choose a time slot</option>
//                         {service.availableTimes.map((t) => (
//                           <option key={t} value={t}>{t}</option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   <div>
//                     <Label htmlFor="guests">Number of Guests *</Label>
//                     <div className="relative mt-2">
//                       <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
//                       <Input
//                         id="guests"
//                         type="number"
//                         min="1"
//                         max="10"
//                         value={guests}
//                         onChange={(e) => setGuests(e.target.value)}
//                         className="pl-10 h-12"
//                         required
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <Label htmlFor="requests">Special Requests (Optional)</Label>
//                     <textarea
//                       id="requests"
//                       placeholder="Any dietary restrictions, preferences, or special requests?"
//                       value={specialRequests}
//                       onChange={(e) => setSpecialRequests(e.target.value)}
//                       className="mt-2 w-full h-32 px-4 py-3 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-stone-900"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white rounded-3xl p-8 shadow-sm">
//                 <div className="flex items-start gap-3 mb-6">
//                   <input
//                     type="checkbox"
//                     id="terms"
//                     className="w-5 h-5 mt-1 rounded border-stone-300"
//                     required
//                   />
//                   <label htmlFor="terms" className="text-stone-700">
//                     I agree to the cancellation policy. Cancellations must be made at least 24 hours in advance.
//                   </label>
//                 </div>

//                 <Button type="submit" className="w-full h-14 rounded-xl text-base">
//                   Confirm Reservation
//                 </Button>
//               </div>
//             </form>
//           </div>

//           {/* Service Summary */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-3xl p-6 shadow-lg sticky top-4">
//               <h3 className="text-xl mb-6">Service Details</h3>

//               <div className="mb-6">
//                 {resolveVideoUrl(service.video) ? (
//                   <video
//                     src={resolveVideoUrl(service.video)}
//                     poster={resolveImageUrl(service.image) || undefined}
//                     className="w-full h-48 object-cover rounded-2xl"
//                     autoPlay
//                     muted
//                     loop
//                     playsInline
//                   />
//                 ) : resolveImageUrl(service.image) ? (
//                   <img
//                     src={resolveImageUrl(service.image)}
//                     alt={service.name}
//                     className="w-full h-48 object-cover rounded-2xl"
//                     onError={(event) => {
//                       const target = event.currentTarget;
//                       target.style.display = 'none';
//                     }}
//                   />
//                 ) : (
//                   <div className="h-48 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200" />
//                 )}
//               </div>

//               <div className="space-y-4 mb-6">
//                 <div>
//                   <div className="text-sm text-stone-600 mb-1">Service</div>
//                   <div className="text-lg">{service.name}</div>
//                 </div>

//                 <div>
//                   <div className="text-sm text-stone-600 mb-1">Category</div>
//                   <div className="capitalize">{service.category}</div>
//                 </div>

//                 <div>
//                   <div className="text-sm text-stone-600 mb-1">Price Range</div>
//                   <div className="text-lg">{service.priceRange}</div>
//                 </div>

//                 <div>
//                   <div className="text-sm text-stone-600 mb-1">Available Times</div>
//                   <div className="flex flex-wrap gap-2 mt-2">
//                     {service.availableTimes.map((t) => (
//                       <span key={t} className="px-3 py-1 bg-stone-100 rounded-full text-sm">
//                         {t}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
//                 <p>✓ Free cancellation up to 24 hours before reservation</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ServiceBooking;

























import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Calendar, Clock, Users, CheckCircle, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

type Service = {
  id: string;
  name: string;
  category: 'dining' | 'restaurant' | 'spa' | 'bar';
  description: string;
  image: string;
  video: string;
  priceRange: string;
  availableTimes: string[];
};

const ServiceBooking = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000';

  const resolveImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    const trimmed = imageUrl.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/uploads/')) {
      return `${API_BASE}${trimmed}`;
    }
    if (trimmed.startsWith('uploads/')) {
      return `${API_BASE}/${trimmed}`;
    }
    if (trimmed.startsWith('/')) {
      return `${API_BASE}${trimmed}`;
    }
    return `${API_BASE}/${trimmed}`;
  };

  const resolveVideoUrl = (videoUrl: string) => {
    if (!videoUrl) return '';
    const trimmed = videoUrl.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/uploads/')) {
      return `${API_BASE}${trimmed}`;
    }
    if (trimmed.startsWith('uploads/')) {
      return `${API_BASE}/${trimmed}`;
    }
    if (trimmed.startsWith('/')) {
      return `${API_BASE}${trimmed}`;
    }
    return `${API_BASE}/${trimmed}`;
  };

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!serviceId) {
      setLoadError('Missing service ID');
      return;
    }

    const loadService = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`${API_BASE}/api/services/${serviceId}`);
        if (!response.ok) {
          throw new Error(`Failed to load service (${response.status})`);
        }
        const data = await response.json();
        setService({
          id: data._id || data.id,
          name: data.name,
          category: String(data.category || '').toLowerCase() as any,
          description: data.description || '',
          image: data.image || '',
          video: data.video || '',
          priceRange: data.priceRange || '',
          availableTimes: data.availableTimes || [],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load service';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadService();
  }, [API_BASE, serviceId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-600">Loading service...</div>
      </div>
    );
  }

  if (loadError || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Service not found</h2>
          {loadError && <p className="text-stone-600 mb-4">{loadError}</p>}
          <Button onClick={() => navigate('/services')}>Back to Services</Button>
        </div>
      </div>
    );
  }

  const getAuthToken = () => {
    const stored = localStorage.getItem('auth');
    if (!stored) {
      return null;
    }
    try {
      const parsed = JSON.parse(stored);
      return parsed.token as string | undefined;
    } catch {
      return null;
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time) {
      toast.error('Please select date and time');
      return;
    }

    if (!user) {
      toast.error('Please sign in to book a service');
      navigate('/login');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error('Please sign in to book a service');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/service-bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: service?.id,
          serviceName: service?.name,
          category: service?.category,
          priceRange: service?.priceRange,
          date,
          time,
          guests: Number(guests) || 1,
          specialRequests,
          guestName: user.name,
          guestEmail: user.email,
          guestPhone: user.phone,
          userId: user.id,
          // Status is not sent - backend always sets it to 'pending' and requires admin approval
        }),
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
      setBookingId(saved._id || saved.id || null);
      setStep(2);
      toast.success('Service booking submitted! Waiting for admin approval.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Service booking failed';
      toast.error(message);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#3f4a40] text-[#efece6] relative overflow-hidden">
        <div className="absolute inset-0 bg-[#3f4a40]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />
        <div className="relative max-w-2xl mx-auto px-4 py-12 lg:py-20">
          <div className="bg-[#3a4035]/95 rounded-[2.5rem] border border-[#4b5246] shadow-2xl overflow-hidden text-center">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 mt-8">
              <Clock className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl mb-3 text-[#efece6]">Booking Pending Approval!</h1>
            <p className="text-xl text-[#c9c3b6] mb-8">
              Your {service.name.toLowerCase()} reservation has been submitted
            </p>
            <div className="bg-[#343a30] rounded-2xl p-6 mb-8 text-left border border-[#4b5246] mx-4">
              <div className="mb-6">
                <div className="text-sm text-[#c9c3b6] mb-1">Service</div>
                <div className="text-2xl text-[#efece6]">{service.name}</div>
                <div className="text-[#efece6]/80">{service.description}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-[#c9c3b6] mb-1">Date</div>
                  <div className="text-lg text-[#efece6]">{format(new Date(date), 'MMMM dd, yyyy')}</div>
                </div>
                <div>
                  <div className="text-sm text-[#c9c3b6] mb-1">Time</div>
                  <div className="text-lg text-[#efece6]">{time}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-[#c9c3b6] mb-1">Number of Guests</div>
                  <div className="text-lg text-[#efece6]">{guests}</div>
                </div>
                <div>
                  <div className="text-sm text-[#c9c3b6] mb-1">Booking ID</div>
                  <div className="text-lg text-[#efece6]">{bookingId ? bookingId.slice(-8) : 'SRV'}</div>
                </div>
              </div>
              {specialRequests && (
                <div className="pt-6 border-t border-[#4b5246]">
                  <div className="text-sm text-[#c9c3b6] mb-1">Special Requests</div>
                  <div className="text-[#efece6]">{specialRequests}</div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-[#4b5246]">
                <div className="text-sm text-[#c9c3b6] mb-2">Status</div>
                <span className="inline-block px-4 py-2 bg-yellow-900/50 text-yellow-400 rounded-full text-sm">
                  Pending Admin Approval
                </span>
              </div>
            </div>
            <div className="space-y-3 mx-4 pb-8">
              <div className="p-4 bg-[#232a22] border border-[#4b5246] rounded-xl text-sm text-[#efece6] text-left">
                <p className="mb-2 font-bold">Booking submitted!</p>
                <p>Your service booking is pending admin approval. You'll receive a confirmation email once approved. Check your profile for status updates.</p>
              </div>
              <Button onClick={() => navigate('/services')} className="w-full h-12 rounded-2xl bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6] transition-all font-bold text-sm uppercase tracking-widest">
                Browse More Services
              </Button>
              <Button onClick={() => navigate('/profile')} variant="outline" className="w-full h-12 rounded-2xl text-[#efece6] border-[#4b5246]">
                View My Bookings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3f4a40] text-[#efece6] relative overflow-hidden">
      <div className="absolute inset-0 bg-[#3f4a40]" />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />
      <div className="relative max-w-6xl mx-auto px-4 py-12 lg:py-20">
        <Button variant="ghost" onClick={() => navigate('/services')} className="mb-8 text-[#efece6]">
          ← Back to Services
        </Button>
        <div className="bg-[#3a4035]/95 rounded-[2.5rem] border border-[#4b5246] shadow-2xl overflow-hidden">
          <div className="p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl lg:text-5xl mb-4 font-light">Book {service.name}</h1>
                <p className="text-[#c9c3b6] uppercase tracking-[0.25em] text-xs">{service.category} Service</p>
                <div className="h-px w-20 bg-[#5b6255] mt-6" />
              </div>
              <p className="text-[#efece6]/80 leading-relaxed text-lg font-light mb-8">{service.description}</p>
              <form onSubmit={handleBooking} className="space-y-6">
                <div className="bg-[#343a30] rounded-3xl p-8 border border-[#4b5246] shadow-xl">
                  <h2 className="text-2xl mb-6 text-[#efece6]">Reservation Details</h2>
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="date" className="text-[10px] uppercase tracking-widest text-[#9aa191]">Select Date *</Label>
                      <div className="relative mt-2">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9aa191]" />
                        <Input
                          id="date"
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="pl-10 h-12 bg-[#2a3026] border-[#4b5246] rounded-xl text-[#efece6]"
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="time" className="text-[10px] uppercase tracking-widest text-[#9aa191]">Select Time *</Label>
                      <div className="relative mt-2">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9aa191]" />
                        <select
                          id="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full pl-10 h-12 px-4 bg-[#2a3026] border-[#4b5246] rounded-xl text-[#efece6] focus:outline-none focus:ring-2 focus:ring-[#efece6]"
                          required
                        >
                          <option value="">Choose a time slot</option>
                          {service.availableTimes.map((t, index) => (
                            <option key={`time-${index}-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="guests" className="text-[10px] uppercase tracking-widest text-[#9aa191]">Number of Guests *</Label>
                      <div className="relative mt-2">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9aa191]" />
                        <Input
                          id="guests"
                          type="number"
                          min="1"
                          max="10"
                          value={guests}
                          onChange={(e) => setGuests(e.target.value)}
                          className="pl-10 h-12 bg-[#2a3026] border-[#4b5246] rounded-xl text-[#efece6]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="requests" className="text-[10px] uppercase tracking-widest text-[#9aa191]">Special Requests (Optional)</Label>
                      <textarea
                        id="requests"
                        placeholder="Any dietary restrictions, preferences, or special requests?"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="mt-2 w-full h-32 px-4 py-3 bg-[#2a3026] border-[#4b5246] rounded-xl text-[#efece6] resize-none focus:outline-none focus:ring-2 focus:ring-[#efece6]"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mt-6 mb-6">
                    <input
                      type="checkbox"
                      id="terms"
                      className="w-5 h-5 mt-1 rounded border-[#4b5246] bg-[#2a3026]"
                      required
                    />
                    <label htmlFor="terms" className="text-[#efece6]">
                      I agree to the cancellation policy. Cancellations must be made at least 24 hours in advance.
                    </label>
                  </div>
                  <div className="p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-xl text-sm text-yellow-300 mb-4">
                    <p>Your booking will be pending admin approval. You'll be notified once confirmed.</p>
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6] transition-all font-bold text-sm uppercase tracking-widest">
                    Submit for Approval
                  </Button>
                </div>
              </form>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-[#343a30] rounded-3xl p-6 border border-[#4b5246] shadow-xl sticky top-4">
                <h3 className="text-xl mb-6 text-[#efece6]">Service Details</h3>
                <div className="mb-6">
                  {resolveVideoUrl(service.video) ? (
                    <video
                      src={resolveVideoUrl(service.video)}
                      poster={resolveImageUrl(service.image) || undefined}
                      className="w-full h-48 object-cover rounded-2xl"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : resolveImageUrl(service.image) ? (
                    <img
                      src={resolveImageUrl(service.image)}
                      alt={service.name}
                      className="w-full h-48 object-cover rounded-2xl"
                      onError={(event) => {
                        const target = event.currentTarget;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-48 rounded-2xl bg-gradient-to-br from-[#343a30] to-[#4b5246]" />
                  )}
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="text-sm text-[#c9c3b6] mb-1">Service</div>
                    <div className="text-lg text-[#efece6]">{service.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#c9c3b6] mb-1">Category</div>
                    <div className="capitalize text-[#efece6]">{service.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#c9c3b6] mb-1">Price Range</div>
                    <div className="text-lg text-[#efece6]">{service.priceRange}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#c9c3b6] mb-1">Available Times</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {service.availableTimes.map((t, index) => (
                        <span key={`available-time-${index}-${t}`} className="px-3 py-1 bg-[#232a22] text-[#efece6] rounded-full text-sm">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-xl text-sm text-yellow-300">
                  <p>✓ Free cancellation up to 24 hours before reservation</p>
                  <p className="mt-2 text-xs">* Subject to admin approval</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceBooking;