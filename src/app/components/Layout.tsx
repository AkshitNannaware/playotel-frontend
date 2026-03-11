import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNavUser from './MobileBottomNavuser.tsx';
import MobileBottomNavAdmin from './MobileBottomNavadmin.tsx';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {/* <Footer /> removed to prevent double footer in admin pages */}
      {isAdmin && location.pathname.startsWith('/admin') ? (
        <MobileBottomNavAdmin />
      ) : (
        <MobileBottomNavUser />
      )}
    </div>
  );
};

export default Layout;