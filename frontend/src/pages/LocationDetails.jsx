import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';

const LocationDetails = () => {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await client.get(`/locations/${id}`);
        setLocation(res.data);
      } catch (error) {
        console.error("Error fetching location details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading location details...</div>;
  if (!location) return <div className="text-center py-10">Location not found.</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-teal-500 hover:text-teal-400 mb-6 flex items-center gap-2">
        <span>←</span> Back to Search
      </button>

      <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden">
        <div className="h-64 bg-navy-900 relative flex items-center justify-center">
           <div className="text-6xl opacity-30">🅿️</div>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{location.name}</h1>
              <p className="text-gray-400 text-lg">{location.address}</p>
            </div>
            <div className="bg-navy-900 p-4 rounded-xl border border-navy-600 text-center min-w-[120px]">
              <div className="text-gray-400 text-sm mb-1">Rate</div>
              <div className="text-2xl font-bold text-teal-400">₹{location.hourlyRate}<span className="text-sm font-normal text-gray-500">/hr</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-navy-700 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Features & Amenities</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">✓ Covered Parking</li>
                <li className="flex items-center gap-2">✓ 24/7 Security</li>
                <li className="flex items-center gap-2">✓ EV Charging (Selected slots)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Operating Hours</h3>
              <p className="text-gray-300">Open 24 hours</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              to={`/location/${id}/slots`}
              className="bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold py-4 px-12 rounded-xl transition-colors shadow-lg hover:shadow-teal-500/20"
            >
              View Available Slots & Book
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetails;
