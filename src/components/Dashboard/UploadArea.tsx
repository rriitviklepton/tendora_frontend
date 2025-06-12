import React, { useState, useEffect } from 'react';
import { Upload, FileType, Loader, AlertCircle, CheckCircle, Building, XCircle, ArrowRight, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Section {
  name: string;
  status: 'success' | 'failed' | 'analyzing' | null;
  order: number;
}

interface StageStatus {
  status: 'success';
  tender_id: number;
  tender_name: string;
  stages: {
    stage_1: 'success' | 'failed' | 'analyzing' | null;
    stage_2: 'success' | 'failed' | 'analyzing' | null;
  };
}

interface SectionStatus {
  status: 'success';
  tender_id: number;
  tender_name: string;
  sections: {
    [key: string]: 'success' | 'failed' | 'analyzing' | null;
  };
  progress: {
    total: number;
    completed: number;
    failed: number;
    analyzing: number;
    not_started: number;
    completion_percentage: number;
  };
}

interface UploadResponse {
  status: 'success' | 'error';
  message?: string;
  tender_id?: number;
  tender_name?: string;
  tender_slug_name?: string;
}

const UploadArea = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadResponse | null>(null);
  const [orgName] = useState('lepton');
  const [userName, setUserName] = useState('');
  const [ocrRequired, setOcrRequired] = useState(false);
  const [sectionStatus, setSectionStatus] = useState<SectionStatus | null>(null);
  const [statusInterval, setStatusInterval] = useState<number | null>(null);
  const [stageStatus, setStageStatus] = useState<StageStatus | null>(null);

  // Mapping for section names
  const sectionNameMap: { [key: string]: string } = {
    tender_summary: "Tender Summary",
    table_of_contents: "Table of Contents",
    scope_of_work: "Scope of Work",
    evaluation_criteria: "Evaluation Criteria",
    eligibility_conditions: "Eligibility Conditions",
    compliance_requirements: "Compliance Requirements",
    bill_of_quantities: "Bill of Quantities",
    important_dates: "Important Dates",
    annexures_attachments: "Annexures and Attachments",
    // Add other sections as needed
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (statusInterval) {
        console.log('Cleaning up status polling interval');
        window.clearInterval(statusInterval);
      }
    };
  }, [statusInterval]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!userName.trim()) {
      setUploadStatus({
        status: 'error',
        message: 'Please enter your name before uploading a file.'
      });
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        await handleFileUpload(file);
      } else {
        setUploadStatus({
          status: 'error',
          message: 'Please upload a PDF file'
        });
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userName.trim()) {
      setUploadStatus({
        status: 'error',
        message: 'Please enter your name before selecting a file.'
      });
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    if (!userName.trim()) {
      setUploadStatus({
        status: 'error',
        message: 'Please enter your name'
      });
      return;
    }

    setIsUploading(true);
    setIsAnalyzing(false);
    setUploadStatus(null);
    setSectionStatus(null); // Reset section status
    
    try {
      console.log('Starting file upload...');
      const formData = new FormData();
      formData.append('pdf_file', file);
      formData.append('user_id', '123');
      formData.append('user_name', userName.trim());
      formData.append('org_name', orgName.trim());
      formData.append('ocr_required', ocrRequired.toString());
      
      const response = await fetch('https://api.smarttender.rio.software/api/upload-tender', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
      
      const result = await response.json();
      console.log('Upload successful:', result);
      
      setUploadStatus({
        status: 'success',
        message: 'File uploaded successfully',
        tender_id: result.tender_id,
        tender_name: result.tender_name,
        tender_slug_name: result.tender_slug_name
      });

      setIsUploading(false);
      
      // Start analysis if we have a tender ID
      if (result.tender_id) {
        console.log('Starting analysis for tender ID:', result.tender_id);
        await handleAnalyze(result.tender_id);
      } else {
        console.error('No tender ID received from upload');
      }
      
    } catch (error) {
      console.error('Error uploading tender:', error);
      setUploadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload file'
      });
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async (tenderId: number) => {
    console.log('handleAnalyze called with tenderId:', tenderId);
    setIsAnalyzing(true);
    
    try {
      // Start polling immediately before making analyze request
      console.log('Starting status polling...');
      
      // Immediate first fetch
      console.log('Making initial status fetch...');
      fetchSectionStatus(tenderId);
      
      // Set up polling
      console.log('Setting up polling interval...');
      const interval = window.setInterval(() => {
        console.log('Polling iteration triggered');
        fetchSectionStatus(tenderId);
      }, 7000);
      
      setStatusInterval(interval);

      // Now make the analyze request
      const analyzeUrl = `https://api.smarttender.rio.software/tenderanalysis/analyze-tender?tender_id=${tenderId}&user_id=123&org_name=${encodeURIComponent(orgName.trim())}`;
      console.log('Sending analyze request to:', analyzeUrl);
      
      // Fire and forget the analyze request
      fetch(analyzeUrl)
        .then(response => response.json())
        .then(analyzeData => {
          console.log('Analyze response:', analyzeData);
          if (!analyzeData || analyzeData.status !== 'success') {
            throw new Error('Failed to analyze tender');
          }
        })
        .catch(error => {
          console.error('Error in analyze request:', error);
          setUploadStatus({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to analyze tender'
          });
          setIsAnalyzing(false);
          if (statusInterval) {
            window.clearInterval(statusInterval);
            setStatusInterval(null);
          }
        });
      
    } catch (error) {
      console.error('Error in handleAnalyze:', error);
      setUploadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to analyze tender'
      });
      setIsAnalyzing(false);
      if (statusInterval) {
        window.clearInterval(statusInterval);
        setStatusInterval(null);
      }
    }
  };

  const fetchSectionStatus = async (tenderId: number) => {
    console.log('fetchSectionStatus executing for tenderId:', tenderId);
    
    try {
      // Fetch stage status first
      const stageStatusUrl = `https://api.smarttender.rio.software/api/stage-status?tender_id=${tenderId}&user_id=123&org_name=${encodeURIComponent(orgName.trim())}`;
      const stageResponse = await fetch(stageStatusUrl);
      const stageData = await stageResponse.json();
      
      if (stageData && stageData.status === 'success') {
        setStageStatus(stageData as StageStatus);
        
        // Only fetch section status if stage 2 is complete
        if (stageData.stages.stage_2 === 'success') {
          const statusUrl = `https://api.smarttender.rio.software/api/section-status?tender_id=${tenderId}&user_id=123&org_name=${encodeURIComponent(orgName.trim())}`;
          console.log('Making request to:', statusUrl);
          
          const response = await fetch(statusUrl);
          console.log('Got response:', response.status);
          
          const data = await response.json();
          console.log('Received data:', data);
          console.log('Sections data:', data.sections);

          // Validate the data structure
          if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format');
          }

          // Check required fields
          if (!data.status || !data.tender_id || !data.tender_name || !data.sections || !data.progress) {
            throw new Error('Missing required fields in response');
          }

          // Validate sections structure
          if (typeof data.sections !== 'object') {
            throw new Error('Invalid sections format');
          }

          // Validate progress structure
          if (!data.progress.total || typeof data.progress.completion_percentage !== 'number') {
            throw new Error('Invalid progress format');
          }

          setSectionStatus(data as SectionStatus);

          if (data.sections) {
            const isComplete = Object.values(data.sections).every(
              (section: any) => section.status === 'success' || section.status === 'failed'
            );

            if (isComplete) {
              console.log('Analysis complete');
              setIsAnalyzing(false);
              if (statusInterval) {
                window.clearInterval(statusInterval);
                setStatusInterval(null);
              }
              navigate(`/tender/${tenderId}`, {
                state: { org_name: orgName.trim() }
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchSectionStatus:', error);
      // Set error state
      setUploadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch status'
      });
      setIsAnalyzing(false);
      if (statusInterval) {
        window.clearInterval(statusInterval);
        setStatusInterval(null);
      }
    }
  };

  return (
    <div 
      className={`
        w-full px-6 py-10 border-2 border-dashed rounded-lg text-center bg-blue-50
        ${isDragging 
          ? 'border-blue-400 bg-gradient-to-r from-blue-100 to-indigo-200' 
          : 'border-gray-200 hover:border-blue-300'
        }
        transition-colors duration-200
      `}
      onDragOver={userName.trim() ? handleDragOver : undefined}
      onDragLeave={userName.trim() ? handleDragLeave : undefined}
      onDrop={userName.trim() ? handleDrop : undefined}
    >
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader size={40} className="text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-gray-700 mb-1">
            Uploading tender document...
          </p>
          <div className="w-48 h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 animate-pulse"></div>
          </div>
        </div>
      ) : isAnalyzing ? (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
          <Loader size={40} className="text-blue-500 animate-spin mb-3" />

          {/* Stage Status Display - Always show stages 1 and 2 */}
          {stageStatus ? (
            <div className="w-full mb-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Stage 1: Document Evaluation</span>
                  {stageStatus.stages.stage_1 === null ? (
                    <span className="text-xs text-gray-500">Waiting to break down tender into smaller pieces</span>
                  ) : stageStatus.stages.stage_1 === 'analyzing' ? (
                    <span className="text-xs text-blue-500">Breaking down tender into smaller pieces...</span>
                  ) : stageStatus.stages.stage_1 === 'success' ? (
                    <span className="text-xs text-gray-500">Tender broken down into smaller pieces</span>
                  ) : (
                    <span className="text-xs text-red-500">Failed to break down tender into smaller pieces</span>
                  )}
                </div>
                <div className="flex items-center">
                  {stageStatus.stages.stage_1 === null || stageStatus.stages.stage_1 === 'analyzing' ? (
                    <div className="flex items-center text-blue-500">
                      <span className="text-xs mr-2">Processing</span>
                      <Loader size={16} className="animate-spin" />
                    </div>
                  ) : stageStatus.stages.stage_1 === 'success' ? (
                    <div className="flex items-center text-green-500">
                      <span className="text-xs mr-2">Complete</span>
                      <CheckCircle size={16} />
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500">
                      <span className="text-xs mr-2">Failed</span>
                      <XCircle size={16} />
                    </div>
                  )}
                </div>
              </div>

              {/* Stage 2: Content Analysis - Only show if Stage 1 is complete */}
              {stageStatus.stages.stage_1 === 'success' && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Stage 2: Content Analysis</span>
                    {stageStatus.stages.stage_2 === null ? (
                      <span className="text-xs text-gray-500">Waiting to identify and categorize information </span>
                    ) : stageStatus.stages.stage_2 === 'analyzing' ? (
                      <span className="text-xs text-blue-500">Identifying and categorizing information...</span>
                    ) : stageStatus.stages.stage_2 === 'success' ? (
                      <span className="text-xs text-gray-500">Information categorized into relevant sections</span>
                    ) : (
                      <span className="text-xs text-red-500">Failed to categorize information into relevant sections</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {stageStatus.stages.stage_2 === null || stageStatus.stages.stage_2 === 'analyzing' ? (
                      <div className="flex items-center text-blue-500">
                        <span className="text-xs mr-2">Processing</span>
                        <Loader size={16} className="animate-spin" />
                      </div>
                    ) : stageStatus.stages.stage_2 === 'success' ? (
                      <div className="flex items-center text-green-500">
                        <span className="text-xs mr-2">Complete</span>
                        <CheckCircle size={16} />
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500">
                        <span className="text-xs mr-2">Failed</span>
                        <XCircle size={16} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stage 3: Section Status - Only show if stage 2 is complete */}
              {stageStatus.stages.stage_2 === 'success' && sectionStatus && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Stage 3: Final Processing</span>
                    <span className="text-xs text-gray-500">Converting analyzed data into human-readable format</span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center text-blue-500">
                      <span className="text-xs mr-2">
                        {sectionStatus.progress.completion_percentage.toFixed(1)}% Complete
                      </span>
                      <Loader size={16} className="animate-spin" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-700 mb-2">Initializing analysis...</p>
          )}

          {/* Section Status Details - Only show if stage 2 is complete */}
          {stageStatus?.stages.stage_2 === 'success' && sectionStatus && (
            <div className="w-full space-y-2">
              <p className="text-sm text-gray-600 mb-2">Processing individual sections:</p>
              {Object.entries(sectionStatus.sections)
                .map(([key, sectionStatusValue]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm">
                    <span className="text-sm text-gray-700">{sectionNameMap[key] || key}</span>
                    <div className="flex items-center">
                      {sectionStatusValue === 'analyzing' ? (
                        <div className="flex items-center text-blue-500">
                          <span className="text-xs mr-2">Processing</span>
                          <Loader size={16} className="animate-spin" />
                        </div>
                      ) : sectionStatusValue === 'success' ? (
                        <div className="flex items-center text-green-500">
                          <span className="text-xs mr-2">Complete</span>
                          <CheckCircle size={16} />
                        </div>
                      ) : sectionStatusValue === 'failed' ? (
                        <div className="flex items-center text-red-500">
                          <span className="text-xs mr-2">Failed</span>
                          <XCircle size={16} />
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <span className="text-xs mr-2">Pending</span>
                          <div className="w-4 h-4 rounded-full bg-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
          
          <div className="w-full mt-4 bg-blue-100 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${sectionStatus?.progress.completion_percentage || 0}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-600 mt-2">
            {sectionStatus ? 
              `${sectionStatus.progress.completed} of ${sectionStatus.progress.total} sections completed` +
              (sectionStatus.progress.failed > 0 ? ` (${sectionStatus.progress.failed} failed)` : '')
              : ''}
          </p>

          {sectionStatus?.sections?.tender_summary === 'success' && (
            <button
              onClick={() => navigate(`/tender/${sectionStatus.tender_id}`, {
                state: { org_name: orgName.trim() }
              })}
              className="mx-4 px-4 py-2 mb-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span>View Tender</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      ) : uploadStatus ? (
        <div className="flex flex-col items-center">
          {uploadStatus.status === 'success' ? (
            <>
              <CheckCircle size={40} className="text-green-500 mb-3" />
              <p className="text-sm text-gray-700 mb-4">{uploadStatus.message}</p>
            </>
          ) : (
            <>
              <AlertCircle size={40} className="text-red-500 mb-3" />
              <p className="text-sm text-red-600 mb-4">{uploadStatus.message}</p>
              <button
                onClick={() => setUploadStatus(null)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Upload size={28} className="text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-1">Upload Tender Document</h3>
          
          {/* User Name Input */}
          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center text-sm text-gray-700 mr-2 w-32 justify-end">
              <span>Your Name</span>
            </div>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter Your Name"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white text-gray-800"
              required
            />
          </div>

          {/* Organization Input */}
          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center text-sm text-gray-700 mr-2 w-32 justify-end">
              <Building size={16} className="mr-1" />
              <span>Organization</span>
            </div>
            <input
              type="text"
              value={orgName}
              readOnly
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* OCR Checkbox */}
          <div className="mb-6">
            <label className="flex items-center justify-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ocrRequired}
                onChange={(e) => setOcrRequired(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500 bg-white"
              />
              <div className="flex items-center text-sm text-gray-700">
                <Scan size={16} className="mr-1" />
                <span>Is this a scanned tender (requires image to text processing)</span>
              </div>
            </label>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Drag and drop your tender file, or click to select
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <div className="flex items-center px-3 py-1 rounded-full bg-blue-100 text-xs text-blue-700">
              <FileType size={14} className="mr-1" />
              PDF only
            </div>
          </div>
          <label 
            className={`cursor-pointer ${!userName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileInputChange}
              disabled={!userName.trim()}
            />
            <span 
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 shadow-sm transition-colors
                ${userName.trim() ? 'hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' : 'opacity-50 cursor-not-allowed'}
              `}
            >
              Select File
            </span>
          </label>
        </>
      )}
    </div>
  );
};

export default UploadArea;