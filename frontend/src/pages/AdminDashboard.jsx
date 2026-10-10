import React, { useCallback, useEffect, useRef, useState } from 'react';
import client from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: null, totalLocations: 0, activeBookings: 0, revenue: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [verification, setVerification] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef(null);
  const scannerLock = useRef(false);

  const fetchAdminStats = useCallback(async () => {
    try {
      const [statsRes, locationsRes] = await Promise.all([
        client.get('/admin/stats'),
        client.get('/locations').catch(() => ({ data: [] }))
      ]);
      const data = statsRes.data || {};
      setStats({
        totalUsers: typeof data.totalUsers === 'number' ? data.totalUsers : null,
        totalLocations: Number(data.totalLocations ?? 0), 
        activeBookings: Number(data.activeBookings ?? 0),
        revenue: Number(data.revenue ?? 0)
      });
      const locations = Array.isArray(locationsRes.data)
        ? locationsRes.data
        : (locationsRes.data?.locations || []);
      // The current backend doesn't provide per-location booking/revenue totals.
      setChartData(locations.slice(0, 5).map(loc => ({
        name: String(loc.name || 'Location').slice(0, 15),
        bookings: 0,
        revenue: 0
      })));
      setStatsError('');
    } catch (error) {
      console.error('Admin stats error:', error);
      setStatsError(error.response?.data?.error || 'Unable to load admin statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdminStats(); }, [fetchAdminStats]);

  const extractReference = value => {
    const text = String(value || '').trim();
    const match = text.match(/Reference:\s*([a-f0-9-]{36})/i);
    if (match) return match[1];
    const uuid = text.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
    return uuid ? uuid[0] : '';
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch (error) { console.error('Scanner stop error:', error); }
  };

  useEffect(() => {
    if (!scannerOpen) return;
    let cancelled = false;
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const scanner = new Html5Qrcode('admin-qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          decodedText => {
            if (scannerLock.current) return;
            scannerLock.current = true;
            const token = extractReference(decodedText);
            if (!token) {
              setMessage('Invalid ParkEase QR code.');
              scannerLock.current = false;
              return;
            }
            setReference(token);
            setVerification(null);
            setMessage('QR scanned. Click Verify Booking.');
            setScannerOpen(false);
          },
          () => {}
        );
        if (cancelled) await stopScanner();
      } catch (error) {
        console.error('Camera error:', error);
        if (!cancelled) {
          setMessage('Camera could not start. Allow camera permission or enter reference manually.');
          setScannerOpen(false);
        }
      }
    };
    startScanner();
    return () => { cancelled = true; stopScanner(); };
  }, [scannerOpen]);

  const verifyBooking = async () => {
    const token = extractReference(reference);
    if (!token) { setMessage('Please enter a valid booking reference.'); return; }
    setBusy(true);
    setMessage('');
    setVerification(null);
    try {
      const response = await client.get(`/admin/verify/${encodeURIComponent(token)}`);
      setVerification(response.data);
      setMessage(response.data.message || (response.data.valid ? 'Booking verified.' : 'Ticket not valid.'));
    } catch (error) {
      setMessage(error.response?.data?.error || error.response?.data?.message || 'Unable to verify booking.');
    } finally { setBusy(false); }
  };

  const updateBooking = async action => {
    const token = extractReference(reference);
    const status = verification?.booking?.status;
    if (!token || (action === 'checkin' && !verification?.valid) ||
      (action === 'checkout' && status !== 'CHECKED_IN')) return;
    setBusy(true);
    setMessage('');
    try {
      await client.put(`/admin/${action}/${encodeURIComponent(token)}`);
      setVerification(null);
      setMessage(action === 'checkin' ? 'Vehicle checked in successfully!' : 'Vehicle checked out successfully!');
      await fetchAdminStats();
    } catch (error) {
      setMessage(error.response?.data?.error || error.response?.data?.message || 'Unable to update booking.');
    } finally { setBusy(false); }
  };

  if (loading) return <div className="text-center py-10 text-white">Loading admin dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Admin Overview</h1>
      {statsError && <p className="text-red-400">{statsError}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: `₹${stats.revenue.toFixed(2)}`, color: 'text-teal-400' },
          { title: 'Active Bookings', value: stats.activeBookings, color: 'text-emerald-400' },
          { title: 'Total Users', value: stats.totalUsers ?? '—', color: 'text-blue-400' },
          { title: 'Locations Managed', value: stats.totalLocations, color: 'text-purple-400' }
        ].map(item => (
          <div key={item.title} className="bg-navy-800 p-6 rounded-xl border border-navy-700">
            <div className="text-gray-400 text-sm mb-1">{item.title}</div>
            <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-navy-800 p-6 rounded-xl border border-teal-600">
        <h2 className="text-2xl font-bold text-white mb-2">Parking Entry QR Scanner</h2>
        <p className="text-gray-400 mb-5">Scan a customer's parking ticket to verify their booking.</p>
        <button onClick={() => { scannerLock.current = false; setMessage(''); setScannerOpen(true); }}
          className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold">
          Scan QR Code
        </button>
        {scannerOpen && (
          <div className="mt-5 max-w-md">
            <div id="admin-qr-reader" className="bg-white rounded-xl overflow-hidden" />
            <button onClick={() => setScannerOpen(false)}
              className="mt-3 bg-red-500 text-white px-5 py-2 rounded-lg">Close Camera</button>
          </div>
        )}
        <div className="mt-6">
          <label className="block text-gray-300 mb-2">Booking Reference</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={reference} onChange={e => { setReference(e.target.value); setVerification(null); }}
              placeholder="Scan QR or paste booking reference"
              className="flex-1 bg-navy-900 border border-navy-600 text-white px-4 py-3 rounded-xl" />
            <button onClick={verifyBooking} disabled={busy}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold">
              {busy ? 'Please wait...' : 'Verify Booking'}
            </button>
          </div>
        </div>
        {message && <div className="mt-5 p-4 bg-navy-900 border border-navy-600 rounded-xl text-white">{message}</div>}
        {verification && (
          <div className="mt-5 p-5 bg-navy-900 rounded-xl border border-navy-600">
            <h3 className="text-xl font-bold text-white mb-3">Verification Result</h3>
            <p className={verification.valid ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
              {verification.valid ? 'Valid Parking Ticket' : verification.booking?.status === 'CHECKED_IN' ? 'Vehicle Already Checked In' : 'Ticket Not Valid'}
            </p>
            {verification.booking && (
              <div className="mt-3 space-y-2 text-gray-300">
                <p>Status: {verification.booking.status || 'N/A'}</p>
                <p>Parking: {verification.booking.parkingName || 'N/A'}</p>
                <p>Slot: {verification.booking.slotNumber || 'N/A'}</p>
                <p>Vehicle: {verification.booking.vehicleNumber || 'N/A'}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-5">
              {verification.valid && verification.booking?.status === 'CONFIRMED' && (
                <button onClick={() => updateBooking('checkin')} disabled={busy}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold">Check-In</button>
              )}
              {verification.booking?.status === 'CHECKED_IN' && (
                <button onClick={() => updateBooking('checkout')} disabled={busy}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold">Check-Out</button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-navy-800 p-6 rounded-xl border border-navy-700">
          <h2 className="text-xl font-bold text-white mb-6">Location Performance</h2>
          <p className="text-gray-400 text-sm mb-3">Per-location booking and revenue data needs a backend analytics endpoint.</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar yAxisId="left" dataKey="bookings" fill="#14b8a6" name="Bookings" />
                <Bar yAxisId="right" dataKey="revenue" fill="#3b82f6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Quick Links</h2>
          <a href="/admin/locations" className="block bg-navy-800 hover:bg-navy-700 border border-navy-600 text-white p-4 rounded-xl font-semibold">Manage Locations →</a>
          <a href="/admin/bookings" className="block bg-navy-800 hover:bg-navy-700 border border-navy-600 text-white p-4 rounded-xl font-semibold">All Bookings →</a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
