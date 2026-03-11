import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useBooking } from '../context/BookingContext';

const PaymentFailed = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { bookings } = useBooking();
  const booking = bookings.find(b => b.id === bookingId);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Booking not found</h2>
          <Button onClick={() => navigate('/rooms')}>Browse Rooms</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-stone-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl mb-3">Payment Failed</h1>
          <p className="text-xl text-stone-600 mb-8">
            Unfortunately, your payment could not be processed
          </p>

          <div className="bg-stone-50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg mb-4">Common reasons for payment failure:</h3>
            <ul className="space-y-2 text-stone-600">
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Insufficient funds in your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Incorrect card details or CVV</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Card expired or blocked by bank</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Transaction limit exceeded</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Network or connectivity issues</span>
              </li>
            </ul>
          </div>

          <div className="bg-stone-50 rounded-2xl p-6 mb-8 text-left">
            <div className="text-sm text-stone-600 mb-1">Booking ID</div>
            <div className="text-xl mb-4">{booking.id}</div>
            
            <div className="text-sm text-stone-600 mb-1">Amount</div>
            <div className="text-2xl">₹{booking.totalPrice.toFixed(2)}</div>
          </div>

          <div className="space-y-3 mb-8">
            <Button
              onClick={() => navigate(`/payment/${bookingId}`)}
              className="w-full h-12 rounded-xl"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Retry Payment
            </Button>

            <Button
              onClick={() => navigate('/booking')}
              className="w-full h-12 rounded-xl"
              variant="outline"
            >
              Change Payment Method
            </Button>

            <Button
              onClick={() => navigate('/')}
              className="w-full h-12 rounded-xl"
              variant="outline"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <p className="mb-2">
              <strong>Need help?</strong>
            </p>
            <p>
              Contact our support team at support@hotel.com or call +1-800-123-4567
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
