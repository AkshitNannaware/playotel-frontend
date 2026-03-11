import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { Calendar, X, Users, Maximize2, Wifi, Car, Coffee, Waves, MapPin } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useBooking } from '../context/BookingContext';
import { toast } from 'sonner';
import type { Room } from '../types/room';

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentBooking } = useBooking();
  const location = useLocation();
  
  // Define API_BASE outside or memoize it to prevent re-render triggers
  const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:5000';

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00'); // Default 2 PM
  const [checkOutTime, setCheckOutTime] = useState('12:00'); // Default 12 PM
  const [guests, setGuests] = useState('1');
  const [roomCount, setRoomCount] = useState('1');

  const resolveImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    return imageUrl.startsWith('/uploads/') ? `${API_BASE}${imageUrl}` : imageUrl;
  };

  const amenityIcons: Record<string, any> = {
    'WiFi': Wifi,
    'Pool Access': Waves,
    'Parking': Car,
    'Room Service': Coffee,
  };

  // FETCH LOGIC: Optimized with dependency tracking to stop 304 loops
  useEffect(() => {
    let isMounted = true;
    
    if (!id) return;

    const loadRoom = async () => {
      // Prevent duplicate concurrent requests
      if (isLoading) return; 

      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`${API_BASE}/api/rooms/${id}`);
        if (!response.ok) throw new Error(`Room not found (${response.status})`);
        const data = await response.json();
        
        if (isMounted) {
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
            location: data.location || '',
          });
        }
      } catch (error) {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRoom();

    return () => { isMounted = false; };
  }, [id]); // Only re-run if the URL ID changes

  const calculateNights = useCallback(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  const handleBookNow = () => {
    if (!room) return;
    const nights = calculateNights();


    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    if (nights <= 0) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    toast.success('Room booking details set! Proceed to booking.');

    const rooms = parseInt(roomCount) || 1;
    const roomPrice = room.price * nights * rooms;
    const taxes = roomPrice * 0.12;
    const serviceCharges = roomPrice * 0.05;

    setCurrentBooking({
      roomId: room.id,
      checkIn: new Date(`${checkIn}T${checkInTime}`),
      checkOut: new Date(`${checkOut}T${checkOutTime}`),
      guests: parseInt(guests),
      rooms: rooms,
      totalPrice: roomPrice + taxes + serviceCharges, // Will be recalculated in Booking
      roomPrice,
      taxes,
      serviceCharges,
      checkInTime,
      checkOutTime,
    });

    navigate('/booking');
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#3f4a40]">
      <div className="animate-pulse text-[#d7d0bf] tracking-widest uppercase text-sm">Loading Experience...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#3f4a40] text-[#efece6] relative overflow-hidden">

      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[#3f4a40]"/>
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />

      <div className="relative max-w-6xl mx-auto px-4 py-12 lg:py-20">
        {room ? (
          <div className="bg-[#3a4035]/95 rounded-[2.5rem] border border-[#4b5246] shadow-2xl overflow-hidden">
            {/* Conditionally show room image only if navigated from 'rooms' (not from 'booknow') */}
            {location.state?.from === 'rooms' && (
              <div className="relative h-[40px] lg:h-[50vh]">
                <img 
                  src={resolveImageUrl(room.images[0])} 
                  alt={room.name} 
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => navigate('/rooms')}
                  className="absolute top-6 right-6 h-10 w-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/40 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h1 className="text-4xl lg:text-5xl mb-4 font-light">{room.name}</h1>
                  <p className="text-[#c9c3b6] uppercase tracking-[0.25em] text-xs">{room.type} Suite</p>
                  {room.location && (
                    <p className="flex items-center gap-1.5 text-sm text-[#c9c3b6] mt-2">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      {room.location}
                    </p>
                  )}
                  <div className="h-px w-20 bg-[#5b6255] mt-6" />
                </div>

                <p className="text-[#efece6]/80 leading-relaxed text-lg font-light">
                  {room.description || "Experience unparalleled luxury in our meticulously designed suites, featuring premium finishes and breathtaking views."}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-[#4b5246]">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#9aa191]">Size</span>
                    <p className="flex items-center gap-2 text-sm"><Maximize2 className="w-4 h-4" /> {room.size} m²</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-[#9aa191]">Check In Time</Label>
                    <Input 
                      type="time" 
                      value={checkInTime} 
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="bg-[#2a3026] border-[#4b5246] rounded-xl h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-[#9aa191]">Check Out Time</Label>
                    <Input 
                      type="time" 
                      value={checkOutTime} 
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="bg-[#2a3026] border-[#4b5246] rounded-xl h-12"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#9aa191]">Occupancy</span>
                    <p className="flex items-center gap-2 text-sm"><Users className="w-4 h-4" /> {room.maxGuests} Guests</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#9aa191]">View</span>
                    <p className="flex items-center gap-2 text-sm">City Skyline</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6] mb-6">Suite Amenities</h3>
                  <div className="flex flex-wrap gap-3">
                    {room.amenities.map((amenity, idx) => {
                      const Icon = amenityIcons[amenity] || Coffee;
                      return (
                        <div key={idx} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#343a30] border border-[#4b5246] text-sm">
                          <Icon className="w-4 h-4 text-[#d7d0bf]" />
                          {amenity}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Booking Sidebar */}
              <div className="space-y-6">
                <div className="bg-[#343a30] rounded-3xl p-8 border border-[#4b5246] shadow-xl">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6] mb-8">Reserve Stay</h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-[#9aa191]">Check In</Label>
                      <Input 
                        type="date" 
                        value={checkIn} 
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="bg-[#2a3026] border-[#4b5246] rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-[#9aa191]">Check Out</Label>
                      <Input 
                        type="date" 
                        value={checkOut} 
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="bg-[#2a3026] border-[#4b5246] rounded-xl h-12"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#4b5246] space-y-3 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9aa191]">Rate per night</span>
                      <span>₹{room.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-medium text-[#d7d0bf]">
                      <span>Total for {calculateNights()} nights</span>
                      <span>₹{(room.price * calculateNights()).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleBookNow}
                    disabled={!room.available}
                    className="w-full h-14 rounded-2xl bg-[#d7d0bf] text-[#1f241f] hover:bg-[#efece6] transition-all font-bold text-sm uppercase tracking-widest"
                  >
                    {room.available ? 'Book this Room' : 'Sold Out'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl mb-4">Room Unavailable</h2>
            <Button onClick={() => navigate('/rooms')} variant="outline">Browse Others</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDetails;