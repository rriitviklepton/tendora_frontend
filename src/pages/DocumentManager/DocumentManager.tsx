import React, { useState, useEffect } from 'react';
import { File, Upload, Search, Eye, Folder, ChevronRight, ChevronDown, X } from 'lucide-react';
import { useTenderContext } from '../../context/TenderContext';

interface Document {
  file_id: string;
  filename: string;
  type: string;
  size: number;
  timestamp: string;
  base64_content?: string;
  category: string;
  tender_id?: number;
  details?: {
    type?: string;
    purpose?: string;
    tender_category?: string;
    tender_name?: string;
    important_information_brief?: string;
    [key: string]: any;
  };
  user_id: number;
}

interface DocumentDetails {
  type: string;
  [key: string]: any;
}

interface FolderViewProps {
  documents: Document[];
  onViewDocument: (document: Document) => void;
  onViewDetails: (document: Document) => void;
  getFileExtension: (mimeType: string) => string;
}

const ICON_SIZE = 24; // Define a constant for icon size

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

const FolderView: React.FC<FolderViewProps> = ({ documents, onViewDocument, onViewDetails, getFileExtension }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((document) => (
            <tr key={document.file_id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center">
                    <File size={ICON_SIZE} className="text-gray-500" />
                  </div>
                  <div className="ml-3 flex items-center">
                    <div className="text-sm font-medium text-gray-900">{document.filename}</div>
                    <button
                      onClick={() => onViewDetails(document)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600">{getFileExtension(document.type)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600">{Math.round(document.size / 1024)} KB</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600">
                  {new Date(document.timestamp).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button
                  onClick={() => onViewDocument(document)}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Eye size={16} className="mr-1" />
                  <span>View</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DocumentManager = () => {
  const { allTenders, fetchAllTenders } = useTenderContext();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('general');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['general', 'tenders']));
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchDocuments();
    fetchAllTenders(1);
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.2.71:8000/files?user_id=123');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, tenderId?: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadProgress({ completed: 0, total: files.length });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('upload', file);
        formData.append('filename', file.name);
        formData.append('type', file.type);
        formData.append('size', file.size.toString());
        formData.append('user', '123');
        formData.append('category', tenderId ? 'specific' : 'general');
        if (tenderId) {
          formData.append('tender_id', tenderId);
        }

        const response = await fetch('http://192.168.2.71:8000/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        setUploadProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
      }

      await fetchDocuments();
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      setUploadProgress({ completed: 0, total: 0 });
    }
  };

  const handleViewDocument = async (document: Document) => {
    try {
      if (document.base64_content) {
        const byteCharacters = atob(document.base64_content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: document.type });
        
        const link = window.document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = document.filename;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const handleViewDetails = (document: Document) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const getFileExtension = (mimeType: string): string => {
    const mimeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'text/plain': 'TXT',
      'application/zip': 'ZIP',
    };
    return mimeMap[mimeType] || mimeType.split('/').pop()?.toUpperCase() || 'Unknown';
  };

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

  const selectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
  };

  const getDocumentsForFolder = (folderId: string): Document[] => {
    if (folderId === 'general') {
      return documents.filter(doc => doc.category === 'general' && (!searchTerm || doc.filename.toLowerCase().includes(searchTerm.toLowerCase())));
    } else {
      return documents.filter(doc => 
        doc.tender_id?.toString() === folderId && 
        (!searchTerm || doc.filename.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Document Explorer</h1>
        <p className="text-gray-600">Manage your documents in an organized folder structure</p>
      </div>
      
      <div className="flex gap-6">
        {/* Folder Tree */}
        <div className="w-80 bg-white rounded-lg shadow p-4">
          {/* General Documents */}
          <div 
            className={`flex items-center p-2.5 rounded cursor-pointer min-h-[48px] ${
              selectedFolder === 'general' ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              toggleFolder('general');
              selectFolder('general');
            }}
          >
            <div className="w-8 flex justify-center items-center">
              {expandedFolders.has('general') ? (
                <ChevronDown size={ICON_SIZE} className="text-gray-400" />
              ) : (
                <ChevronRight size={ICON_SIZE} className="text-gray-400" />
              )}
            </div>
            <div className="w-8 flex justify-center items-center">
              <Folder size={ICON_SIZE} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium ml-2">General Documents</span>
          </div>

          {/* Tender Documents Section */}
          <div className="mt-2">
            <div 
              className={`flex items-center p-2.5 rounded cursor-pointer min-h-[48px] ${
                selectedFolder === 'tenders' ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleFolder('tenders')}
            >
              <div className="w-8 flex justify-center items-center">
                {expandedFolders.has('tenders') ? (
                  <ChevronDown size={ICON_SIZE} className="text-gray-400" />
                ) : (
                  <ChevronRight size={ICON_SIZE} className="text-gray-400" />
                )}
              </div>
              <div className="w-8 flex justify-center items-center">
                <Folder size={ICON_SIZE} className="text-purple-600" />
              </div>
              <span className="text-sm font-medium ml-2">Tender Documents</span>
            </div>

            {/* Tender Subfolders */}
            {expandedFolders.has('tenders') && (
              <div className="space-y-0.5">
                {allTenders.map(tender => (
                  <div
                    key={tender.id}
                    className={`flex items-center ml-2 p-2.5 pl-4 rounded cursor-pointer min-h-[48px] ${
                      selectedFolder === tender.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      toggleFolder(tender.id);
                      selectFolder(tender.id);
                    }}
                  >
                    <div className="w-8 flex justify-center items-center">
                      {expandedFolders.has(tender.id) ? (
                        <ChevronDown size={ICON_SIZE} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={ICON_SIZE} className="text-gray-400" />
                      )}
                    </div>
                    <div className="w-8 flex justify-center items-center">
                      <Folder size={ICON_SIZE} className="text-purple-600" />
                    </div>
                    <span className="text-sm truncate ml-2">{tender.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {selectedFolder && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search documents..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, selectedFolder === 'general' ? undefined : selectedFolder)}
                      disabled={uploading}
                      multiple
                    />
                    <label
                      htmlFor="file-upload"
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                        uploading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      } shadow-sm transition-colors`}
                    >
                      <Upload size={ICON_SIZE} className="mr-2" />
                      {uploading ? `Uploading (${uploadProgress.completed}/${uploadProgress.total})` : 'Upload'}
                    </label>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading documents...</p>
                  </div>
                ) : (
                  <FolderView
                    documents={getDocumentsForFolder(selectedFolder)}
                    onViewDocument={handleViewDocument}
                    onViewDetails={handleViewDetails}
                    getFileExtension={getFileExtension}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedDocument && (
          <div>
            <h3 className="text-lg font-semibold mb-4">{selectedDocument.filename}</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Type:</span>
                <span className="ml-2">{selectedDocument.details?.type || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-medium">Purpose:</span>
                <span className="ml-2">{selectedDocument.details?.purpose || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-medium">Tender Category:</span>
                <span className="ml-2">{selectedDocument.details?.tender_category || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-medium">Project Name:</span>
                <span className="ml-2">{selectedDocument.details?.tender_name || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-medium">Important Information:</span>
                <span className="ml-2">{selectedDocument.details?.important_information_brief || 'Not specified'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentManager;