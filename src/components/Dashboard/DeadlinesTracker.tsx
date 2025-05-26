import React, { useEffect, useState } from 'react';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';
import { DeadlineInfo } from '../../types';

const DeadlinesTracker = () => {
  const [deadlines, setDeadlines] = useState<DeadlineInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const response = await fetch('https://api.smarttender.rio.software/api/tender-deadlines');
        if (!response.ok) {
          throw new Error('Failed to fetch deadlines');
        }
        const data = await response.json();
        setDeadlines(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deadlines');
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlines();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
          <Calendar size={20} className="mr-2 text-blue-600" />
          Upcoming Deadlines
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
          <Calendar size={20} className="mr-2 text-blue-600" />
          Upcoming Deadlines
        </h3>
        <div className="text-center py-4 text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
          <Calendar size={20} className="mr-2 text-blue-600" />
          Upcoming Deadlines
        </h3>
        <div className="text-center py-6 text-gray-500">
          <p>No upcoming deadlines</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
        <Calendar size={20} className="mr-2 text-blue-600" />
        Upcoming Deadlines
      </h3>
      <div className="space-y-3">
        {deadlines.map((deadline, index) => (
          <div 
            key={index}
            className={`p-3 rounded-md ${
              deadline.status_color === 'red' ? 'bg-red-50 border border-red-100' :
              deadline.status_color === 'yellow' ? 'bg-amber-50 border border-amber-100' :
              'bg-green-50 border border-green-100'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-medium text-gray-900">{deadline.tender_name}</h4>
                <p className="text-sm font-medium text-gray-700">{deadline.event}</p>
                <p className="text-sm text-gray-600">{deadline.task_message}</p>
              </div>
              {(deadline.status_color === 'red' || deadline.status_color === 'yellow') && (
                <AlertTriangle 
                  size={18} 
                  className={deadline.status_color === 'red' ? 'text-red-500' : 'text-amber-500'} 
                />
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Clock size={16} className="mr-1 text-gray-400" />
                <span className={`font-medium ${
                  deadline.status_color === 'red' ? 'text-red-600' :
                  deadline.status_color === 'yellow' ? 'text-amber-600' :
                  'text-green-600'
                }`}>
                  {deadline.days_remaining === null 
                    ? 'Deadline passed'
                    : `${deadline.days_remaining} days remaining`}
                </span>
              </div>
              <span className="text-gray-500">
                Due: {formatDate(deadline.deadline_date)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeadlinesTracker;