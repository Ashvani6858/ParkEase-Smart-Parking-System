
import React, { useState, useEffect } from 'react';
import client from '../api/client';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    regNumber: '',
    type: 'CAR',
    model: '',
    color: ''
  });

  const fetchVehicles = async () => {
    try {
      const res = await client.get('/vehicles');
      setVehicles(res.data);
      setError('');
    } catch (err) {
      setError('Unable to load vehicles.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await client.post('/vehicles', {
        regNumber: formData.regNumber.trim().toUpperCase(),
        type: formData.type,
        model: formData.model.trim(),
        color: formData.color.trim()
      });

      setFormData({
        regNumber: '',
        type: 'CAR',
        model: '',
        color: ''
      });

      setShowAdd(false);
      await fetchVehicles();
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to add vehicle.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;

    try {
      await client.delete(`/vehicles/${id}`);
      await fetchVehicles();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to delete vehicle.'
      );
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading vehicles...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">
          My Vehicles
        </h1>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-lg"
        >
          {showAdd ? 'Cancel' : '+ Add Vehicle'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="bg-navy-800 p-6 rounded-xl border border-navy-700 space-y-4"
        >
          <h2 className="text-xl font-bold text-white">
            Add New Vehicle
          </h2>

          <div>
            <label className="block text-gray-300 mb-2">
              Registration Number
            </label>
            <input
              required
              placeholder="UP16AB4521"
              value={formData.regNumber}
              onChange={(e) => setFormData({
                ...formData,
                regNumber: e.target.value
              })}
              className="w-full bg-navy-900 border border-gray-600 rounded-lg p-3 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Vehicle Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({
                ...formData,
                type: e.target.value
              })}
              className="w-full bg-navy-900 border border-gray-600 rounded-lg p-3 text-white"
            >
              <option value="CAR">Car</option>
              <option value="BIKE">Bike</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Vehicle Model
            </label>
            <input
              required
              placeholder="Maruti Suzuki Swift"
              value={formData.model}
              onChange={(e) => setFormData({
                ...formData,
                model: e.target.value
              })}
              className="w-full bg-navy-900 border border-gray-600 rounded-lg p-3 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Color
            </label>
            <input
              placeholder="White"
              value={formData.color}
              onChange={(e) => setFormData({
                ...formData,
                color: e.target.value
              })}
              className="w-full bg-navy-900 border border-gray-600 rounded-lg p-3 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Vehicle'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-navy-800 border border-navy-700 rounded-xl p-6"
            >
              <div className="text-4xl mb-3">
                {vehicle.type === 'BIKE' ? '🏍️' : '🚗'}
              </div>

              <h3 className="text-xl font-bold text-white">
                {vehicle.model}
              </h3>

              <p className="text-teal-400 mt-2">
                {vehicle.regNumber}
              </p>

              <p className="text-gray-400 mt-2">
                Type: {vehicle.type}
              </p>

              <p className="text-gray-400">
                Color: {vehicle.color || 'Not specified'}
              </p>

              <button
                onClick={() => handleDelete(vehicle.id)}
                className="mt-4 text-red-400 hover:text-red-300"
              >
                Delete Vehicle
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 py-10 col-span-full">
            No vehicles added yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
