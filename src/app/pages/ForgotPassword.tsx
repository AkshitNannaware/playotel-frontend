import React, { useState } from 'react';
import { Mail, ArrowLeft, Lock, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSending, setIsSending] = useState(false);
  const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000';

  const requestOtp = async () => {
    if (!identifier.trim()) {
      toast.error('Please enter your email or phone number.');
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data?.message || `Request failed (${response.status})`;
        throw new Error(message);
      }

      toast.success('OTP sent. Please check your email or phone.');
      setStep('verify');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send OTP.';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      toast.error('Please enter the OTP.');
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, otp }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data?.message || `Request failed (${response.status})`;
        throw new Error(message);
      }

      const data = await response.json();
      setResetToken(data.resetToken);
      toast.success('OTP verified. Please set your new password.');
      setStep('reset');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify OTP.';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, resetToken, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data?.message || `Request failed (${response.status})`;
        throw new Error(message);
      }

      toast.success('Password updated successfully. You can log in now.');
      setIdentifier('');
      setOtp('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('request');
      navigate('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset password.';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#3f4a40] text-[#efece6] px-4">
      <div className="w-full max-w-md bg-[#232b23]/95 rounded-3xl shadow-2xl p-10 border border-[#5b6659]">
        <Button variant="ghost" className="mb-6 text-[#efece6] hover:bg-[#2e362e]" onClick={() => navigate('/login')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>

        <h1 className="text-3xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Forgot Password</h1>
        <p className="text-[#cfc9bb] mb-6">
          Enter your email or phone number. We will send an OTP to verify your identity.
        </p>

        <div className="space-y-5">
          <div>
            <Label htmlFor="identifier" className="text-[#efece6]">Email or Phone</Label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b6b6b6]" />
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="pl-10 h-12 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                disabled={step !== 'request'}
                required
              />
            </div>
          </div>

          {step === 'verify' && (
            <div>
              <Label htmlFor="otp" className="text-[#efece6]">OTP</Label>
              <div className="relative mt-2">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b6b6b6]" />
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  className="pl-10 h-12 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                  required
                />
              </div>
            </div>
          )}

          {step === 'reset' && (
            <>
              <div>
                <Label htmlFor="new-password" className="text-[#efece6]">New Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b6b6b6]" />
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="pl-10 h-12 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-[#efece6]">Confirm Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b6b6b6]" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="pl-10 h-12 rounded-xl border-2 border-[#3a463a] bg-[#2e362e] text-[#efece6] placeholder:text-[#b6b6b6] focus:ring-amber-400"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {step === 'request' && (
            <Button type="button" className="w-full h-12 rounded-xl bg-[#243026] border border-[#5b6659] text-[#efece6] hover:bg-white/10" disabled={isSending} onClick={requestOtp}>
              {isSending ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          )}

          {step === 'verify' && (
            <div className="space-y-3">
              <Button type="button" className="w-full h-12 rounded-xl bg-[#243026] border border-[#5b6659] text-[#efece6] hover:bg-white/10" disabled={isSending} onClick={verifyOtp}>
                {isSending ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl bg-[#2e362e] border border-[#3a463a] text-[#efece6] hover:bg-white/10"
                disabled={isSending}
                onClick={requestOtp}
              >
                Resend OTP
              </Button>
            </div>
          )}

          {step === 'reset' && (
            <Button type="button" className="w-full h-12 rounded-xl bg-[#243026] border border-[#5b6659] text-[#efece6] hover:bg-white/10" disabled={isSending} onClick={resetPassword}>
              {isSending ? 'Updating...' : 'Update Password'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
