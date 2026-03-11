import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = loginMethod === 'email' ? email : phone;
    const success = await login(identifier, password);
    if (success) {
      toast.success('Login successful!');
      // Check user role from localStorage (set by AuthContext)
      const auth = localStorage.getItem('auth');
      let isAdmin = false;
      if (auth) {
        try {
          const parsed = JSON.parse(auth);
          isAdmin = parsed.user?.role === 'admin';
        } catch {}
      }
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#3f4a40] text-[#efece6] px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <div className="bg-[#232b23]/95 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 border border-[#5b6659]">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl mb-2 font-bold tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>Welcome Back</h1>
            <p className="text-[#cfc9bb] text-base sm:text-lg">Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="flex gap-2 p-1 bg-[#2f3a32] rounded-xl mb-6 sm:mb-8">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl text-sm sm:text-base md:text-lg font-medium transition-all ${
                  loginMethod === 'email' ? 'bg-[#3f4a40] shadow-md text-[#efece6]' : 'text-[#cfc9bb] hover:text-[#efece6]'
                }`}
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl text-sm sm:text-base md:text-lg font-medium transition-all ${
                  loginMethod === 'phone' ? 'bg-[#3f4a40] shadow-md text-[#efece6]' : 'text-[#cfc9bb] hover:text-[#efece6]'
                }`}
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Phone</span>
              </button>
            </div>

            {loginMethod === 'email' ? (
              <div>
                <Label htmlFor="email" className="text-[#efece6] text-sm sm:text-base">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 sm:h-14 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] text-base sm:text-lg px-4 sm:px-5 focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="phone" className="text-[#efece6] text-sm sm:text-base">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 h-12 sm:h-14 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] text-base sm:text-lg px-4 sm:px-5 focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="password" className="text-[#efece6] text-sm sm:text-base">Password</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 sm:h-14 pr-12 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] text-base sm:text-lg px-4 sm:px-5 focus:ring-2 focus:ring-amber-400"
                  required
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

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-sm sm:text-base text-[#efece6]">
                <input type="checkbox" className="w-4 h-4 sm:w-5 sm:h-5 rounded border-[#3a463a] bg-[#232b23] cursor-pointer" />
                <span className="text-[#cfc9bb]">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[#efece6] hover:underline text-sm sm:text-base">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full h-12 sm:h-14 rounded-xl text-base sm:text-lg font-medium bg-[#243026] border border-[#5b6659] text-[#efece6] hover:bg-white/10 transition-colors">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm sm:text-base text-[#cfc9bb]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#efece6] hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
