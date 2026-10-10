
import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const ticketRef = useRef(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await client.get('/bookings/my-bookings');

        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.bookings || [];

        setBookings(data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError(
          err.response?.data?.error ||
          'Unable to load bookings'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'CHECKED_IN':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';

      case 'CANCELLED':
      case 'NO_SHOW':
        return 'bg-red-500/10 text-red-400 border-red-500/30';

      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  const canViewTicket = (booking) =>
    ['CONFIRMED', 'CHECKED_IN'].includes(booking.status);

  const getTicketValue = (booking) => {
    return [
      'PARKEASE PARKING ENTRY TICKET',
      `Booking ID: ${booking.id}`,
      `Reference: ${booking.referenceToken}`,
      `Parking: ${booking.slot?.floor?.location?.name || 'N/A'}`,
      `Slot: ${booking.slot?.slotNumber || 'N/A'}`,
      `Vehicle: ${booking.vehicle?.regNumber || 'N/A'}`,
      `Start: ${booking.startTime}`,
      `End: ${booking.endTime}`
    ].join('\n');
  };

  const openTicket = (booking) => {
    setDownloadError('');
    setSelectedTicket(booking);
  };

  const downloadTicket = async () => {
    if (!ticketRef.current || !selectedTicket || downloading) {
      return;
    }

    setDownloading(true);
    setDownloadError('');

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });

      const imageData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 15;
      const availableWidth = pageWidth - margin * 2;

      const imageHeight =
        (canvas.height * availableWidth) / canvas.width;

      const availableHeight = pageHeight - margin * 2;

      const finalHeight = Math.min(imageHeight, availableHeight);

      const finalWidth =
        (canvas.width * finalHeight) / canvas.height;

      const x = (pageWidth - finalWidth) / 2;

      pdf.addImage(
        imageData,
        'PNG',
        x,
        margin,
        finalWidth,
        finalHeight
      );

      pdf.save(
        `ParkEase-Ticket-${selectedTicket.id.slice(0, 8)}.pdf`
      );
    } catch (err) {
      console.error('PDF download error:', err);
      setDownloadError(
        'Unable to download ticket. Please try again.'
      );
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-white">
        Loading bookings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">

      <div className="flex justify-between items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold text-white">
          My Bookings
        </h1>

        <Link
          to="/search"
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-lg"
        >
          New Booking
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">
                    {booking.slot?.floor?.location?.name ||
                      'Parking Location'}
                  </h3>

                  <p className="text-gray-300">
                    Slot:{' '}
                    <span className="text-teal-400 font-semibold">
                      {booking.slot?.slotNumber || 'N/A'}
                    </span>
                  </p>

                  <p className="text-gray-300">
                    Vehicle: {booking.vehicle?.regNumber || 'N/A'}
                  </p>

                  <p className="text-gray-400 text-sm">
                    Start: {new Date(booking.startTime).toLocaleString()}
                  </p>

                  <p className="text-gray-400 text-sm">
                    End: {new Date(booking.endTime).toLocaleString()}
                  </p>

                  <p className="text-gray-400 text-xs break-all">
                    Booking ID: {booking.referenceToken || booking.id}
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <span
                    className={`px-4 py-2 rounded-full border text-sm font-semibold ${getStatusStyle(
                      booking.status
                    )}`}
                  >
                    {booking.status?.replaceAll('_', ' ') || 'UNKNOWN'}
                  </span>

                  <p className="text-2xl font-bold text-white">
                    ₹{Number(booking.totalAmount || 0).toFixed(2)}
                  </p>

                  {canViewTicket(booking) && (
                    <button
                      onClick={() => openTicket(booking)}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-5 py-3 rounded-lg"
                    >
                      View Entry Ticket
                    </button>
                  )}

                  {booking.status === 'PENDING_PAYMENT' && (
                    <Link
                      to={`/payment/${booking.id}`}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-5 py-3 rounded-lg text-center"
                    >
                      Complete Payment
                    </Link>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : !error ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <div className="text-5xl mb-4">🎫</div>

          <h3 className="text-xl font-bold text-white mb-2">
            No Bookings Yet
          </h3>

          <p className="text-gray-400 mb-6">
            You haven't made any parking reservations.
          </p>

          <Link
            to="/search"
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg"
          >
            Find Parking Now
          </Link>
        </div>
      ) : null}

      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">

          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5 w-full max-w-md text-center shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-white text-2xl"
                aria-label="Close ticket"
              >
                ✕
              </button>
            </div>

            {/* Printable ticket area */}
            <div
              ref={ticketRef}
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'center'
              }}
            >
              <h2
                style={{
                  fontSize: '26px',
                  fontWeight: 'bold',
                  color: '#0f766e',
                  marginBottom: '8px'
                }}
              >
                ParkEase
              </h2>

              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#15803d',
                  marginBottom: '20px'
                }}
              >
                PARKING ENTRY TICKET
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '12px',
                  backgroundColor: '#ffffff'
                }}
              >
                <QRCodeSVG
                  value={getTicketValue(selectedTicket)}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  marginSize={2}
                />
              </div>

              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginTop: '16px',
                  marginBottom: '16px'
                }}
              >
                {selectedTicket.slot?.floor?.location?.name || 'Parking Location'}
              </p>

              <div
                style={{
                  textAlign: 'left',
                  fontSize: '14px',
                  lineHeight: '1.9'
                }}
              >
                <p>
                  <strong>Slot:</strong>{' '}
                  {selectedTicket.slot?.slotNumber || 'N/A'}
                </p>

                <p>
                  <strong>Vehicle:</strong>{' '}
                  {selectedTicket.vehicle?.regNumber || 'N/A'}
                </p>

                <p>
                  <strong>Start:</strong>{' '}
                  {new Date(selectedTicket.startTime).toLocaleString()}
                </p>

                <p>
                  <strong>End:</strong>{' '}
                  {new Date(selectedTicket.endTime).toLocaleString()}
                </p>

                <p>
                  <strong>Amount:</strong>{' '}
                  INR {Number(selectedTicket.totalAmount || 0).toFixed(2)}
                </p>

                <p>
                  <strong>Status:</strong>{' '}
                  {selectedTicket.status}
                </p>

                <p
                  style={{
                    overflowWrap: 'anywhere',
                    fontSize: '12px'
                  }}
                >
                  <strong>Reference:</strong>{' '}
                  {selectedTicket.referenceToken || selectedTicket.id}
                </p>
              </div>

              <p
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  marginTop: '20px'
                }}
              >
                Demo parking entry ticket.
                Staff verification is not yet implemented.
              </p>
            </div>

            {downloadError && (
              <p className="text-red-400 text-sm mt-4">
                {downloadError}
              </p>
            )}

            <button
              onClick={downloadTicket}
              disabled={downloading}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg mt-5"
            >
              {downloading
                ? 'Generating PDF...'
                : 'Download PDF Ticket'}
            </button>

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg mt-3"
            >
              Close Ticket
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookings;
