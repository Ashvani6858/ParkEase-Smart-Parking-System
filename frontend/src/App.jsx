
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import LocationSearch from './pages/LocationSearch';
import LocationDetails from './pages/LocationDetails';
import SlotSelection from './pages/SlotSelection';
import BookingConfirmation from './pages/BookingConfirmation';
import Payment from './pages/Payment';
import MyBookings from './pages/MyBookings';
import Vehicles from './pages/Vehicles';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminLocations from './pages/AdminLocations';
import AdminBookings from './pages/AdminBookings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-navy-900 text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* User Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/search" element={<LocationSearch />} />
              <Route path="/location/:id" element={<LocationDetails />} />
              <Route path="/location/:id/slots" element={<SlotSelection />} />
              <Route path="/booking/:id/confirm" element={<BookingConfirmation />} />

              {/* Payment Route */}
              <Route path="/payment/:id" element={<Payment />} />

              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/locations" element={<AdminLocations />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
