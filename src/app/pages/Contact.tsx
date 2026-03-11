import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, BedDouble, Utensils, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

type Room = {
  _id: string;
  name: string;
  type: string;
  price: number;
  image: string;
};

type Service = {
  _id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  priceRange: string;
};

const Contact = () => {
  const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:5000';
  const [isSending, setIsSending] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    const fetchRoomsAndServices = async () => {
      try {
        const [roomsRes, servicesRes] = await Promise.all([
          fetch(`${API_BASE}/api/rooms`),
          fetch(`${API_BASE}/api/services`)
        ]);
        if (roomsRes.ok) setRooms((await roomsRes.json()).slice(0, 3));
        if (servicesRes.ok) setServices((await servicesRes.json()).slice(0, 3));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchRoomsAndServices();
  }, [API_BASE]);

  const resolveImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return imageUrl.startsWith('/uploads/') ? `${API_BASE}${imageUrl}` : `${API_BASE}/${imageUrl}`;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = event.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to send message');
      toast.success('Message sent! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Unable to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3f4a40] text-[#efece6] relative overflow-hidden pt-10 md:pt-0">
      {/* Background Gradients */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(88,105,90,0.35), transparent 55%), radial-gradient(circle at 85% 60%, rgba(98,120,100,0.35), transparent 60%), linear-gradient(180deg, rgba(23,30,24,0.9), rgba(23,30,24,0.55))',
        }}
      />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:220px_100%]" />
      <div className="absolute inset-0 opacity-25 bg-[linear-gradient(180deg,rgba(235,230,220,0.08)_1px,transparent_1px)] bg-[size:100%_160px]" />

      <div className="relative max-w-6xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl mb-4 tracking-tight" style={{ fontFamily: "'Great Vibes', cursive" }}>Contact Us</h1>
          <div className="h-px w-24 bg-[#5b6255] mb-4" />
          <p className="text-[#c9c3b6] uppercase tracking-[0.2em] text-xs">
            Reach out to our concierge for any assistance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form Card */}
          <div className="lg:col-span-2 bg-[#2f3a32]/90 border border-[#5b6659] rounded-[2rem] p-8 lg:p-10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="h-11 rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6] placeholder:text-[#9aa191]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-11 rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6]"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-11 rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="h-11 rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs uppercase tracking-[0.2em] text-[#c9c3b6]">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="min-h-[160px] rounded-xl bg-[#343a30] border-[#4b5246] text-[#efece6] resize-none"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl bg-[#d7d0bf] text-[#1f241f] hover:bg-[#e5ddca] transition-colors" disabled={isSending}>
                <Send className="w-4 h-4 mr-2" />
                {isSending ? 'Sending Request...' : 'Send Message'}
              </Button>
            </form>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            {[
              { icon: Phone, title: 'Call Us', content: '+1 555 010 234' },
              { icon: Mail, title: 'Email', content: 'support@grandluxe.com' },
              { icon: MapPin, title: 'Visit Us', content: '123 Luxe Avenue, New York, NY' }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#2f3a32]/90 border border-[#5b6659] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <item.icon className="w-5 h-5 text-[#d7d0bf]" />
                  <h2 className="text-sm uppercase tracking-[0.2em] text-[#c9c3b6]">{item.title}</h2>
                </div>
                <p className="text-[#efece6] font-medium">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;