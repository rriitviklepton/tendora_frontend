import React, { useState, useEffect } from 'react';
import { Upload, FileType, Loader, AlertCircle, CheckCircle, Building, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Section {
  name: string;
  status: 'success' | 'failed' | 'analyzing' | null;
  order: number;
}

interface SectionStatus {
  status: 'success';
  tender_id: number;
  tender_name: string;
  sections: {
    [key: string]: Section;
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
  const [orgName, setOrgName] = useState('lepton');
  const [sectionStatus, setSectionStatus] = useState<SectionStatus | null>(null);
  const [statusInterval, setStatusInterval] = useState<number | null>(null);

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
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    if (!orgName.trim()) {
      setUploadStatus({
        status: 'error',
        message: 'Please enter an organization name'
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
      formData.append('org_name', orgName.trim());
      
      const response = await fetch('http://127.0.0.1:8000/upload-tender', {
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
      }, 15000);
      
      setStatusInterval(interval);

      // Now make the analyze request
      const analyzeUrl = `http://127.0.0.1:8000/analyze-tender?tender_id=${tenderId}&user_id=123&org_name=${encodeURIComponent(orgName.trim())}`;
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
      const statusUrl = `http://127.0.0.1:8000/section-status?tender_id=${tenderId}&user_id=123&org_name=${encodeURIComponent(orgName.trim())}`;
      console.log('Making request to:', statusUrl);
      
      const response = await fetch(statusUrl);
      console.log('Got response:', response.status);
      
      const data = await response.json();
      console.log('Received data:', data);

      setSectionStatus(data);

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
    } catch (error) {
      console.error('Error in fetchSectionStatus:', error);
    }
  };

  return (
    <div 
      className={`
        w-full px-6 py-10 border-2 border-dashed rounded-lg text-center
        ${isDragging 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }
        transition-colors duration-200
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader size={40} className="text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-gray-600 mb-1">
            Uploading tender document...
          </p>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse"></div>
          </div>
        </div>
      ) : isAnalyzing ? (
        sectionStatus ? (
          <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
            <Loader size={40} className="text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-gray-600 mb-2">
              Analyzing tender document... ({sectionStatus.progress.completion_percentage.toFixed(1)}% complete)
            </p>
            {sectionStatus.sections['tender_summary']?.status === 'success' && (
              <button
                onClick={() => navigate(`/tender/${sectionStatus.tender_id}`, {
                  state: { org_name: orgName.trim() }
                })}
                className="mx-4 px-4 py-2 mb-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>View Tender</span>
                <ArrowRight size={16} />
              </button>
            )}
            
            <div className="w-full space-y-2">
              {Object.entries(sectionStatus.sections)
                .sort((a, b) => a[1].order - b[1].order)
                .map(([key, section]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{section.name}</span>
                    <div className="flex items-center">
                      {section.status === 'analyzing' && (
                        <Loader size={16} className="text-blue-500 animate-spin" />
                      )}
                      {section.status === 'success' && (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                      {section.status === 'failed' && (
                        <XCircle size={16} className="text-red-500" />
                      )}
                      {section.status === null && (
                        <div className="w-4 h-4 rounded-full bg-gray-200" />
                      )}
                    </div>
                  </div>
                ))}
            </div>
            
            <div className="w-full mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${sectionStatus.progress.completion_percentage}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              {sectionStatus.progress.completed} of {sectionStatus.progress.total} sections completed
              {sectionStatus.progress.failed > 0 && ` (${sectionStatus.progress.failed} failed)`}
            </p>

            {/* Add View Tender button when tender_summary is successful */}
            
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader size={40} className="text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-gray-600 mb-1">
              Starting analysis...
            </p>
            <p className="text-xs text-gray-500 mt-2">This may take a few minutes</p>
          </div>
        )
      ) : uploadStatus ? (
        <div className="flex flex-col items-center">
          {uploadStatus.status === 'success' ? (
            <>
              <CheckCircle size={40} className="text-green-500 mb-3" />
              <p className="text-sm text-gray-600 mb-4">{uploadStatus.message}</p>
            </>
          ) : (
            <>
              <AlertCircle size={40} className="text-red-500 mb-3" />
              <p className="text-sm text-red-600 mb-4">{uploadStatus.message}</p>
              <button
                onClick={() => setUploadStatus(null)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors"
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
          
          {/* Organization Input */}
          <div className="mb-6">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center text-sm text-gray-700">
                <Building size={16} className="mr-1" />
                <span>Organization</span>
              </div>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter Organization Name"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Drag and drop your tender file, or click to select
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <div className="flex items-center px-3 py-1 rounded-full bg-gray-200 text-xs text-gray-700">
              <FileType size={14} className="mr-1" />
              PDF only
            </div>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileInputChange}
            />
            <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors">
              Select File
            </span>
          </label>
        </>
      )}
    </div>
  );
};

export default UploadArea;