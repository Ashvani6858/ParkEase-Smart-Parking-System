
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import SlotGrid from '../components/SlotGrid';

const SlotSelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await client.get(`/locations/${id}/slots`);
        const data = res.data;

        setLocation(data);

        const allSlots = (data.floors || []).flatMap(
          (floor) =>
            (floor.slots || []).map((slot) => ({
              ...slot,
              name: slot.slotNumber,
              _id: slot.id,
              status: slot.isAvailable ? 'available' : 'occupied'
            }))
        );

        setSlots(allSlots);
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError('Unable to load parking slots.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleProceed = () => {
    if (selectedSlot) {
      navigate(`/booking/${selectedSlot.id}/confirm`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-white">
        Loading parking slots...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <button
        onClick={() => navigate(-1)}
        className="text-teal-400 mb-6"
      >
        ← Back to Location
      </button>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 md:p-8 mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Select a Parking Slot
        </h1>

        <p className="text-gray-400 mb-8">
          {location?.name} - {location?.address}
        </p>

        <div className="flex gap-6 mb-8 flex-wrap text-gray-300">
          <span>🟢 Available</span>
          <span>🔴 Occupied</span>
          <span>🟠 Reserved</span>
        </div>

        {error ? (
          <p className="text-red-400">{error}</p>
        ) : slots.length > 0 ? (
          <SlotGrid
            slots={slots}
            selectedSlotId={selectedSlot?.id}
            onSelectSlot={setSelectedSlot}
          />
        ) : (
          <p className="text-center text-gray-400 py-10">
            No parking slots have been added for this location yet.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleProceed}
          disabled={!selectedSlot}
          className={`px-8 py-4 rounded-xl font-bold text-lg ${
            selectedSlot
              ? 'bg-teal-600 hover:bg-teal-500 text-white'
              : 'bg-slate-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {selectedSlot
            ? `Book Slot ${selectedSlot.slotNumber}`
            : 'Select a slot to proceed'}
        </button>
      </div>
    </div>
  );
};

export default SlotSelection;
