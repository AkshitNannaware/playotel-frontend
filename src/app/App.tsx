import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;
