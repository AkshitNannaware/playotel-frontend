import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SlidersHorizontal, Wifi, Car, Coffee, Waves, Users, Maximize2, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { Room } from '../types/room';
import Footer from '../components/Footer';

const RoomListing = () => {
  const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:5000';
  const [priceRange, setPriceRange] = useState([0, 5000]);

  const resolveImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('/uploads/')) return `${API_BASE}${imageUrl}`;
    // If it's just a filename, assume /uploads/rooms/
    if (!imageUrl.startsWith('/')) return `${API_BASE}/uploads/rooms/${imageUrl}`;
    // fallback
    return `${API_BASE}${imageUrl}`;
  };

  const resolveVideoUrl = (videoUrl?: string) => {
    if (!videoUrl) return '';
    return videoUrl.startsWith('/uploads/') ? `${API_BASE}${videoUrl}` : videoUrl;
  };
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [sortBy, setSortBy] = useState('price-low');
  const [showFilters, setShowFilters] = useState(false);
  const [roomsState, setRoomsState] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const amenityIcons: Record<string, any> = {
    'WiFi': Wifi,
    'Pool Access': Waves,
    'Parking': Car,
    'Room Service': Coffee,
  };

  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true);
      setLoadError(null);
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
          video: room.video || '',
          description: room.description || '',
          amenities: room.amenities || [],
          maxGuests: room.maxGuests || 1,
          size: room.size || 0,
          available: room.available ?? true,
          location: room.location || '',
        }));
        setRoomsState(normalized);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load rooms';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, [API_BASE]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const filteredRooms = roomsState
    .filter(room => room.price >= priceRange[0] && room.price <= priceRange[1])
    .filter(room => selectedTypes.length === 0 || selectedTypes.includes(room.type))
    .filter(room => 
      selectedAmenities.length === 0 || 
      selectedAmenities.every(amenity => room.amenities.includes(amenity))
    )
    .filter(room =>
      locationSearch.trim() === '' ||
      (room.location || '').toLowerCase().includes(locationSearch.trim().toLowerCase()) ||
      room.name.toLowerCase().includes(locationSearch.trim().toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#3f4a40] text-[#efece6]">
      <section className="relative overflow-hidden pt-13">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(88,105,90,0.35), transparent 55%), radial-gradient(circle at 85% 60%, rgba(98,120,100,0.35), transparent 60%), linear-gradient(180deg, rgba(23,30,24,0.9), rgba(23,30,24,0.55))',
          }}
        />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(180deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:100%_160px]" />

        <div className="relative max-w-7xl mx-auto px-4 pt-10 pb-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#cfc9bb]">Home &gt; Rooms</p>
              <h1
                className="text-4xl md:text-5xl text-[#efece6] mt-3"
                style={{ fontFamily: "'Great Vibes', cursive" }}
              >
                Rooms & Rates
              </h1>
              <p className="text-sm text-[#c9c3b6] mt-3 max-w-xl">
                Curated stays with handcrafted details, tailored for quiet luxury.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-[#5b6659] bg-[#2f3a32]/70 px-4 py-2 text-xs text-[#d7d2c5]">
                {filteredRooms.length} rooms available
              </span>
              <span className="rounded-full border border-[#5b6659] bg-[#2f3a32]/70 px-4 py-2 text-xs text-[#d7d2c5]">
                Flexible check-in
              </span>
            </div>
          </div>

          {showFilters && (
            <div
              className="fixed inset-0 z-20 bg-black/40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            <div className="space-y-6">
              <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full relative z-30 lg:z-auto`}>
                <div className="rounded-3xl border border-[#5b6659] bg-[#2f3a32]/95 p-6 shadow-xl lg:sticky lg:top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg text-[#efece6]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Filters
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden text-xs uppercase tracking-[0.2em] text-[#d7d2c5]"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-sm text-[#efece6] mb-3 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                      <MapPin className="w-4 h-4 text-[#cfc9bb]" />
                      Search by Location
                    </h4>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8a7a] pointer-events-none" />
                      <input
                        type="text"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder="e.g. Sea View, City View..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#4b5246] bg-[#243026] text-[#efece6] text-sm placeholder:text-[#7a8a7a] focus:outline-none focus:ring-1 focus:ring-[#7a9a7a]"
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#cfc9bb] mb-3">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000}
                      step={10}
                      className="mb-2"
                    />
                  </div>

                  <div className="mb-8">
                    <h4 className="text-sm text-[#efece6] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Room Type
                    </h4>
                    <div className="space-y-3">
                      {['Single', 'Double', 'Suite', 'Deluxe'].map(type => (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox
                            id={type}
                            checked={selectedTypes.includes(type)}
                            onCheckedChange={() => toggleType(type)}
                          />
                          <Label htmlFor={type} className="cursor-pointer text-[#cfc9bb]">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-sm text-[#efece6] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Amenities
                    </h4>
                    <div className="space-y-3">
                      {['WiFi', 'AC', 'Pool Access', 'Parking'].map(amenity => (
                        <div key={amenity} className="flex items-center gap-2">
                          <Checkbox
                            id={amenity}
                            checked={selectedAmenities.includes(amenity)}
                            onCheckedChange={() => toggleAmenity(amenity)}
                          />
                          <Label htmlFor={amenity} className="cursor-pointer text-[#cfc9bb]">
                            {amenity}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-[#4b5246] text-[#efece6] bg-[#343a30] hover:bg-white/10 placeholder:text-[#9aa191]"
                    onClick={() => {
                      setSelectedTypes([]);
                      setSelectedAmenities([]);
                      setPriceRange([0, 1000]);
                      setLocationSearch('');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden border-[#5b6659] "
                  aria-expanded={showFilters}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[220px] border-[#5b6659] bg-[#2f3a32] text-[#d7d2c5]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading && (
                <div className="mb-6 rounded-xl border border-[#5b6659] bg-[#2f3a32]/80 px-4 py-3 text-sm text-[#d7d2c5]">
                  Loading rooms...
                </div>
              )}
              {loadError && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                  {loadError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRooms.map((room) => (
                  <Link
                    key={room.id}
                    to={`/room/${room.id}`}
                    state={{ from: 'rooms' }}
                    className="group rounded-2xl border border-[#5b6659] bg-[#2f3a32]/90 overflow-hidden shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="relative h-40 overflow-hidden">
                      {resolveVideoUrl(room.video) ? (
                        <video
                          src={resolveVideoUrl(room.video)}
                          className="h-full w-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                          poster={resolveImageUrl(room.images[0] || '') || undefined}
                        />
                      ) : resolveImageUrl(room.images[0] || '') ? (
                        <img
                          src={resolveImageUrl(room.images[0] || '')}
                          alt={room.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-[#222a22]" />
                      )}
                      <div className="absolute top-3 left-3 rounded-full bg-[#1e2520]/80 px-3 py-1 text-[10px] text-[#d7d2c5] border border-[#5b6659]">
                        {room.available ? 'Available' : 'Limited'}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base text-[#efece6]" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {room.name}
                          </h3>
                          {room.location ? (
                            <p className="text-xs text-[#cfc9bb] mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {room.location}
                            </p>
                          ) : (
                          <p className="text-xs text-[#cfc9bb] mt-1">Modern cozy suite · 1 queen bed</p>
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
                              key={idx}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#5b6659] bg-[#243026] px-2.5 py-1 text-[10px] text-[#d7d2c5]"
                            >
                              <Icon className="w-3 h-3" />
                              {amenity}
                            </span>
                          );
                        })}
                      </div>

                      <div className="mt-4">
                        <Button className="w-full rounded-full border border-[#5b6659] bg-transparent text-[#efece6] hover:bg-white/10">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {filteredRooms.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🏨</div>
                  <h3 className="text-2xl mb-2 text-[#efece6]">No rooms found</h3>
                  <p className="text-[#cfc9bb] mb-6">Try adjusting your filters</p>
                  <Button
                    onClick={() => {
                      setSelectedTypes([]);
                      setSelectedAmenities([]);
                      setPriceRange([0, 1000]);
                      setLocationSearch('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
        {/* Footer placed inside main return */}
        <Footer isAdmin={false} />
    </div>
  );
};

export default RoomListing;
