import React, { useState, useEffect } from 'react';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  tenderName?: string;
  tenderId?: number;
  sectionOptions?: { id: string; name: string }[];
  showTenderFields?: boolean;
  preselectedSection?: string;
  preselectedSubsection?: string;
}

const FEEDBACK_REASONS = [
  'Incomplete response',
  'Extra/unnecessary information',
  'Not accurate',
  'Not relevant to section',
  'Hard to understand',
  'Missing required details',
  'Formatting issues',
  'Other',
];

const SECTION_SUBSECTIONS: { [key: string]: string[] } = {
  'Tender Summary': ['None'],
  'Table of Contents': ['None'],
  'Scope of Work': [
    'Overall',
    'Project Overview',
    'Tasks & Activities',
    'Deliverables',
    'Timeline',
    'Location',
    'Resources',
    'Performance',
    'Training',
    'Support'
  ],
  'Evaluation Criteria': [
    'Overall',
    'Evaluation Methodology',
    'Evaluation Stages',
    'Technical Evaluation',
    'Financial Evaluation',
    'Composite Scoring',
    'Selection Method',
    'Specific Requirements',
    'Disqualification Criteria'
  ],
  'Eligibility': [
    'Overall',
    'Legal',
    'Technical',
    'Financial',
    'Statutory',
    'Consortium',
    'Disqualification'
  ],
  'Bill of Quantities': ['None'],
  'Contract Conditions': ['None'],
  'Compliance Requirements': ['None'],
  'Important Dates': ['None'],
  'Submission Requirements': ['None']
};

const FeedbackForm: React.FC<FeedbackFormProps> = ({ isOpen, onClose, tenderName, tenderId, sectionOptions, showTenderFields, preselectedSection, preselectedSubsection }) => {
  const [name, setName] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedSection, setSelectedSection] = useState(preselectedSection || '');
  const [selectedSubsection, setSelectedSubsection] = useState(preselectedSubsection || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset all form states
  const resetForm = () => {
    setName('');
    setSelectedReasons([]);
    setCustomMessage('');
    setIsSubmitting(false);
    setError(null);
    setSuccessMessage(null);
    // Unconditionally reset section and subsection to empty
    setSelectedSection('');
    setSelectedSubsection('');
  };

  // Add console logs for debugging
  useEffect(() => {
    console.log('FeedbackForm mounted/updated');
    console.log('Props: preselectedSection', preselectedSection);
    console.log('State: selectedSection (initial)', selectedSection);
    console.log('Props: tenderName (on mount/update)', tenderName);
    console.log('Props: tenderId (on mount/update)', tenderId);
    console.log('Props: showTenderFields (on mount/update)', showTenderFields);
  }, [preselectedSection, tenderName, tenderId, showTenderFields]);

  // Update selectedSection and selectedSubsection when preselectedSection changes
  useEffect(() => {
    setSelectedSection(preselectedSection || '');

    // If a preselected section is provided and it exists in our mapping
    if (preselectedSection && SECTION_SUBSECTIONS[preselectedSection]) {
      // Check if a preselected subsection is provided and is valid for the current section
      if (preselectedSubsection && SECTION_SUBSECTIONS[preselectedSection].includes(preselectedSubsection)) {
        setSelectedSubsection(preselectedSubsection);
      } else if (SECTION_SUBSECTIONS[preselectedSection][0] !== 'None') {
        // If no valid preselected subsection, default to 'Overall' if available
        setSelectedSubsection('Overall');
      } else {
        // If the section has no subsections other than 'None', set to empty
        setSelectedSubsection('');
      }
    } else {
      // If no preselected section, or section is invalid, reset both
      setSelectedSection('');
      setSelectedSubsection('');
    }
  }, [preselectedSection, preselectedSubsection]);

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSection = e.target.value;
    setSelectedSection(newSection);
    // Reset subsection when section changes
    if (SECTION_SUBSECTIONS[newSection] && SECTION_SUBSECTIONS[newSection][0] !== 'None') {
      setSelectedSubsection('Overall');
    } else {
      setSelectedSubsection('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    console.log('Submitting feedback with:');
    console.log('tenderName (on submit):', tenderName);
    console.log('tenderId (on submit):', tenderId);
    console.log('showTenderFields (on submit):', showTenderFields);
    console.log('name:', name);
    console.log('selectedReasons:', selectedReasons);
    console.log('customMessage:', customMessage);
    console.log('selectedSection:', selectedSection);
    console.log('selectedSubsection:', selectedSubsection);

    try {
      const formData = new FormData();
      
      // Required fields
      if (showTenderFields) {
        if (!tenderName || tenderId === undefined) {
          throw new Error('Tender name and ID are required');
        }
        formData.append('tender_name', tenderName);
        formData.append('tender_id', tenderId.toString());
      }

      // Optional fields
      if (name) formData.append('username', name);
      if (selectedSection) formData.append('section', selectedSection);
      if (selectedSubsection) formData.append('subsection', selectedSubsection);
      if (selectedReasons.length > 0) formData.append('feedback_reason', selectedReasons.join(', '));
      if (customMessage) formData.append('specific_details', customMessage);

      const response = await fetch('https://api.smarttender.rio.software/api/submit-feedback', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit feedback');
      }

      const result = await response.json();
      console.log('Feedback submitted successfully:', result);
      setSuccessMessage('Feedback submitted successfully!');
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting feedback');
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Provide additional feedback</h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Your name"
              required
            />
          </div>

          {showTenderFields && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tender Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tenderName}
                  disabled
                  className="w-full p-2 border border-gray-200 rounded-md bg-gray-100 text-gray-700"
                />
              </div>
              {sectionOptions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={selectedSection}
                    onChange={handleSectionChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Overall">Overall</option>
                    {sectionOptions.map((section) => (
                      <option key={section.id} value={section.name}>{section.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {selectedSection && SECTION_SUBSECTIONS[selectedSection] && SECTION_SUBSECTIONS[selectedSection][0] !== 'None' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subsection</label>
                  <select
                    value={selectedSubsection}
                    onChange={(e) => setSelectedSubsection(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {SECTION_SUBSECTIONS[selectedSection].map((subsection) => (
                      <option key={subsection} value={subsection}>{subsection}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Reason</label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_REASONS.map((reason) => (
                <button
                  type="button"
                  key={reason}
                  className={`px-3 py-1 rounded-full border text-sm ${selectedReasons.includes(reason) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300'} focus:outline-none`}
                  onClick={() => handleReasonToggle(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">(Optional) Feel free to add specific details</label>
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Add specific details..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm; 