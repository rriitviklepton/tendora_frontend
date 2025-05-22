import React, { useState, useEffect } from 'react';
import { useTenderContext } from '../../context/TenderContext';
import { 
  FileCheck, 
  AlertTriangle, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Info, 
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  X
} from 'lucide-react';
import { Tender } from '../../types';

interface Document {
  file_id: string;
  filename: string;
  type: string;
  size: number;
  timestamp: string;
  category: string;
  tender_id?: number;
}

interface RequiredDocument {
  nameNumber: string;
  purposeDescription: string;
  formatSpecificInstructions: string;
  submissionNote: string;
  selectedDocument?: Document;
}

interface UploadedDocuments {
  tender_id: number;
  uploaded_files: Record<number, string>;
}

const ICON_SIZE = 24;

interface DocumentExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onSelect: (document: Document) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  selectedTenderId: string;
}

const DocumentExplorerModal: React.FC<DocumentExplorerModalProps> = ({
  isOpen,
  onClose,
  documents,
  onSelect,
  onUpload,
  uploading,
  selectedTenderId
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['general', 'specific']));
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const filteredDocuments = (category: 'general' | 'specific') => {
    return documents.filter(doc => {
      const matchesCategory = category === 'general' 
        ? doc.category === 'general'
        : doc.tender_id?.toString() === selectedTenderId;
      const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl flex flex-col" style={{ height: '80vh' }}>
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Select or Upload Document</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Search Bar - Fixed below header */}
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* General Documents */}
            <div className="mb-4">
              <div 
                className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-50"
                onClick={() => toggleFolder('general')}
              >
                {expandedFolders.has('general') ? (
                  <ChevronDown size={ICON_SIZE} className="text-gray-400" />
                ) : (
                  <ChevronRight size={ICON_SIZE} className="text-gray-400" />
                )}
                <Folder size={ICON_SIZE} className="mr-2 text-blue-600" />
                <span className="font-medium">General Documents</span>
              </div>
              {expandedFolders.has('general') && (
                <div className="ml-8 space-y-1">
                  {filteredDocuments('general').map(doc => (
                    <div
                      key={doc.file_id}
                      className="flex items-center p-2 rounded cursor-pointer hover:bg-blue-50"
                      onClick={() => onSelect(doc)}
                    >
                      <File size={ICON_SIZE - 4} className="mr-2 text-gray-400" />
                      <span className="text-sm">{doc.filename}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tender Documents */}
            <div>
              <div 
                className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-50"
                onClick={() => toggleFolder('specific')}
              >
                {expandedFolders.has('specific') ? (
                  <ChevronDown size={ICON_SIZE} className="text-gray-400" />
                ) : (
                  <ChevronRight size={ICON_SIZE} className="text-gray-400" />
                )}
                <Folder size={ICON_SIZE} className="mr-2 text-purple-600" />
                <span className="font-medium">Tender Documents</span>
              </div>
              {expandedFolders.has('specific') && (
                <div className="ml-8 space-y-1">
                  {filteredDocuments('specific').map(doc => (
                    <div
                      key={doc.file_id}
                      className="flex items-center p-2 rounded cursor-pointer hover:bg-blue-50"
                      onClick={() => onSelect(doc)}
                    >
                      <File size={ICON_SIZE - 4} className="mr-2 text-gray-400" />
                      <span className="text-sm">{doc.filename}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Select an existing document or upload a new one
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              id="modal-file-upload"
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <label
              htmlFor="modal-file-upload"
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              } shadow-sm transition-colors`}
            >
              <Upload size={16} className="mr-2" />
              {uploading ? 'Uploading...' : 'Upload New Document'}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const Submission = () => {
  const { allTenders, fetchAllTenders } = useTenderContext();
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState<number | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<number, string>>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });

  useEffect(() => {
    fetchDocuments();
    fetchAllTenders(1); // Fetch all tenders when component mounts
  }, []);

  useEffect(() => {
    if (allTenders.length > 0 && !selectedTender) {
      setSelectedTender(allTenders[0]);
    }
  }, [allTenders]);

  useEffect(() => {
    if (selectedTender?.id) {
      fetchUploadedDocuments(selectedTender.id);
    }
  }, [selectedTender]);

  useEffect(() => {
    if (selectedTender?.tenderInfo?.annexuresAttachmentsRequired) {
      setRequiredDocs(selectedTender.tenderInfo.annexuresAttachmentsRequired.map((doc, index) => {
        const documentId = uploadedDocuments[index];
        const selectedDoc = documentId ? documents.find(d => d.file_id === documentId) : undefined;
        
        return {
          nameNumber: doc.nameNumber || `Document ${index + 1}`,
          purposeDescription: doc.purposeDescription || 'No description provided',
          formatSpecificInstructions: doc.formatSpecificInstructions || 'No specific instructions',
          submissionNote: doc.submissionNote || 'No submission notes',
          selectedDocument: selectedDoc
        };
      }));
    } else {
      setRequiredDocs([]);
    }
  }, [selectedTender, uploadedDocuments, documents]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/files?user_id=123');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchUploadedDocuments = async (tenderId: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/tender-documents/${tenderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch uploaded documents');
      }
      const data = await response.json();
      setUploadedDocuments(data.uploaded_files || {});
    } catch (error) {
      console.error('Error fetching uploaded documents:', error);
    }
  };

  const updateUploadedDocuments = async (tenderId: string, documentIndex: number, documentId: string | null) => {
    try {
      const newUploadedFiles = { ...uploadedDocuments };
      
      if (documentId) {
        newUploadedFiles[documentIndex] = documentId;
      } else {
        delete newUploadedFiles[documentIndex];
      }

      const response = await fetch(`http://127.0.0.1:8000/tender-documents/${tenderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploaded_documents: newUploadedFiles
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update uploaded documents');
      }

      await fetchUploadedDocuments(tenderId);
    } catch (error) {
      console.error('Error updating uploaded documents:', error);
    }
  };

  const handleTenderChange = (tenderId: string) => {
    const tender = allTenders.find(t => t.id === tenderId);
    setSelectedTender(tender || null);
  };

  const handleDocumentSelect = async (docIndex: number, document: Document | undefined) => {
    if (!selectedTender) return;
    
    console.log('Selecting document:', document, 'for index:', docIndex);
    
    // Update the uploaded documents on the backend
    await updateUploadedDocuments(
      selectedTender.id,
      docIndex,
      document?.file_id || null
    );
    
    setRequiredDocs(prev => prev.map((doc, index) => 
      index === docIndex ? { ...doc, selectedDocument: document } : doc
    ));
    setOpenDropdown(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docIndex: number) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTender) {
      console.error('No file selected or no tender selected');
      return;
    }
    
    setUploading(docIndex);
    console.log('Uploading file:', file.name);

    try {
      const formData = new FormData();
      formData.append('upload', file);
      formData.append('filename', file.name);
      formData.append('type', file.type);
      formData.append('size', file.size.toString());
      formData.append('user', '123');
      formData.append('category', 'specific');
      formData.append('tender_id', selectedTender.id);

      console.log('Sending request to backend...');
      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const uploadedDoc = await response.json();
      console.log('Upload successful:', uploadedDoc);
      
      // Refresh the documents list
      await fetchDocuments();

      // Create a new document object with the uploaded file's information
      const newDocument: Document = {
        file_id: uploadedDoc.file_id,
        filename: file.name,
        type: file.type,
        size: file.size,
        timestamp: new Date().toISOString(),
        category: 'specific',
        tender_id: parseInt(selectedTender.id)
      };

      // Update the required docs with the new document
      await handleDocumentSelect(docIndex, newDocument);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const getRelevantDocuments = (category: 'general' | 'specific') => {
    return documents.filter(doc => 
      category === 'general' 
        ? doc.category === 'general'
        : doc.tender_id?.toString() === selectedTender?.id
    );
  };

  const documentChecklist = [
    { id: 1, name: 'Technical Proposal', status: 'complete', type: 'pdf' },
    { id: 2, name: 'Financial Bid', status: 'pending', type: 'excel' },
    { id: 3, name: 'Company Registration', status: 'complete', type: 'pdf' },
    { id: 4, name: 'Experience Certificates', status: 'complete', type: 'pdf' },
    { id: 5, name: 'Bank Guarantee', status: 'pending', type: 'pdf' },
  ];

  const complianceChecks = [
    { id: 1, name: 'Document Format Check', status: 'passed' },
    { id: 2, name: 'File Size Validation', status: 'passed' },
    { id: 3, name: 'Digital Signatures', status: 'failed' },
    { id: 4, name: 'Mandatory Fields', status: 'passed' },
    { id: 5, name: 'Technical Compliance', status: 'warning' },
  ];

  const handleGetAIRecommendation = async (docIndex: number) => {
    if (!selectedTender) return;
    
    setLoadingRecommendation(docIndex);
    
    try {
      const doc = requiredDocs[docIndex];
      
      // Create FormData object as the API expects form data
      const formData = new FormData();
      formData.append('tender_id', selectedTender.id);
      formData.append('document_number', doc.nameNumber);
      formData.append('purpose', doc.purposeDescription);
      formData.append('format_instructions', doc.formatSpecificInstructions);
      formData.append('submission_note', doc.submissionNote);

      const response = await fetch('http://127.0.0.1:8000/ai-recommend/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to get AI recommendation');
      }

      const recommendation = await response.json();
      
      if (recommendation.suggested_document_id) {
        // Find the suggested document in our documents list
        const suggestedDoc = documents.find(doc => doc.file_id === recommendation.suggested_document_id);
        if (suggestedDoc) {
          handleDocumentSelect(docIndex, suggestedDoc);
        } else {
          console.warn('Suggested document not found in available documents:', recommendation.suggested_document_id);
        }
      } else {
        // Show a message that no suitable document was found
        console.info('No suitable document found:', recommendation.message);
      }
    } catch (error) {
      console.error('Error getting AI recommendation:', error);
    } finally {
      setLoadingRecommendation(null);
    }
  };

  const handleModalSelect = (document: Document) => {
    if (modalOpen === null) {
      console.error('No document slot selected');
      return;
    }
    console.log('Modal select triggered for document:', document); // Debug log
    handleDocumentSelect(modalOpen, document);
    setModalOpen(null);
  };

  const handleModalUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (modalOpen === null) {
      console.error('No document slot selected for upload');
      return;
    }
    console.log('Modal upload triggered for index:', modalOpen); // Debug log
    await handleFileUpload(event, modalOpen);
    setModalOpen(null);
  };

  const handleBulkAIRecommendations = async () => {
    if (!selectedTender || bulkLoading) return;
    
    // Filter out indices of documents that don't have a selection yet
    const unselectedIndices = requiredDocs
      .map((doc, index) => ({ doc, index }))
      .filter(({ doc }) => !doc.selectedDocument)
      .map(({ index }) => index);

    if (unselectedIndices.length === 0) {
      console.log('All documents are already selected');
      return;
    }

    setBulkLoading(true);
    setBulkProgress({ completed: 0, total: unselectedIndices.length });
    
    try {
      // Create an array of promises for each unselected document
      const recommendationPromises = unselectedIndices.map(async (index) => {
        const doc = requiredDocs[index];
        const formData = new FormData();
        formData.append('tender_id', selectedTender.id);
        formData.append('document_number', doc.nameNumber);
        formData.append('purpose', doc.purposeDescription);
        formData.append('format_instructions', doc.formatSpecificInstructions);
        formData.append('submission_note', doc.submissionNote);

        const response = await fetch('http://127.0.0.1:8000/ai-recommend/', {
          method: 'POST',
          body: formData,
        });

        // Update progress after each request completes
        setBulkProgress(prev => ({ ...prev, completed: prev.completed + 1 }));

        if (!response.ok) {
          throw new Error(`Failed to get AI recommendation for document ${index + 1}`);
        }

        const recommendation = await response.json();
        return {
          index,
          recommendedDocId: recommendation.suggested_document_id
        };
      });

      // Wait for all recommendations to complete
      const results = await Promise.all(recommendationPromises);

      // Create a new object with all the updates
      const newUploadedFiles = { ...uploadedDocuments };
      
      // Process each recommendation
      results.forEach(({ index, recommendedDocId }) => {
        if (recommendedDocId) {
          newUploadedFiles[index] = recommendedDocId;
        }
      });

      // Update all documents at once on the backend
      const response = await fetch(`http://127.0.0.1:8000/tender-documents/${selectedTender.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploaded_documents: newUploadedFiles
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update uploaded documents');
      }

      // Refresh the uploaded documents
      await fetchUploadedDocuments(selectedTender.id);

    } catch (error) {
      console.error('Error in bulk AI recommendations:', error);
    } finally {
      setBulkLoading(false);
      setBulkProgress({ completed: 0, total: 0 });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Submission Requirements</h1>
        <p className="text-gray-600">Ensure all required documents are uploaded and validated before submission.</p>
      </div>

      {/* Tender Selection */}
      <div className="mb-8">
        <label htmlFor="tender" className="block text-sm font-medium text-gray-700 mb-2">
          Select Tender
        </label>
        <select
          id="tender"
          className="w-full md:w-1/2 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={selectedTender?.id || ''}
          onChange={(e) => handleTenderChange(e.target.value)}
        >
          <option value="" disabled>Select a tender</option>
          {allTenders.map((tender) => (
            <option key={tender.id} value={tender.id}>
              {tender.title}
            </option>
          ))}
        </select>
      </div>

      {/* Required Documents Table */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Required Documents</h2>
          <button
            onClick={handleBulkAIRecommendations}
            disabled={bulkLoading || !selectedTender || requiredDocs.length === 0}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              bulkLoading || !selectedTender || requiredDocs.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            } transition-colors`}
          >
            {bulkLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Processing ({bulkProgress.completed}/{bulkProgress.total})
              </>
            ) : (
              <>
                <Info size={16} className="mr-2" />
                Use AI Suggested Documents
              </>
            )}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Number
                </th>
                <th scope="col" className="w-64 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th scope="col" className="w-64 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Format Instructions
                </th>
                <th scope="col" className="w-64 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission Note
                </th>
                <th scope="col" className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="w-64 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requiredDocs.map((doc, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {doc.nameNumber || `-`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-normal">
                    {doc.purposeDescription || `-`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-normal">
                    {doc.formatSpecificInstructions || `-`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-normal">
                    {doc.submissionNote || `-`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doc.selectedDocument 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.selectedDocument ? 'Attached' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap relative">
                    {doc.selectedDocument ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 truncate max-w-xs">{doc.selectedDocument.filename}</span>
                        <button 
                          onClick={() => handleDocumentSelect(index, undefined)}
                          className="text-red-600 hover:text-red-800 flex-shrink-0"
                          title="Remove document"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setModalOpen(index)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          
                          <Upload size={16} className="" />
                        </button>

                        <button
                          onClick={() => handleGetAIRecommendation(index)}
                          disabled={loadingRecommendation !== null || uploading !== null}
                          className={`inline-flex items-center justify-center w-10 h-10 border border-transparent text-sm font-medium rounded-md text-white ${
                            loadingRecommendation !== null || uploading !== null
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
                          } shadow-sm transition-colors group relative`}
                          title="Get AI recommendation"
                        >
                          {loadingRecommendation === index ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          ) : (
                            <>
                              <Info size={16} />
                              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                Get AI recommendation
                              </div>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(!requiredDocs || requiredDocs.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No required documents specified for this tender
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Checks */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Compliance Checks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complianceChecks.map((check) => (
            <div
              key={check.id}
              className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between"
            >
              <span className="text-gray-700">{check.name}</span>
              {check.status === 'passed' && <CheckCircle className="text-green-500" size={20} />}
              {check.status === 'failed' && <XCircle className="text-red-500" size={20} />}
              {check.status === 'warning' && <AlertTriangle className="text-yellow-500" size={20} />}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={complianceChecks.some(check => check.status === 'failed')}
        >
          <FileCheck size={20} className="inline-block mr-2" />
          Submit Documents
        </button>
      </div>

      {/* Document Explorer Modal */}
      {modalOpen !== null && selectedTender && (
        <DocumentExplorerModal
          isOpen={true}
          onClose={() => setModalOpen(null)}
          documents={documents}
          onSelect={handleModalSelect}
          onUpload={handleModalUpload}
          uploading={uploading !== null}
          selectedTenderId={selectedTender.id}
        />
      )}
    </div>
  );
};

export default Submission;