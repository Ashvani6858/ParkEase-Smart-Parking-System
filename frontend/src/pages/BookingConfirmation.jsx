
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

const BookingConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [slot, setSlot] = useState(null);
  const [location, setLocation] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');

        const locationsRes = await client.get('/locations');
        const locations = locationsRes.data;

        let foundSlot = null;
        let foundLocation = null;

        for (const loc of locations) {
          for (const floor of loc.floors || []) {
            const matchingSlot = (floor.slots || []).find(
              (s) => s.id === id
            );

            if (matchingSlot) {
              foundSlot = matchingSlot;
              foundLocation = loc;
              break;
            }
          }

          if (foundSlot) break;
        }

        if (!foundSlot || !foundLocation) {
          throw new Error('Parking slot not found');
        }

        setSlot(foundSlot);
        setLocation(foundLocation);

        const vehiclesRes = await client.get('/vehicles');

        const vehicleList = Array.isArray(vehiclesRes.data)
          ? vehiclesRes.data
          : [];

        setVehicles(vehicleList);

        const compatibleVehicle = vehicleList.find(
          (v) => v.type === foundSlot.type
        );

        if (compatibleVehicle) {
          setSelectedVehicle(compatibleVehicle.id);
        }
      } catch (err) {
        console.error('Booking data error:', err);

        setError(
          err.response?.data?.error ||
          err.message ||
          'Failed to load booking details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const compatibleVehicles = vehicles.filter(
    (v) => v.type === slot?.type
  );

  const handleConfirm = async () => {
    if (!selectedVehicle) {
      setError('Please select a compatible vehicle');
      return;
    }

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 24
    ) {
      setError('Please select a duration between 1 and 24 hours');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const startTime = new Date(
        Date.now() + 2 * 60 * 1000
      );

      const endTime = new Date(
        startTime.getTime() + duration * 60 * 60 * 1000
      );

      const response = await client.post('/bookings', {
        slotId: id,
        vehicleId: selectedVehicle,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      const bookingId = response.data.id;

      if (!bookingId) {
        throw new Error('Booking ID not received');
      }

      navigate(`/payment/${bookingId}`);

    } catch (err) {
      console.error('Booking error:', err);

      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create booking'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-white">
        Preparing booking...
      </div>
    );
  }

  if (!slot || !location) {
    return (
      <div className="text-center py-10 text-red-400">
        {error || 'Error loading booking data.'}
      </div>
    );
  }

  const totalCost = location.hourlyRate * duration;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-white mb-6">
        Confirm Booking
      </h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white mb-1">
            {location.name}
          </h2>

          <p className="text-gray-400">
            {location.address}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-slate-900 p-4 rounded-lg">
            <span className="text-gray-400">
              Selected Slot
            </span>

            <span className="text-2xl font-bold text-teal-400">
              {slot.slotNumber}
            </span>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Select Vehicle
            </label>

            {compatibleVehicles.length > 0 ? (
              <select
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 text-white"
                value={selectedVehicle}
                onChange={(e) =>
                  setSelectedVehicle(e.target.value)
                }
              >
                {compatibleVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.model} ({v.regNumber})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-amber-400 bg-amber-500/10 p-4 rounded-lg">
                No compatible vehicles registered.

                <Link
                  to="/vehicles"
                  className="ml-2 text-teal-400 underline"
                >
                  Add Vehicle
                </Link>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Duration (Hours)
            </label>

            <input
              type="number"
              min="1"
              max="24"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 text-white"
              value={duration}
              onChange={(e) =>
                setDuration(Number(e.target.value))
              }
            />
          </div>

          <div className="pt-6 border-t border-slate-700 flex justify-between items-end gap-4">
            <div>
              <p className="text-gray-400 mb-1">
                Total Amount
              </p>

              <p className="text-3xl font-bold text-white">
                ₹{Number.isFinite(totalCost)
                  ? totalCost.toFixed(2)
                  : '0.00'}
              </p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={
                processing ||
                compatibleVehicles.length === 0
              }
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
            >
              {processing
                ? 'Processing...'
                : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
