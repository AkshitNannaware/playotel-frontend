import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router';
import { Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import Footer from '../components/Footer';

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

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000';

  const categories = {
    restaurant: 'Bite Book (Restaurant)',
    dining: 'Room Service (In-room dining)',
    spa: 'Spa & Wellness',
    bar: 'Bar & Lounge',
  };

  // Refs for each category section
  const categoryRefs = {
    dining: useRef<HTMLDivElement>(null),
    restaurant: useRef<HTMLDivElement>(null),
    spa: useRef<HTMLDivElement>(null),
    bar: useRef<HTMLDivElement>(null),
  };

  // Map display name to internal key
  const displayNameToKey = {
    'Bite Book (Restaurant)': 'restaurant',
    'Room Service (In-room dining)': 'dining',
    'Spa & Wellness': 'spa',
    'Bar & Lounge': 'bar',
  } as const;

  const handleCategoryClick = (displayName: string) => {
    const key = displayNameToKey[displayName];
    const ref = categoryRefs[key];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`${API_BASE}/api/services`);
        if (!response.ok) {
          throw new Error(`Failed to load services (${response.status})`);
        }
        const data = (await response.json()) as any[];
        // Map backend category to internal key
        const categoryMap: Record<string, 'dining' | 'restaurant' | 'spa' | 'bar'> = {
          'in-room dining': 'dining',
          'bite book': 'restaurant',
          'spa&wellness': 'spa',
          'bar&lounge': 'bar',
        };
        const normalized = data.map((service) => {
          // Normalize category to internal key
          let rawCat = String(service.category || '').trim().toLowerCase();
          // Remove spaces and special chars for matching
          rawCat = rawCat.replace(/\s|&/g, '');
          let key: 'dining' | 'restaurant' | 'spa' | 'bar' = 'dining';
          if (rawCat === 'restaurant' || rawCat.includes('restaurant')) key = 'restaurant';
          else if (rawCat.includes('bitebook')) key = 'restaurant';
          else if (rawCat.includes('dining')) key = 'dining';
          else if (rawCat.includes('spa')) key = 'spa';
          else if (rawCat.includes('bar')) key = 'bar';
          return {
            id: service._id || service.id,
            name: service.name,
            category: key,
            description: service.description || '',
            image: service.image || '',
            video: service.video || '',
            priceRange: service.priceRange || '',
            availableTimes: service.availableTimes || [],
          };
        });
        setServices(normalized);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load services';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [API_BASE]);

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
              <p className="text-xs uppercase tracking-[0.3em] text-[#cfc9bb]">Home &gt; Services</p>
              <h1
                className="text-4xl md:text-5xl text-[#efece6] mt-3"
                style={{ fontFamily: "'Great Vibes', cursive" }}
              >
                Hotel Services
              </h1>
              <p className="text-sm text-[#cfc9bb] mt-3 max-w-xl">
                Simple comforts, crafted for a remarkable stay. Reserve instantly and move at your pace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.values(categories).map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-full border border-[#5b6659] bg-[#2f3a32]/70 px-4 py-2 text-xs text-[#d7d2c5] hover:bg-[#3a463a] focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
                  onClick={() => handleCategoryClick(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#5b6659] bg-[#2f3a32]/95 p-6 shadow-xl lg:sticky lg:top-6">
                <h3 className="text-lg text-[#efece6] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Service Overview
                </h3>
                <div className="rounded-2xl border border-[#5b6659] bg-[#263027] p-4 mb-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#cfc9bb]">Categories</div>
                  <div className="text-3xl text-[#efece6] mt-2">{Object.keys(categories).length}</div>
                </div>
                <div className="rounded-2xl border border-[#5b6659] bg-[#263027] p-4 mb-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#cfc9bb]">Total Services</div>
                  <div className="text-3xl text-[#efece6] mt-2">{services.length}</div>
                </div>
                <p className="text-sm text-[#cfc9bb]">
                  Open daily. Manage reservations from your profile at any time.
                </p>
              </div>
            </div>

            <div className="flex-1">
              {isLoading && (
                <div className="rounded-xl border border-[#5b6659] bg-[#2f3a32]/80 px-4 py-3 text-sm text-[#d7d2c5]">
                  Loading services...
                </div>
              )}
              {loadError && (
                <div className="rounded-xl border border-red-200 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                  {loadError}
                </div>
              )}
              {!isLoading && !loadError && services.length === 0 && (
                <div className="rounded-xl border border-[#5b6659] bg-[#2f3a32]/80 px-4 py-6 text-center text-[#d7d2c5]">
                  No services are available yet.
                </div>
              )}

              {!isLoading && !loadError && services.length > 0 &&
                Object.entries(categories).map(([category, title]) => {
                  const categoryServices = services.filter((service) => service.category === category);
                  return (
                    <div
                      key={category}
                      id={`services-${category}`}
                      ref={categoryRefs[category as keyof typeof categories]}
                      className="mb-14 scroll-mt-24"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
                        <div className="rounded-3xl border border-[#5b6659] bg-[#2f3a32]/90 p-5">
                          <p className="text-xs uppercase tracking-[0.2em] text-[#cfc9bb]">
                            {title}
                          </p>
                          <h2 className="text-2xl text-[#efece6] mt-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {categoryServices.length} option{categoryServices.length > 1 ? 's' : ''}
                          </h2>
                          <p className="text-sm text-[#cfc9bb] mt-2">
                            Curated experiences designed to fit your schedule.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {categoryServices.map((service) => {
                            const imageUrl = resolveImageUrl(service.image);
                            const videoUrl = resolveVideoUrl(service.video);
                            return (
                              <div
                                key={service.id}
                                className="group rounded-2xl border border-[#5b6659] bg-[#2f3a32]/90 p-4 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
                              >
                                {videoUrl ? (
                                  <div className="relative h-40 overflow-hidden rounded-xl">
                                    <video
                                      src={videoUrl}
                                      className="h-full w-full object-cover"
                                      poster={imageUrl || undefined}
                                      autoPlay
                                      muted
                                      loop
                                      playsInline
                                    />
                                    <div className="absolute bottom-3 left-3 rounded-full border border-[#5b6659] bg-[#1e2520]/80 px-3 py-1 text-[10px] text-[#d7d2c5]">
                                      {service.priceRange || 'Pricing varies'}
                                    </div>
                                  </div>
                                ) : imageUrl ? (
                                  <div className="relative h-40 overflow-hidden rounded-xl">
                                    <img
                                      src={imageUrl}
                                      alt={service.name}
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      onError={(event) => {
                                        const target = event.currentTarget;
                                        target.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute bottom-3 left-3 rounded-full border border-[#5b6659] bg-[#1e2520]/80 px-3 py-1 text-[10px] text-[#d7d2c5]">
                                      {service.priceRange || 'Pricing varies'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-40 rounded-xl bg-[#222a22]" />
                                )}

                                <div className="mt-4">
                                  <h3 className="text-base text-[#efece6]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {service.name}
                                  </h3>
                                  <p className="text-xs text-[#cfc9bb] mt-2 line-clamp-3">
                                    {service.description || 'A tailored service experience for your stay.'}
                                  </p>
                                </div>

                                <div className="mt-4">
                                  <div className="flex items-center gap-2 text-[11px] text-[#cfc9bb]">
                                    <Clock className="w-4 h-4" />
                                    <span>Available</span>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {service.availableTimes.length > 0 ? (
                                      service.availableTimes.map((time, idx) => (
                                        <span
                                          key={idx}
                                          className="rounded-full border border-[#5b6659] bg-[#243026] px-3 py-1 text-[10px] text-[#d7d2c5]"
                                        >
                                          {time}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="rounded-full border border-[#5b6659] bg-[#243026] px-3 py-1 text-[10px] text-[#d7d2c5]">
                                        Daily
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <Link to={`/book-service/${service.id}`}>
                                  <Button className="mt-4 w-full rounded-full border border-[#5b6659] bg-transparent text-[#efece6] hover:bg-white/10">
                                    Book Now
                                  </Button>
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </section>
        {/* Footer placed inside main return */}
        <Footer isAdmin={false} />
    </div>
  );
};

export default Services;
