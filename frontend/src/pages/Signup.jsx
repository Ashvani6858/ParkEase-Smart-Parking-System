import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await client.post('/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-120px)]">
      <div className="bg-navy-800 p-8 rounded-xl border border-navy-700 w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-white mb-6">Create Account</h2>
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-md mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full bg-navy-900 border border-navy-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full bg-navy-900 border border-navy-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full bg-navy-900 border border-navy-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-gray-400 text-sm">
          Already have an account? <Link to="/login" className="text-teal-500 hover:text-teal-400">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
