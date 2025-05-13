import React from 'react';
import { useTenderContext } from '../../context/TenderContext';
import TenderCard from '../../components/Dashboard/TenderCard';
import UploadArea from '../../components/Dashboard/UploadArea';
import DeadlinesTracker from '../../components/Dashboard/DeadlinesTracker';
import AIAlerts from '../../components/Dashboard/AIAlerts';

const Dashboard = () => {
  const { tenders, loading, error } = useTenderContext();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back to your tender management dashboard.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <UploadArea />
        </div>
        <div className="space-y-6">
          <DeadlinesTracker />
          {/* <AIAlerts /> */}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Tenders</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading tenders: {error}</p>
          </div>
        ) : tenders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No recent tenders available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenders.map((tender) => (
              <TenderCard key={tender.id} tender={tender} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;