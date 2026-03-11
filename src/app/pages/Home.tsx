import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Search, Calendar, Users, MapPin, Star, ChevronLeft, ChevronRight, Menu, ArrowDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Footer from '../components/Footer';
import { toast } from 'sonner';
import type { Room } from '../types/room';

const ctaImage = '/0c0b1b9fcebeedd073f75517ee322f51.jpg';

const Home = () => {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [rooms, setRooms] = useState('1');
  const [showHomeAboutMore, setShowHomeAboutMore] = useState(false);
  const discoverRef = useRef<HTMLDivElement | null>(null);
  const [accommodationIndex, setAccommodationIndex] = useState(0);
  const [roomsState, setRoomsState] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [servicesState, setServicesState] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const heroImage = '/15101348_3840_2160_60fps.mp4';
  const fallbackRoomImage = 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400';
  const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:5000';

  useEffect(() => {
    const loadRooms = async () => {
      setRoomsLoading(true);
      setRoomsError(null);
      try {
        const response = await fetch(`${API_BASE}/api/rooms`);
        if (!response.ok) {
          throw new Error(`Failed to load rooms (${response.status})`);
        }
        const data = await response.json();
        const normalized = (data as any[]).map((room) => ({
          id: room._id || room.id,
          name: room.name,
          type: room.type,
          price: room.price,
          images: room.images || [],
          description: room.description || '',
          amenities: room.amenities || [],
          maxGuests: room.maxGuests || 1,
          size: room.size || 0,
          available: room.available ?? true,
        }));
        setRoomsState(normalized);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load rooms';
        setRoomsError(message);
      } finally {
        setRoomsLoading(false);
      }
    };

    loadRooms();
  }, [API_BASE]);

  useEffect(() => {
    const loadServices = async () => {
      setServicesLoading(true);
      setServicesError(null);
      try {
        const response = await fetch(`${API_BASE}/api/services`);
        if (!response.ok) {
          throw new Error(`Failed to load services (${response.status})`);
        }
        const data = await response.json();
        const normalized = (Array.isArray(data) ? data : []).map((service) => ({
          ...service,
          category: String(service.category || '').toLowerCase(),
        }));
        setServicesState(normalized);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load services';
        setServicesError(message);
      } finally {
        setServicesLoading(false);
      }
    };

    loadServices();
  }, [API_BASE]);

  useEffect(() => {
    if (roomsState.length === 0) {
      setAccommodationIndex(0);
      return;
    }
    if (accommodationIndex >= roomsState.length) {
      setAccommodationIndex(0);
    }
  }, [accommodationIndex, roomsState.length]);

  const accommodationsCount = roomsState.length;
  const activeAccommodation = accommodationsCount ? roomsState[accommodationIndex] : null;
  const prevAccommodation = accommodationsCount
    ? roomsState[(accommodationIndex - 1 + accommodationsCount) % accommodationsCount]
    : null;
  const nextAccommodation = accommodationsCount
    ? roomsState[(accommodationIndex + 1) % accommodationsCount]
    : null;

  const resolveRoomImage = (room: Room | null) => {
    const imageUrl = room?.images?.[0] || fallbackRoomImage;
    if (!imageUrl) return fallbackRoomImage;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('/uploads/')) return `${API_BASE}${imageUrl}`;
    if (!imageUrl.startsWith('/')) return `${API_BASE}/uploads/rooms/${imageUrl}`;
    return `${API_BASE}${imageUrl}`;
  };
  const resolveRoomVideo = (room: Room | null) => {
    const videoUrl = room?.video || '';
    if (!videoUrl) return '';
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) return videoUrl;
    if (videoUrl.startsWith('/uploads/')) return `${API_BASE}${videoUrl}`;
    if (videoUrl.startsWith('uploads/')) return `${API_BASE}/${videoUrl}`;
    if (videoUrl.startsWith('/')) return `${API_BASE}${videoUrl}`;
    return `${API_BASE}/${videoUrl}`;
  };
  const resolveServiceImage = (service: any) => {
    const imageUrl = String(service?.image || '').trim();
    if (!imageUrl) {
      return 'https://images.unsplash.com/photo-1516455207990-7a41e1d4ffd5?w=600&h=400&fit=crop';
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/uploads/')) {
      return `${API_BASE}${imageUrl}`;
    }
    if (imageUrl.startsWith('uploads/')) {
      return `${API_BASE}/${imageUrl}`;
    }
    if (imageUrl.startsWith('/')) {
      return `${API_BASE}${imageUrl}`;
    }
    return `${API_BASE}/${imageUrl}`;
  };
  const resolveServiceVideo = (service: any) => {
    const videoUrl = String(service?.video || '').trim();
    if (!videoUrl) return '';
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) return videoUrl;
    if (videoUrl.startsWith('/uploads/')) return `${API_BASE}${videoUrl}`;
    if (videoUrl.startsWith('uploads/')) return `${API_BASE}/${videoUrl}`;
    if (videoUrl.startsWith('/')) return `${API_BASE}${videoUrl}`;
    return `${API_BASE}/${videoUrl}`;
  };
  const resolveRoomMeta = (room: Room | null) => {
    if (!room) {
      return 'Signature stay | Curated comfort | Luxury details | 1 bathroom';
    }
    const sizeLabel = room.size ? `${room.size} m2` : 'Signature stay';
    const typeLabel = room.type ? `${room.type} room` : 'Curated comfort';
    const guestLabel = `${room.maxGuests || 1} guests`;
    return `${sizeLabel} | ${typeLabel} | ${guestLabel} | 1 bathroom`;
  };

  const getServicesByCategory = (category: string) => {
    return servicesState
      .filter((service) => service.category === category)
      .slice(0, 2);
  };

  const categoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      spa: 'Spa & Wellness',
      bar: 'Bar & Lounge',
      restaurant: 'Restaurant',
      dining: 'In-room Dining',
    };
    return labels[category] || category;
  };

  const categoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      spa: '🧖',
      bar: '🍹',
      restaurant: '🍽️',
      dining: '🍴',
    };
    return emojis[category] || '✨';
  };

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);
    try {
      const response = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || 'Failed to subscribe. Please try again.';
        throw new Error(message);
      }

      toast.success('Successfully subscribed to our newsletter!');
      setNewsletterEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to subscribe. Please try again.';
      toast.error(message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set('search', destination);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    if (rooms) params.set('rooms', rooms);
    
    const queryString = params.toString();
    window.location.href = `/rooms${queryString ? `?${queryString}` : ''}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

	return (
		<div className="min-h-screen bg-[#3f4a40]">
			{/* Hero Section */}
			<section className="relative min-h-[100svh] sm:min-h-screen bg-stone-900">
				<video
					src={heroImage}
					autoPlay
					loop
					muted
					playsInline
					className="absolute inset-0 h-full w-full object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-[#203126]/85" />

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[100svh] sm:min-h-screen flex flex-col justify-end md:justify-center items-center pt-15">
					<div className="text-center mb-auto mt-24 sm:mt-36 md:mt-52 px-3">
						<h2 className="text-3xl md:text-5xl lg:text-7xl text-white italic tracking-wide whitespace-nowrap pb-10 " style={{ fontFamily: "'Great Vibes', cursive" }}>
							Experience Nature in Luxury
						</h2>
					</div>

					<div className="w-full max-w-4xl mb-4 md:mb-24 pb-30">
						<div className="hidden md:block bg-stone-900/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8 shadow-2xl">
							<div className="hidden md:flex items-end gap-4">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<Calendar className="w-4 h-4 text-white/60" />
										<label className="text-xs uppercase tracking-widest text-white/80">Check In</label>
									</div>
									<Input
										type="date"
										value={checkIn}
										onChange={(e) => setCheckIn(e.target.value)}
										onKeyDown={handleKeyDown}
										className="bg-white/10 border-white/30 text-white placeholder:text-white/50 h-12 rounded-lg"
									/>
								</div>

								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<Calendar className="w-4 h-4 text-white/60" />
										<label className="text-xs uppercase tracking-widest text-white/80">Check Out</label>
									</div>
									<Input
										type="date"
										value={checkOut}
										onChange={(e) => setCheckOut(e.target.value)}
										onKeyDown={handleKeyDown}
										className="bg-white/10 border-white/30 text-white placeholder:text-white/50 h-12 rounded-lg"
									/>
								</div>

								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<Users className="w-4 h-4 text-white/60" />
										<label className="text-xs uppercase tracking-widest text-white/80">Guest</label>
									</div>
									<Input
										type="number"
										min="1"
										value={guests}
										onChange={(e) => setGuests(e.target.value)}
										onKeyDown={handleKeyDown}
										placeholder="guests"
										className="bg-white/10 border-white/30 text-white placeholder:text-white/50 h-12 rounded-lg"
									/>
								</div>

								<div className="flex-1">
									<Button
										onClick={handleSearch}
										className="w-full h-12 bg-amber-600/80 hover:bg-amber-600 text-white font-medium uppercase tracking-wider rounded-lg shadow-lg"
									>
										Check Availability
									</Button>
								</div>
							</div>
						</div>

						<div className="md:hidden rounded-[20px] border border-white/20 bg-[#2f3f34]/90 p-2 backdrop-blur-md shadow-2xl w-[90vw] max-w-xs mx-auto">
							<div className="rounded-full border border-white/25 bg-[#243227]/70 px-2 py-2">
								<div className="grid grid-cols-2 gap-0">
									<div className="pr-2 border-r border-white/20">
										<div className="flex items-center gap-1 mb-1 text-white/90">
											<Calendar className="h-3 w-3" />
											<span className="text-[10px] uppercase tracking-[0.2em]">Check In</span>
										</div>
										<Input
											type="date"
											value={checkIn}
											onChange={(e) => setCheckIn(e.target.value)}
											onKeyDown={handleKeyDown}
											className="h-5 border-0 bg-transparent p-0 text-[11px] text-[#e9ecdf] focus-visible:ring-0"
										/>
									</div>
									<div className="pl-2">
										<div className="flex items-center gap-1 mb-1 text-white/90">
											<Calendar className="h-3 w-3" />
											<span className="text-[10px] uppercase tracking-[0.2em]">Check Out</span>
										</div>
										<Input
											type="date"
											value={checkOut}
											onChange={(e) => setCheckOut(e.target.value)}
											onKeyDown={handleKeyDown}
											className="h-5 border-0 bg-transparent p-0 text-[11px] text-[#e9ecdf] focus-visible:ring-0"
										/>
									</div>
								</div>
							</div>

							<div className="mt-2 rounded-full border border-white/25 bg-[#243227]/70 px-2 py-2 flex items-center">
								<div className="flex items-center gap-1 text-white/90">
									<Users className="h-3 w-3" />
									<span className="text-[10px] uppercase tracking-[0.2em]">Guest</span>
								</div>
								<div className="mx-2 h-6 w-px bg-white/20" />
								<Input
									type="number"
									min="1"
									value={guests}
									onChange={(e) => setGuests(e.target.value)}
									onKeyDown={handleKeyDown}
									className="h-5 border-0 bg-transparent p-0 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[#e9ecdf] focus-visible:ring-0"
								/>
							</div>

							<Button
								onClick={handleSearch}
								className="mt-3 h-9 w-full rounded-full bg-[#b8bca8] text-stone-800 hover:bg-[#c6cab8] uppercase tracking-[0.14em] text-[10px]"
							>
								Check Availability
							</Button>

							<div className="mt-4 text-center text-[#c8cfbf]/40 text-[20px] leading-none" style={{ fontFamily: "'Great Vibes', cursive" }}>
								Wellness &nbsp; Earth &nbsp; Sustainable
							</div>

							<div className="mt-5 flex items-center justify-center gap-2 text-white/80">
								<div className="h-px flex-1 bg-white/70" />
								<ArrowDown className="h-6 w-6" />
								<div className="h-px flex-1 bg-white/70" />
							</div>
						</div>
					</div>
				</div>
			</section>

      {/* Your Services */}
      <section id="discover" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
  {/* Header Section */}
  <div className="mb-20 grid grid-cols-1 lg:grid-cols-[1fr_1fr] items-start gap-8">
    <div className="relative">
      <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#efece6] leading-[1.1] tracking-tight" style={{ fontFamily: "'Great Vibes', cursive" }}>
        At Your <br /> Services
      </h2>
    </div>
    <div className="flex flex-col items-start lg:items-end text-left lg:text-right pt-4">
       <div className="flex items-center gap-2 mb-4">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <p className="text-xs uppercase tracking-[0.3em] font-semibold text-[#efece6]">Exclusive Offers</p>
       </div>
       <p className="text-[#efece6] leading-relaxed text-base md:text-lg max-w-sm">
        Experience our curated packages designed for your perfect stay
      </p>
    </div>
  </div>

  {servicesLoading && (
    <div className="mb-6 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#efece6]">
      Loading services...
    </div>
  )}
  {servicesError && (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#efece6]">
      {servicesError}
    </div>
  )}

  {servicesState.length === 0 && !servicesLoading ? (
    <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-[#efece6]">
      No services are available yet. Please check back soon.
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {servicesState.slice(0, 4).map((service, index) => (
        <div key={index} className="flex flex-col h-full">
          {/* Arched Container */}
          <div className="relative mb-4">
            <div className="w-full aspect-[3/4] rounded-[200px] rounded-b-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
              {resolveServiceVideo(service) ? (
                <video
                  src={resolveServiceVideo(service)}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={resolveServiceImage(service) || undefined}
                />
              ) : (
                <img 
                  src={resolveServiceImage(service)} 
                  alt={service.name} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col items-center text-center">
            <h3 className="text-lg font-serif text-[#efece6] mb-1">{service.name}</h3>
            <p className="text-xs text-[#c9c3b6] font-medium uppercase tracking-wider mb-3">{service.category || 'Premium Service'}</p>
            
            {/* Book Now Button */}
            <Link to="/services" className="mt-auto">
              <Button className="rounded-lg px-5 h-9 text-xs font-semibold uppercase tracking-wide bg-stone-900 text-white hover:bg-stone-800 transition-colors">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )}

  <div className="mt-16 text-center">
    <p className="text-[#efece6] max-w-3xl mx-auto leading-relaxed text-base md:text-lg mb-8">
      Discover our exclusive packages combining luxurious accommodations with premium services, crafted to provide the perfect sanctuary for every guest
    </p>
    <Link to="/services">
      <Button className="rounded-full px-10 h-12 text-xs tracking-[0.2em] uppercase bg-amber-500 text-white hover:bg-amber-400 transition-colors">
        View All Services
      </Button>
    </Link>
  </div>
</section>

      {/* Accommodations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 text-xs tracking-[0.35em] uppercase text-[#efece6]">
            <span className="h-px w-10 bg-stone-300" />
            Discover our best offers
            <span className="h-px w-10 bg-stone-300" />
          </div>
          <h2 className="mt-3 text-3xl md:text-5xl font-serif text-[#efece6]" style={{ fontFamily: "'Great Vibes', cursive" }}>
            Our accommodations
          </h2>
        </div>

        {roomsLoading && (
          <div className="mb-6 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#efece6]">
            Loading rooms...
          </div>
        )}
        {roomsError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#efece6]">
            {roomsError}
          </div>
        )}

        {roomsState.length === 0 && !roomsLoading ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-[#efece6]">
            No rooms are available yet. Please check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-6 items-center">
            <div className="hidden lg:block">
              <div className="relative rounded-[24px] overflow-hidden shadow-lg">
              {resolveRoomVideo(prevAccommodation) ? (
                <video
                  src={resolveRoomVideo(prevAccommodation)}
                  className="h-[220px] sm:h-[300px] md:h-[360px] w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={resolveRoomImage(prevAccommodation) || undefined}
                />
              ) : (
                <img
                  src={resolveRoomImage(prevAccommodation)}
                  alt={prevAccommodation?.name || 'Previous room'}
                  className="h-[220px] sm:h-[300px] md:h-[360px] w-full object-cover"
                />
              )}
                <div className="absolute inset-0 bg-black/35" />
              </div>
            </div>

            <div className="relative rounded-[28px] overflow-hidden shadow-2xl">
              {resolveRoomVideo(activeAccommodation) ? (
                <video
                  src={resolveRoomVideo(activeAccommodation)}
                  className="h-[260px] sm:h-[340px] md:h-[420px] w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={resolveRoomImage(activeAccommodation) || undefined}
                />
              ) : (
                <img
                  src={resolveRoomImage(activeAccommodation)}
                  alt={activeAccommodation?.name || 'Featured room'}
                  className="h-[260px] sm:h-[340px] md:h-[420px] w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              <button
                type="button"
                onClick={() =>
                  setAccommodationIndex((prevIndex) => (prevIndex - 1 + accommodationsCount) % accommodationsCount)
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="Previous accommodation"
              >
                <ChevronLeft className="h-5 w-5 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setAccommodationIndex((prevIndex) => (prevIndex + 1) % accommodationsCount)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="Next accommodation"
              >
                <ChevronRight className="h-5 w-5 mx-auto" />
              </button>
              <div className="absolute bottom-6 left-1/2 w-[92%] sm:w-[86%] -translate-x-1/2 text-center text-white">
                <div className="text-xs tracking-[0.35em] uppercase text-amber-200">
                  ${activeAccommodation?.price ?? 0} / day
                </div>
                <div className="mt-2 text-2xl font-serif">
                  {activeAccommodation?.name || 'Signature Stay'}
                </div>
                <div className="mt-3 text-xs text-stone-200">
                  {resolveRoomMeta(activeAccommodation)}
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative rounded-[24px] overflow-hidden shadow-lg">
              {resolveRoomVideo(nextAccommodation) ? (
                <video
                  src={resolveRoomVideo(nextAccommodation)}
                  className="h-[220px] sm:h-[300px] md:h-[360px] w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={resolveRoomImage(nextAccommodation) || undefined}
                />
              ) : (
                <img
                  src={resolveRoomImage(nextAccommodation)}
                  alt={nextAccommodation?.name || 'Next room'}
                  className="h-[220px] sm:h-[300px] md:h-[360px] w-full object-cover"
                />
              )}
                <div className="absolute inset-0 bg-black/35" />
              </div>
            </div>
          </div>
        )}

        {roomsState.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            {roomsState.map((_, index) => (
              <button
                key={`accommodation-dot-${index}`}
                type="button"
                onClick={() => setAccommodationIndex(index)}
                className={`h-1 rounded-full transition-all ${
                  index === accommodationIndex ? 'w-6 bg-amber-400' : 'w-4 bg-stone-300'
                }`}
                aria-label={`Go to accommodation ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-[#efece6] max-w-2xl mx-auto leading-relaxed text-base md:text-lg">
            Browse signature offers for every occasion, from family-friendly packages to romantic getaways.
            Book direct for our best price guarantee, plus complimentary services and experiences.
          </p>
          <Link to="/rooms" state={{ from: 'home' }}>
          <Button className="mt-6 rounded-full px-8 h-12 text-xs tracking-[0.2em] uppercase bg-amber-500 text-stone-900 hover:bg-amber-400">
            Explore our Rooms...
          </Button>
          </Link>
        </div>
      </section>
      

      {/* Restaurant */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 text-xs tracking-[0.35em] uppercase text-[#efece6]">
            <span className="h-px w-10 bg-stone-300" />
            Culinary excellence awaits
            <span className="h-px w-10 bg-stone-300" />
          </div>
          <h2 className="mt-3 text-3xl md:text-5xl font-serif text-[#efece6]" style={{ fontFamily: "'Great Vibes', cursive" }}>
            Restaurant
          </h2>
        </div>

        {servicesLoading && (
          <div className="mb-6 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#efece6]">
            Loading restaurants...
          </div>
        )}
        {servicesError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#efece6]">
            {servicesError}
          </div>
        )}

        {(() => {
          const restaurantServices = servicesState.filter((service) => service.category === 'restaurant' || service.category === 'dining');
          
          if (restaurantServices.length === 0 && !servicesLoading) {
            return (
              <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-[#efece6]">
                No restaurants are available yet. Please check back soon.
              </div>
            );
          }

          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {restaurantServices.map((restaurant, idx) => (
                  <div key={restaurant._id || restaurant.id || idx} className="group relative">
                    <div className="relative rounded-[24px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                      {resolveServiceVideo(restaurant) ? (
                        <video
                          src={resolveServiceVideo(restaurant)}
                          className="h-[260px] sm:h-[320px] md:h-[380px] w-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                          autoPlay
                          muted
                          loop
                          playsInline
                          poster={resolveServiceImage(restaurant) || undefined}
                        />
                      ) : (
                        <img
                          src={resolveServiceImage(restaurant)}
                          alt={restaurant.name}
                          className="h-[260px] sm:h-[320px] md:h-[380px] w-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      
                      {/* Badge */}
                      <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-serif text-xl shadow-lg">
                        {idx + 1}
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-6 left-6 right-6 text-white">
                        <div className="text-[10px] tracking-[0.3em] uppercase text-amber-200 mb-2">
                          {idx === 0 ? 'Signature' : idx === 1 ? 'Premium' : 'Exclusive'}
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif mb-2">
                          {restaurant.name}
                        </h3>
                        {restaurant.description && (
                          <p className="text-xs text-stone-300 mb-2 line-clamp-2">
                            {restaurant.description}
                          </p>
                        )}
                        <Link
                          to="/services#services-restaurant"
                          className="text-xs text-stone-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          Explore menu →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-[#efece6] max-w-2xl mx-auto leading-relaxed text-base md:text-lg">
                  Experience culinary artistry where every dish tells a story, blending tradition with innovation in an atmosphere of refined elegance.
                </p>
                <Link to="/services">
                  <Button className="mt-6 rounded-full px-8 h-12 text-xs tracking-[0.2em] uppercase bg-amber-500 text-stone-900 hover:bg-amber-400">
                    Explore our Restaurants...
                  </Button>
                </Link>
              </div>
            </>
          );
        })()}
      </section>

      {/* About Section */}
      <section className="relative max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <div className="rounded-[24px] bg-[#4a5449]/40 backdrop-blur-sm border border-[#5b6255] p-8 md:p-10 text-center">
          <p className="text-xs tracking-[0.35em] uppercase text-[#c9a35d]" >About</p>
          <h3 className="mt-4 text-2xl md:text-3xl lg:text-4xl font-serif text-[#efece6] max-w-2xl mx-auto" style={{ fontFamily: "'Great Vibes', cursive" }}>
               Discover the story behind our hospitality
          </h3>
           <p className="mt-4 text-[#c9c3b6] max-w-xl mx-auto text-base md:text-lg leading-relaxed">
               From curated stays to signature service, learn what makes our experience timeless.
          </p>
          <Link to="/about" className="inline-block mt-8">
          <button className="rounded-full px-8 h-12 text-xs tracking-[0.2em] uppercase bg-[#c9a35d] text-[#2a3429] hover:bg-[#b8934d] transition-colors duration-300 font-medium">
           Visit About Page
          </button>
          </Link>
       </div>
      </section>      

      {/* CTA Section */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[36px] text-white px-8 py-14 md:px-14">
            <img
              src={ctaImage}
              alt="Scenic retreat"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/10" />
            <div className="relative max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-serif leading-tight" style={{ fontFamily: "'Great Vibes', cursive" }}>
                Discover a new unique
                <br />
                living experience
              </h2>
              <p className="mt-4 text-stone-200 max-w-lg text-base md:text-lg">
                Take a step into the extraordinary by immersing yourself in a unique life
                experience. Your home away from everyone is waiting for you.
              </p>
              <Link to="/rooms" className="inline-flex">
                <Button className="mt-6 rounded-full px-8 h-11 text-xs tracking-[0.25em] uppercase bg-white text-stone-900 hover:bg-stone-100">
                  Discover
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[24px] bg-[#4a5449]/40 backdrop-blur-sm border border-[#5b6255] p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs tracking-[0.35em] uppercase text-[#c9a35d]">Newsletter</p>
                <h2 className="mt-4 text-3xl md:text-4xl font-serif text-[#efece6]" style={{ fontFamily: "'Great Vibes', cursive" }}>Stay up to date</h2>
                <p className="mt-4 text-[#c9c3b6] text-base md:text-lg">
                  Subscribe to our newsletter to get the latest updates on special offers and destinations.
                </p>
              </div>
              
              <div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    type="email" 
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNewsletterSubscribe()}
                    className="h-14 bg-[#f7f3eb] border-[#d6c2a1] text-[#2a3429] placeholder:text-[#8a8276] w-full sm:flex-1"
                    disabled={isSubscribing}
                  />
                  <Button 
                    className="h-14 px-8 rounded-xl w-full sm:w-auto bg-[#c9a35d] text-[#2a3429] hover:bg-[#b8934d]" 
                    onClick={handleNewsletterSubscribe}
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
			<Footer isAdmin={false} />
		</div>
	);
};
export default Home;