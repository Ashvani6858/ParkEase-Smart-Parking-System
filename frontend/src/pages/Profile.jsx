import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Profile Settings</h1>
      
      <div className="bg-navy-800 p-8 rounded-xl border border-navy-700">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-navy-700">
          <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-4xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
            <p className="text-gray-400">{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
            <div className="text-white text-lg">{user?.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Account Status</label>
            <div className="inline-block bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20">
              Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
