import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Tender } from '../../types';
import { formatCurrency, getTimeRemaining } from '../../utils/helpers';
import StatusBadge from '../UI/StatusBadge';
import ProgressSteps from '../UI/ProgressSteps';

interface TenderCardProps {
  tender: Tender;
}

const TenderCard = ({ tender }: TenderCardProps) => {
  const { id, title, department, org_name, status, deadline, tags, aiConfidence, estimatedValue, progress } = tender;
  
  const timeRemaining = getTimeRemaining(deadline);
  const isExpired = new Date(deadline) < new Date();
  
  return (
    <Link 
      to={`/tender/${id}`}
      state={{ org_name: org_name }}
      className="block bg-white to-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{department}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index} 
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
              +{tags.length - 3} more
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm">
            <Clock size={16} className="mr-2 text-gray-400" />
            {isExpired ? (
              <span className="text-red-500 font-medium">Expired</span>
            ) : (
              <span className={`${timeRemaining.days < 3 ? 'text-amber-500' : 'text-gray-600'} font-medium`}>
                {timeRemaining.days > 0 
                  ? `${timeRemaining.days} days remaining` 
                  : `${timeRemaining.hours} hours remaining`}
              </span>
            )}
          </div>
          
          <div 
            className="flex items-center text-sm"
            title="AI confidence score for data extraction"
          >
            <div className="mr-2 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm" 
              style={{
                backgroundColor: `rgba(${aiConfidence >= 90 ? '16, 185, 129' : aiConfidence >= 70 ? '245, 158, 11' : '239, 68, 68'}, 0.15)`,
                color: aiConfidence >= 90 ? '#059669' : aiConfidence >= 70 ? '#D97706' : '#DC2626'
              }}
            >
              {aiConfidence}%
            </div>
            {estimatedValue && (
              <span className="text-gray-700 font-medium">
                {formatCurrency(estimatedValue)}
              </span>
            )}
          </div>
        </div>
        
        <ProgressSteps progress={progress} />
      </div>
    </Link>
  );
};

export default TenderCard;