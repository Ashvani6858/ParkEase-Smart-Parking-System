import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ activeBookings: 0, vehicles: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bookingsRes, vehiclesRes] = await Promise.all([
          client.get('/bookings'),
          client.get('/vehicles')
        ]);
        
        const active = bookingsRes.data.filter(b => b.status === 'active' || b.status === 'upcoming');
        setStats({
          activeBookings: active.length,
          vehicles: vehiclesRes.data.length
        });
        setRecentBookings(bookingsRes.data.slice(0, 3));
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Welcome, {user?.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-navy-800 p-6 rounded-xl border border-navy-700">
          <div className="text-gray-400 text-sm font-medium mb-1">Active Bookings</div>
          <div className="text-3xl font-bold text-teal-500">{stats.activeBookings}</div>
        </div>
        <div className="bg-navy-800 p-6 rounded-xl border border-navy-700">
          <div className="text-gray-400 text-sm font-medium mb-1">Vehicles Registered</div>
          <div className="text-3xl font-bold text-blue-400">{stats.vehicles}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-navy-800 p-6 rounded-xl border border-navy-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
            <Link to="/bookings" className="text-sm text-teal-500 hover:text-teal-400">View All</Link>
          </div>
          {recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map(booking => (
                <div key={booking._id} className="bg-navy-900 p-4 rounded-lg flex justify-between items-center border border-navy-600">
                  <div>
                    <div className="font-medium text-white">{booking.location?.name || 'Unknown Location'}</div>
                    <div className="text-sm text-gray-400">Slot: {booking.slot?.name} | {new Date(booking.startTime).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                    booking.status === 'completed' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                    'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No recent bookings found.</div>
          )}
        </div>
        
        <div className="space-y-4">
          <Link to="/search" className="block w-full bg-teal-600 hover:bg-teal-700 text-white text-center py-4 rounded-xl font-semibold transition-colors shadow-lg">
            Find Parking
          </Link>
          <Link to="/vehicles" className="block w-full bg-navy-800 hover:bg-navy-700 border border-navy-600 text-white text-center py-4 rounded-xl font-semibold transition-colors">
            Manage Vehicles
          </Link>
          <Link to="/profile" className="block w-full bg-navy-800 hover:bg-navy-700 border border-navy-600 text-white text-center py-4 rounded-xl font-semibold transition-colors">
            My Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
