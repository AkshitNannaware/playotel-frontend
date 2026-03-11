
import React, { useState } from 'react';
import { Link } from 'react-router';
import { Plus, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import Footer from '../components/Footer';

const About = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:5000';

  const faqs = [
    {
      question: 'What defines the Grand Luxe experience?',
      answer: 'Thoughtful design, calm service, and a pace that lets you feel fully present. We focus on the details that make a stay feel effortless.',
    },
    {
      question: 'Do you offer curated experiences?',
      answer: 'Yes. From dining reservations to spa sessions and private tours, we tailor experiences around your schedule and preferences.',
    },
    {
      question: 'Can I request special arrangements?',
      answer: 'Absolutely. Let us know in advance and we will handle the details from room setup to celebration planning.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
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

      <section className="relative max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] tracking-[0.35em] uppercase text-[#c9a35d] font-semibold">
                About Grand Luxe
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#efece6] leading-[1.05]" >
                A calm, curated stay
                <br />
                in the heart of the city.
              </h1>
              <p className="text-[#c9c3b6] text-base md:text-lg max-w-xl">
                We design every moment to feel intentional. From the way the light falls in your suite
                to the pace of service, Grand Luxe is built for guests who value quiet luxury.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-[#5b6255] bg-[#4a5449]/40 backdrop-blur-sm p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#c9a35d]">Suites</p>
                <p className="text-2xl font-semibold text-[#efece6] mt-2">120+</p>
              </div>
              <div className="rounded-2xl border border-[#5b6255] bg-[#4a5449]/40 backdrop-blur-sm p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#c9a35d]">Culinary</p>
                <p className="text-2xl font-semibold text-[#efece6] mt-2">4 Concepts</p>
              </div>
              <div className="rounded-2xl border border-[#5b6255] bg-[#4a5449]/40 backdrop-blur-sm p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#c9a35d]">Wellness</p>
                <p className="text-2xl font-semibold text-[#efece6] mt-2">Spa + Lounge</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-amber-500/20 blur-2xl" />
            <div className="relative rounded-[28px] overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.3)]">
              <img
                src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&h=800&fit=crop"
                alt="Grand Luxe interiors"
                className="w-full h-[320px] md:h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Signature Calm</p>
                <h2 className="text-2xl md:text-3xl font-semibold mt-2">Designed for slow mornings.</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
          <div className="rounded-[24px] bg-[#4a5449]/40 backdrop-blur-sm border border-[#5b6255] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[#c9a35d]">Our Values</p>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#efece6] mt-3">
              Quiet luxury, always.
            </h3>
            <p className="text-[#c9c3b6] mt-3">
              We focus on understated elegance, intuitive service, and spaces that help you breathe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Personalized care', copy: 'Your preferences shape every detail, from check-in to late checkout.' },
              { title: 'Thoughtful design', copy: 'Material choices and lighting create a calm, warm atmosphere.' },
              { title: 'Cuisine with character', copy: 'Seasonal menus celebrate craft, flavor, and local sourcing.' },
              { title: 'Wellness first', copy: 'Spa rituals and quiet spaces help you reset and recharge.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#5b6255] bg-[#4a5449]/40 backdrop-blur-sm p-5">
                <h4 className="text-base font-semibold text-[#efece6]">{item.title}</h4>
                <p className="text-sm text-[#c9c3b6] mt-2">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10">
          <div className="space-y-4">
            <p className="text-[11px] tracking-[0.35em] uppercase text-[#c9a35d] font-semibold">
              The Experience
            </p>
            <h3 className="text-3xl md:text-4xl font-semibold text-[#efece6]">A simple rhythm to every stay.</h3>
            <p className="text-[#c9c3b6]">
              We built our experience around a gentle flow that keeps your time flexible and unhurried.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Arrive', copy: 'A warm welcome and a seamless arrival, any time of day.' },
              { title: 'Unwind', copy: 'Light-filled suites and quiet corners designed for rest.' },
              { title: 'Explore', copy: 'Dining, spa, and curated experiences on your schedule.' },
              { title: 'Return', copy: 'A calm space that feels familiar from the first night.' },
            ].map((step, index) => (
              <div key={step.title} className="flex items-start gap-4 rounded-2xl border border-[#5b6255] bg-[#4a5449]/40 backdrop-blur-sm p-5">
                <span className="text-sm font-semibold text-[#c9a35d]">0{index + 1}</span>
                <div>
                  <h4 className="text-base font-semibold text-[#efece6]">{step.title}</h4>
                  <p className="text-sm text-[#c9c3b6] mt-1">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative max-w-6xl mx-auto px-4 md:px-6 pb-20">
        <div className="rounded-[28px] bg-[#4a5449]/40 backdrop-blur-sm border border-[#5b6255] p-6 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <p className="text-[11px] tracking-[0.35em] uppercase text-[#c9a35d] font-semibold">
                FAQ
              </p>
              <h3 className="text-3xl md:text-4xl font-semibold text-[#efece6] mt-3">
                Quick questions, clear answers.
              </h3>
            </div>
            <p className="text-[#c9c3b6] max-w-xl">
              We keep it simple. If you need anything else, our concierge is here to help.
            </p>
          </div>

          <div className="mt-8 space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-[#5b6255] py-3">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left gap-4"
                >
                  <span className="text-base md:text-lg font-medium text-[#efece6]">
                    {faq.question}
                  </span>
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#5b6255]/50 text-[#efece6]">
                    {openFaq === index ? <X className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="pt-3 pb-4 pr-10">
                    <p className="text-[#c9c3b6] text-sm md:text-base leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <div className="rounded-[24px] bg-[#4a5449]/40 backdrop-blur-sm border border-[#5b6255] shadow-lg px-6 py-10 md:px-10 text-center">
          <p className="text-xs tracking-[0.35em] uppercase text-[#c9a35d]">Get in Touch</p>
          <h3 className="mt-3 text-2xl md:text-3xl font-semibold text-[#efece6]">
            Ready to experience Grand Luxe?
          </h3>
          <p className="mt-4 text-[#c9c3b6] max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            From curated stays to signature service, we're here to make your stay unforgettable.
          </p>
          <Link to="/contact" className="inline-flex">
            <Button className="mt-6 rounded-full px-8 h-12 text-xs tracking-[0.2em] uppercase bg-amber-500 text-white hover:bg-amber-400">
              Contact Us
            </Button>
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative bg-[#3f4a40] py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#efece6] mb-4">Stay up to date</h2>
              <p className="text-[#c9c3b6] text-base md:text-lg">
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
                  className="h-14 bg-[#4a5449]/40 border-[#5b6255] text-[#efece6] placeholder:text-[#8a8a7f] w-full sm:flex-1"
                  disabled={isSubscribing}
                />
                <Button 
                  className="h-14 px-8 rounded-xl w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-white" 
                  onClick={handleNewsletterSubscribe}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer placed inside main return */}
      <Footer isAdmin={false} />
    </div>
  );
};

export default About;
