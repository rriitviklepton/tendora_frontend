import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import FeedbackForm from './FeedbackForm';
import { useTenderContext } from '../../context/TenderContext';
import { ThumbsDown } from 'lucide-react';

// Section options for tender routes (should match TABS in TenderSummary)
const SECTION_OPTIONS = [
  { id: 'table_of_contents', name: 'Table of Contents' },
  { id: 'scope', name: 'Scope of Work' },
  { id: 'evaluation', name: 'Evaluation Criteria' },
  { id: 'eligibility', name: 'Eligibility' },
  { id: 'boq', name: 'Bill of Quantities' },
  { id: 'conditions', name: 'Contract Conditions' },
  { id: 'compliance', name: 'Compliance' },
  { id: 'dates', name: 'Key Dates' },
  { id: 'submission', name: 'Submission' },
];

const FeedbackButton: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tenderInfo, setTenderInfo] = useState<{ name: string; id: number | undefined }>({ name: '', id: undefined });
  const location = useLocation();
  const params = useParams();
  const { getTenderById } = useTenderContext();

  // Detect if on tender route
  const tenderRouteMatch = /^\/tender\/(\w+)/.exec(location.pathname);
  const isTenderRoute = Boolean(tenderRouteMatch);
  const tenderId = tenderRouteMatch ? tenderRouteMatch[1] : undefined;

  // Get tender name and ID from context if available
  useEffect(() => {
    if (isTenderRoute && tenderId) {
      const tender = getTenderById(tenderId);
      if (tender) {
        setTenderInfo({
          name: tender.title || '',
          id: tender.id ? parseInt(tender.id, 10) : undefined
        });
      }
    }
  }, [isTenderRoute, tenderId, getTenderById]);

  return (
    <>
      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors duration-200 z-40"
        aria-label="Send Feedback"
      >
        <ThumbsDown className="h-6 w-6" />
      </button>

      <FeedbackForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        tenderName={isTenderRoute ? tenderInfo.name : undefined}
        tenderId={isTenderRoute ? tenderInfo.id : undefined}
        sectionOptions={isTenderRoute ? SECTION_OPTIONS : undefined}
        showTenderFields={isTenderRoute}
      />
    </>
  );
};

export default FeedbackButton; 