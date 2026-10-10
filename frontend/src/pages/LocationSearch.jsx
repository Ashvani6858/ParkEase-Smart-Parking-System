
import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Link } from 'react-router-dom';

const LocationSearch = () => {
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLocations = async (searchQuery = '') => {
    setLoading(true);

    try {
      const res = await client.get('/locations');

      const allLocations = Array.isArray(res.data) ? res.data : [];

      const filtered = allLocations.filter((loc) => {
        const text = `${loc.name} ${loc.city} ${loc.address}`.toLowerCase();
        return text.includes(searchQuery.trim().toLowerCase());
      });

      setLocations(filtered);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLocations(query);
  };

  const getAvailableSpots = (loc) => {
    return (loc.floors || []).reduce((total, floor) => {
      const available = (floor.slots || []).filter(
        (slot) => slot.status === 'AVAILABLE'
      ).length;

      return total + available;
    }, 0);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      <h1 className="text-3xl font-bold text-white mb-6">
        Find Parking
      </h1>

      <form onSubmit={handleSearch} className="flex gap-4">
        <input
          type="text"
          placeholder="Search Delhi, Noida, Gurugram..."
          className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="text-center py-10 text-gray-400">
          Searching locations...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {locations.length > 0 ? (
            locations.map((loc) => (
              <div
                key={loc.id}
                className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-teal-500 transition-colors"
              >
                <div className="h-40 bg-slate-900 flex items-center justify-center">
                  <span className="text-5xl">🅿️</span>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {loc.name}
                    </h3>

                    <span className="shrink-0 bg-slate-900 px-3 py-1 rounded-lg text-sm text-teal-400 border border-slate-600">
                      ₹{loc.hourlyRate}/hr
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-2">
                    📍 {loc.address}
                  </p>

                  <p className="text-gray-400 text-sm">
                    City: {loc.city}
                  </p>

                  <div className="flex justify-between items-center gap-3 mt-5 pt-4 border-t border-slate-700">
                    <div className="text-sm text-gray-300">
                      <span className="font-bold text-teal-400">
                        {getAvailableSpots(loc)}
                      </span>{' '}
                      slots available*
                    </div>

                    <Link
                      to={`/location/${loc.id}`}
                      className="text-teal-400 hover:text-teal-300 font-medium text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-slate-800 rounded-xl">
              <p className="text-gray-400">
                No locations found. Try another city.
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        *Available slot count is based on slot status. Booking-time availability
        is checked during slot selection.
      </p>
    </div>
  );
};

export default LocationSearch;
