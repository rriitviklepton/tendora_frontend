import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, X, Eye } from 'lucide-react';

const alerts = [
  {
    id: 1,
    type: 'warning',
    title: 'Missing MSME Certificate',
    description: 'Healthcare Management System tender requires MSME certificate',
    tender: 'Healthcare Management System',
  },
  {
    id: 2,
    type: 'success',
    title: 'All documents verified',
    description: 'Corporate ERP Implementation tender has all required documents',
    tender: 'Corporate ERP Implementation',
  },
  {
    id: 3,
    type: 'info',
    title: 'Pre-bid meeting tomorrow',
    description: 'Smart City IoT Infrastructure has a pre-bid meeting scheduled',
    tender: 'Smart City IoT Infrastructure',
  },
  {
    id: 4,
    type: 'error',
    title: 'Deadline approaching',
    description: 'Smart City IoT Infrastructure tender deadline in 2 days',
    tender: 'Smart City IoT Infrastructure',
  },
];

const AIAlerts = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
        <AlertCircle size={20} className="mr-2 text-blue-600" />
        AI Alerts
      </h3>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className={`
              p-3 rounded-md border 
              ${alert.type === 'warning' ? 'bg-amber-50 border-amber-100' : 
                alert.type === 'success' ? 'bg-green-50 border-green-100' :
                alert.type === 'error' ? 'bg-red-50 border-red-100' :
                'bg-blue-50 border-blue-100'}
            `}
          >
            <div className="flex justify-between">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  {alert.type === 'warning' && (
                    <AlertTriangle size={16} className="text-amber-500" />
                  )}
                  {alert.type === 'success' && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                  {alert.type === 'error' && (
                    <AlertTriangle size={16} className="text-red-500" />
                  )}
                  {alert.type === 'info' && (
                    <AlertCircle size={16} className="text-blue-500" />
                  )}
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                  <p className="text-xs text-gray-600">{alert.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Tender: {alert.tender}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button 
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  title="View details"
                >
                  <Eye size={14} className="text-gray-500" />
                </button>
                <button 
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  title="Dismiss"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIAlerts;