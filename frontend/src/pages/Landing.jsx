import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl mb-6">
          Smart Parking Management <span className="text-teal-500">&</span> Booking
        </h1>
        <p className="mt-4 text-xl text-gray-300 mb-10">
          Find, reserve, and manage your parking spots with ease. Real-time availability and premium features for a seamless experience.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/search"
            className="rounded-md bg-teal-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-colors"
          >
            Find Parking Now
          </Link>
          <Link
            to="/signup"
            className="rounded-md bg-navy-800 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-navy-700 border border-navy-700 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
      
      <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-3 w-full">
        <div className="bg-navy-800 p-8 rounded-2xl border border-navy-700">
          <div className="text-teal-500 text-3xl mb-4">📍</div>
          <h3 className="text-xl font-bold text-white mb-2">Real-time Availability</h3>
          <p className="text-gray-400">See exactly which spots are open in real-time before you arrive.</p>
        </div>
        <div className="bg-navy-800 p-8 rounded-2xl border border-navy-700">
          <div className="text-amber-500 text-3xl mb-4">📅</div>
          <h3 className="text-xl font-bold text-white mb-2">Advance Booking</h3>
          <p className="text-gray-400">Reserve your spot ahead of time and guarantee your parking space.</p>
        </div>
        <div className="bg-navy-800 p-8 rounded-2xl border border-navy-700">
          <div className="text-emerald-500 text-3xl mb-4">📱</div>
          <h3 className="text-xl font-bold text-white mb-2">Seamless Management</h3>
          <p className="text-gray-400">Manage multiple vehicles and view booking history from your dashboard.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
