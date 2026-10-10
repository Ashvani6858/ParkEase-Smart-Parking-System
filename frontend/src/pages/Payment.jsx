
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import client from '../api/client';

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await client.get(
          `/bookings/${id}/payment`
        );

        setPayment(response.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Unable to load payment details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [id]);

  useEffect(() => {
    if (!payment?.expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(payment.expiresAt).getTime() -
            Date.now()) / 1000
        )
      );

      setTimeLeft(remaining);
    };

    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [payment]);

  const handleDemoPayment = async () => {
    if (processing || timeLeft <= 0) return;

    setProcessing(true);
    setError('');

    try {
      await client.post(`/bookings/${id}/demo-pay`);

      navigate('/bookings');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Demo payment failed'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-white">
        Loading payment details...
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-12 text-red-400">
        {error || 'Payment not found'}
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime =
    `${String(minutes).padStart(2, '0')}:` +
    `${String(seconds).padStart(2, '0')}`;

  const isPending = payment.status === 'PENDING_PAYMENT';
  const expired = timeLeft <= 0;

  const canPay = isPending && !expired && !processing;

  const qrValue = [
    'ParkEase DEMO Booking',
    `Booking ID: ${id}`,
    `Parking: ${payment.parkingName}`,
    `Amount: INR ${Number(payment.amount).toFixed(2)}`,
    'DEMO ONLY - NO REAL PAYMENT'
  ].join('\n');

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 text-center shadow-xl">

        <h1 className="text-3xl font-bold text-white mb-2">
          ParkEase Payment
        </h1>

        <p className="text-gray-400 mb-6">
          {payment.parkingName}
        </p>

        <div className="bg-slate-900 rounded-xl p-6 mb-6">
          <p className="text-gray-400 mb-2">
            Total Amount
          </p>

          <p className="text-4xl font-bold text-teal-400">
            ₹{Number(payment.amount).toFixed(2)}
          </p>
        </div>

        <div className="bg-white text-slate-900 rounded-xl p-6 mb-6">

          <div className="flex justify-center">
            <QRCodeSVG
              value={qrValue}
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              marginSize={2}
            />
          </div>

          <p className="font-bold text-lg mt-4">
            Scan Demo QR Code
          </p>

          <p className="text-sm text-gray-600 mt-2">
            Scan to view booking information
          </p>

          <p className="text-xs text-red-600 font-semibold mt-2">
            DEMO ONLY - No real payment
          </p>
        </div>

        {isPending && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-5">
            <p className="text-gray-400 text-sm mb-2">
              Time Remaining
            </p>

            <p className={`text-3xl font-bold ${
              expired ? 'text-red-400' : 'text-teal-400'
            }`}>
              {formattedTime}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {payment.status === 'CONFIRMED' ? (
          <p className="text-green-400 font-semibold mb-4">
            Payment completed. Booking confirmed!
          </p>
        ) : payment.status === 'CANCELLED' ? (
          <p className="text-red-400 mb-4">
            This booking has been cancelled.
          </p>
        ) : expired ? (
          <p className="text-red-400 mb-4">
            Payment time expired. Please create a new booking.
          </p>
        ) : (
          <p className="text-amber-400 mb-4">
            Booking Pending Payment
          </p>
        )}

        <button
          onClick={handleDemoPayment}
          disabled={!canPay}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors"
        >
          {processing
            ? 'Processing...'
            : payment.status === 'CONFIRMED'
            ? 'Payment Completed'
            : expired
            ? 'Payment Expired'
            : 'Pay Now (Demo)'}
        </button>

        <Link
          to="/bookings"
          className="block text-gray-400 hover:text-white mt-5"
        >
          View My Bookings
        </Link>

      </div>
    </div>
  );
};

export default Payment;
