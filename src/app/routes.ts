import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home.tsx';
import Login from './pages/Login';
import Signup from './pages/Signup';

import RoomListing from './pages/RoomListing';
import RoomDetails from './pages/RoomDetails';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import Services from './pages/Services';
import Offers from './pages/Offers';
import ServiceBooking from './pages/ServiceBooking';
import Profile from './pages/Profile';
import BookingDetails from './pages/BookingDetails';
import CheckIn from './pages/CheckIn';
import CheckOut from './pages/CheckOut';
import Contact from './pages/Contact';
import About from './pages/About';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import AdminDashboard from './pages/AdminDashboard';
import AdminSignup from './pages/AdminSignup';
import ForgotPassword from './pages/ForgotPassword';
import Notifications from './pages/Notifications';


export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'rooms', Component: RoomListing },
      { path: 'room/:id', Component: RoomDetails },
      { path: 'booking', Component: Booking },
      { path: 'payment/:bookingId', Component: Payment },
      { path: 'payment/service/:serviceBookingId', Component: Payment },
      { path: 'services', Component: Services },
      { path: 'offers', Component: Offers },
      { path: 'book-service/:serviceId', Component: ServiceBooking },
      { path: 'profile', Component: Profile },
      { path: 'booking-details/:bookingId', Component: BookingDetails },
      { path: 'checkin/:bookingId', Component: CheckIn },
      { path: 'checkout/:bookingId', Component: CheckOut },
      { path: 'contact', Component: Contact },
      { path: 'about', Component: About },
      // Admin routes as children of Layout
      { path: 'admin', Component: AdminDashboard },
      { path: 'admin-signup', Component: AdminSignup },
      { path: 'notifications', Component: Notifications },
    ],
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/signup',
    Component: Signup,
  },
  {
    path: '/forgot-password',
    Component: ForgotPassword,
  },
  {
    path: '/payment-success/:bookingId',
    Component: PaymentSuccess,
  },
  {
    path: '/payment-success/service/:serviceBookingId',
    Component: PaymentSuccess,
  },
  {
    path: '/payment-failed/:bookingId',
    Component: PaymentFailed,
  },
  {
    path: '/payment-failed/service/:serviceBookingId',
    Component: PaymentFailed,
  },
]);