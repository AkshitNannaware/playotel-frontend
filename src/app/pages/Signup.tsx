import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signup } = useAuth();
  const navigate = useNavigate();

  const validationPatterns = {
    name: /^[a-zA-Z\s]{2,50}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (!validationPatterns.name.test(value))
          return 'Name must be 2-50 characters, letters only';
        return '';

      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!validationPatterns.email.test(value))
          return 'Please enter a valid email';
        return '';

      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (value.length < 8) return 'Invalid phone number';
        return '';

      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: '' }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 15) value = value.slice(0, 15);
    setFormData(prev => ({ ...prev, phone: value }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const error = validateField(id, value);
    if (error) setErrors(prev => ({ ...prev, [id]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      const success = await signup(
        formData.name.trim(),
        formData.email.trim(),
        formData.phone.trim(),
        formData.password
      );

      if (success) {
        toast.success('Account created successfully!');
        navigate('/login');
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#3f4a40] text-[#efece6] px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg bg-[#232b23]/95 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 border border-[#5b6659]">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Create Account</h1>
        <p className="text-center text-[#cfc9bb] mb-6 sm:mb-8 text-base sm:text-lg">
          Join us for exclusive benefits
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-[#efece6] text-sm sm:text-base">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your full name"
              className={`mt-2 h-12 sm:h-14 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] text-base sm:text-lg px-4 sm:px-5 focus:ring-2 focus:ring-amber-400 ${errors.name ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.name && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-[#efece6] text-sm sm:text-base">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your email"
              className={`mt-2 h-12 sm:h-14 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] text-base sm:text-lg px-4 sm:px-5 focus:ring-2 focus:ring-amber-400 ${errors.email ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone" className="text-[#efece6] text-sm sm:text-base">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              onBlur={handleBlur}
              placeholder="Enter your phone number"
              className={`mt-2 h-12 sm:h-14 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] text-base sm:text-lg px-4 sm:px-5 focus:ring-2 focus:ring-amber-400 ${errors.phone ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-[#efece6] text-sm sm:text-base">Password *</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="h-12 sm:h-14 pr-12 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] text-base sm:text-lg px-4 sm:px-5 focus:ring-2 focus:ring-amber-400"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#b6b6b6] hover:text-[#efece6] p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="text-[#efece6] text-sm sm:text-base">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Confirm your password"
              className={`mt-2 h-12 sm:h-14 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] text-base sm:text-lg px-4 sm:px-5 focus:ring-2 focus:ring-amber-400 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-xs sm:text-sm text-red-500 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full h-12 sm:h-14 rounded-xl text-base sm:text-lg font-medium bg-[#243026] border border-[#5b6659] text-[#efece6] hover:bg-white/10 transition-colors" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm sm:text-base text-[#cfc9bb] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#efece6] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
