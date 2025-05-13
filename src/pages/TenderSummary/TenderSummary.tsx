import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Calendar,
  FileText,
  CheckSquare,
  PieChart,
  DollarSign,
  Users,
  Calendar as CalendarIcon,
  SendToBack,
  Building,
  ArrowLeft,
  Download,
  Upload,
  X,
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  XCircle,
  Info,
  Calculator,
  ChevronLeft,
  Globe,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Loader
} from 'lucide-react';
import StatusBadge from '../../components/UI/StatusBadge';
import { getTimeRemaining, formatCurrency } from '../../utils/helpers';

declare global {
  interface Window {
    tenderApiResponse?: TenderData;
  }
}

interface TenderInfo {
  scopeOfWork: {
    contentType: string;
    description: string | null;
    listItems: string[] | null;
    tableData: {
      headers: string[] | null;
      rows: any[] | null;
    } | null;
  };
  tenderSummary: {
    title: string | null;
    tenderNumber: string | null;
    issuingAuthority: string | null;
    tenderMode: string | null;
    portalLink: string | null;
  };
  importantDates: Array<{
    event: string;
    dateTime: string;
    notesLocation: string | null;
  }>;
  evaluationCriteria: {
    technicalEvaluation: Array<{
      criteriaParameter: string;
      maxMarksWeightage: string;
      subCriteriaNotes: string;
    }>;
    minimumTechnicalScore: string;
    financialEvaluation: string;
  };
  eligibilityConditions: Array<{
    itemText: string | null;
    formatHint: 'list_item' | 'table_block' | 'text';
    tableData: {
      headers: string[] | null;
      rows: any[] | null;
    } | null;
  }>;
  financialRequirements: Array<{
    itemText: string | null;
    formatHint: 'list_item' | 'table_block' | 'text';
    tableData: {
      headers: string[] | null;
      rows: any[] | null;
    } | null;
  }>;
  annexuresAttachmentsRequired: Array<{
    nameNumber: string | null;
    purposeDescription: string | null;
    formatSpecificInstructions: string | null;
    submissionNote: string | null;
  }> | null;
  billOfQuantities: Array<{
    itemText: string | null;
    formatHint: 'list_item' | 'table_block' | 'text';
    tableData: {
      headers: string[] | null;
      rows: any[] | null;
    } | null;
  }>;
  conditionsOfContract: Array<{
    itemText: string | null;
    formatHint: 'list_item' | 'table_block' | 'text';
    tableData: {
      headers: string[] | null;
      rows: any[] | null;
    } | null;
  }>;
}

interface TenderData {
  status: string;
    tender_id: number;
    tender_name: string;
  processed_sections: {
    [key: string]: {
      section_name: string;
      status: string;
      data: any;
    }
  };
  org_name?: string;
}

interface Document {
  file_id: string;
  filename: string;
  type: string;
  size: number;
  timestamp: string;
  category: string;
  tender_id?: number;
}

interface DocumentExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onSelect: (document: Document, index: number) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  selectedTenderId: string;
  selectedIndex: number | null;
}

// Add new interface for section mapping
interface SectionMapping {
  [key: string]: string;
}

// Add these type definitions
interface SectionResponse {
  status: string;
  tender_id: number;
  tender_name: string;
  section_name: string;
  processed_section?: any;
  error?: string;
}

// Update the section name mapping
const sectionApiMapping: SectionMapping = {
  'scope': 'scope_of_work',
  'eligibility': 'eligibility_conditions',
  'technical': 'technical_requirements',
  'financial': 'financial_requirements',
  'boq': 'bill_of_quantities',
  'conditions': 'conditions_of_contract',
  'dates': 'important_dates',
  'submission': 'annexures_attachments',
  'evaluation': 'evaluation_criteria',
  'tender_summary': 'tender_summary'
};

// Custom hooks for section data
const useSectionDetails = (tenderId: string, sectionName: string, orgName?: string) => {
  return useQuery<SectionResponse>({
    queryKey: ['tender', tenderId, 'section', sectionName, { orgName }],
    queryFn: async () => {
      const url = new URL('http://127.0.0.1:8000/section-details');
      url.searchParams.append('tender_id', tenderId);
      url.searchParams.append('user_id', '123');
      url.searchParams.append('section_name', sectionName);
      url.searchParams.append('org_name','lepton')
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch section details');
      }
      return response.json();
    },
    enabled: Boolean(tenderId && sectionName),
    staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Cache persists for 30 minutes
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false // Don't refetch on reconnect
  });
};

// Mutation hook for reanalyzing sections
const useReanalyzeSection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tenderId, sectionName, orgName }: { 
      tenderId: string; 
      sectionName: string; 
      orgName?: string; 
    }) => {
      let url = `http://localhost:8000/analyze-tender-section?tender_id=${tenderId}&user_id=123&section_name=${sectionName}`;
      if (orgName) {
        url += `&org_name=${encodeURIComponent(orgName)}`;
      }
      
      const response = await fetch(url, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to reanalyze section');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the relevant queries after successful reanalysis
      queryClient.invalidateQueries({ 
        queryKey: ['tender', variables.tenderId, 'section', variables.sectionName, { orgName: variables.orgName }]
      });
    },
  });
};

const ICON_SIZE = 24;

const TABS = [
  { id: 'scope', name: 'Scope of Work', icon: FileText },
  { id: 'evaluation', name: 'Evaluation Criteria', icon: PieChart },
  { id: 'eligibility', name: 'Eligibility', icon: CheckSquare },
  { id: 'technical', name: 'Technical Evaluation', icon: PieChart },
  { id: 'financial', name: 'Financial Evaluation', icon: DollarSign },
  { id: 'boq', name: 'Bill of Quantities', icon: Calculator },
  { id: 'conditions', name: 'Contract Conditions', icon: FileText },
  { id: 'dates', name: 'Key Dates', icon: CalendarIcon },
  { id: 'submission', name: 'Submission', icon: SendToBack },
];

const DocumentExplorerModal: React.FC<DocumentExplorerModalProps> = ({
  isOpen,
  onClose,
  documents,
  onSelect,
  onUpload,
  uploading,
  selectedTenderId,
  selectedIndex
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
                      onClick={() => selectedIndex !== null && onSelect(doc, selectedIndex)}
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
                      onClick={() => selectedIndex !== null && onSelect(doc, selectedIndex)}
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

// Add these type definitions at the top of the file
interface DocumentRow {
  nameNumber: string | null;
  purposeDescription: string | null;
  formatSpecificInstructions: string | null;
  submissionNote: string | null;
}

interface TableData {
  headers: string[] | string;
  rows: any[] | string;
}

interface ContentItem {
  itemText: string | null;
  formatHint: 'list_item' | 'table_block' | 'text';
  tableData: TableData | null;
}

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

const TenderSummary = () => {
  console.log('TenderSummary component rendering');
  const { id } = useParams<{ id: string }>();
  console.log('Tender ID:', id);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('scope');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<{ [key: string]: Document }>({});
  const [modalOpen, setModalOpen] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<number, string>>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  const [loadingRecommendation, setLoadingRecommendation] = useState<number | null>(null);
  const [visibleTabsStart, setVisibleTabsStart] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [originalTenderName, setOriginalTenderName] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(location.state?.org_name || null);
  const [reanalyzingSection, setReanalyzingSection] = useState<string | null>(null);
  const [sectionStatus, setSectionStatus] = useState<SectionStatus | null>(null);

  // React Query hooks for each section
  const scopeQuery = useSectionDetails(id || '', 'scope_of_work', orgName || undefined);
  const tenderSummaryQuery = useSectionDetails(id || '', 'tender_summary', orgName || undefined);
  console.log('Scope Query:', {
    isLoading: scopeQuery.isLoading,
    isError: scopeQuery.isError,
    data: scopeQuery.data
  });

  const eligibilityQuery = useSectionDetails(id || '', 'eligibility_conditions', orgName || undefined);
  console.log('Eligibility Query:', {
    isLoading: eligibilityQuery.isLoading,
    isError: eligibilityQuery.isError,
    data: eligibilityQuery.data
  });

  const technicalQuery = useSectionDetails(id || '', 'technical_requirements', orgName || undefined);
  const financialQuery = useSectionDetails(id || '', 'financial_requirements', orgName || undefined);
  const boqQuery = useSectionDetails(id || '', 'bill_of_quantities', orgName || undefined);
  const conditionsQuery = useSectionDetails(id || '', 'conditions_of_contract', orgName || undefined);
  const datesQuery = useSectionDetails(id || '', 'important_dates', orgName || undefined);
  const annexuresQuery = useSectionDetails(id || '', 'annexures_attachments', orgName || undefined);

  // Add evaluation criteria query
  const evaluationQuery = useSectionDetails(id || '', 'evaluation_criteria', orgName || undefined);

  // Mutation for reanalyzing sections
  const reanalyzeMutation = useReanalyzeSection();

  // Check if all sections are loading
  const isLoading = [
    scopeQuery,
    tenderSummaryQuery,
    evaluationQuery,
    eligibilityQuery,
    technicalQuery,
    financialQuery,
    boqQuery,
    conditionsQuery,
    datesQuery,
    annexuresQuery
  ].some(query => query.isLoading);

  // Check if any section has errored
  const hasError = [
    scopeQuery,
    tenderSummaryQuery,
    evaluationQuery,
    eligibilityQuery,
    technicalQuery,
    financialQuery,
    boqQuery,
    conditionsQuery,
    datesQuery,
    annexuresQuery
  ].some(query => query.isError);
  
  // Function to handle section reanalysis
  const handleSectionReanalysis = async (sectionId: string) => {
    if (!id) return;
    
    const apiSectionName = sectionApiMapping[sectionId];
    if (!apiSectionName) return;
    
    setReanalyzingSection(sectionId);
    
    try {
      await reanalyzeMutation.mutateAsync({
        tenderId: id,
        sectionName: apiSectionName,
        orgName: orgName || undefined
      });

      // Fetch updated section status
      const statusUrl = `http://127.0.0.1:8000/section-status?tender_id=${id}&user_id=123&org_name=lepton`;
      const response = await fetch(statusUrl);
      const data = await response.json();
      setSectionStatus(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during reanalysis');
    } finally {
      setReanalyzingSection(null);
    }
  };

  // Function to check if a section has content
  const hasSectionContent = (sectionId: string) => {
    const getQueryForSection = () => {
      switch (sectionId) {
        case 'scope': return scopeQuery;
        case 'eligibility': return eligibilityQuery;
        case 'technical': return technicalQuery;
        case 'financial': return financialQuery;
        case 'boq': return boqQuery;
        case 'conditions': return conditionsQuery;
        case 'dates': return datesQuery;
        case 'submission': return annexuresQuery;
        default: return null;
      }
    };

    const query = getQueryForSection();
    if (!query) return false;

    return query.data?.status === 'success' && Boolean(query.data?.processed_section);
  };

  // Function to get section status
  const getSectionStatus = (sectionId: string): { status: string, hasData: boolean, message: string } => {
    const getQueryForSection = () => {
      switch (sectionId) {
        case 'scope': return scopeQuery;
        case 'eligibility': return eligibilityQuery;
        case 'technical': return technicalQuery;
        case 'financial': return financialQuery;
        case 'boq': return boqQuery;
        case 'conditions': return conditionsQuery;
        case 'dates': return datesQuery;
        case 'submission': return annexuresQuery;
        default: return null;
      }
    };

    const query = getQueryForSection();
    if (!query || !query.data) {
      return { status: 'unknown', hasData: false, message: 'Section not processed' };
    }

    return {
      status: query.data.status,
      hasData: query.data.status === 'success' && Boolean(query.data.processed_section),
      message: query.data.status === 'failed' ? query.data.error || 'Failed to analyze section' : ''
    };
  };

  useEffect(() => {
    const fetchTenderDetails = async () => {
      if (!id) return;
      
      try {
        // Fetch tender details including PDF URL
        let url = `http://localhost:8000/tender/${id}?user_id=123`;
        if (orgName) {
          url += `&org_name=${encodeURIComponent(orgName)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch tender details');
        }
        
        const data = await response.json();
        if (data.status === 'success') {
          setPdfUrl(data.pdf_url);
          setOriginalTenderName(data.tender.tender_name);
        }
      } catch (error) {
        console.error('Error fetching tender details:', error);
      }
    };

    fetchTenderDetails();
  }, [id, orgName]);

  // Add useEffect to fetch section status
  useEffect(() => {
    const fetchSectionStatus = async () => {
      if (!id) return;
      
      try {
        const statusUrl = `http://127.0.0.1:8000/section-status?tender_id=${id}&user_id=123&org_name=lepton`;
        const response = await fetch(statusUrl);
        const data = await response.json();
        setSectionStatus(data);
      } catch (error) {
        console.error('Error fetching section status:', error);
      }
    };

    fetchSectionStatus();
  }, [id]);

  // Update checkAllSectionsFailed to use sectionStatus
  const checkAllSectionsFailed = () => {
    if (!sectionStatus?.sections) return false;
    
    // Check if any sections are still analyzing or not started
    const hasUnfinishedSections = Object.values(sectionStatus.sections).some(
      (section: any) => section.status === 'analyzing' || section.status === null
    );

    // If there are unfinished sections, we should show the analysis UI
    return hasUnfinishedSections;
  };

  // Function to trigger analysis
  const handleAnalyze = async () => {
    if (!id || analyzing) return;
    
    setAnalyzing(true);
    try {
      let analyzeUrl = `http://localhost:8000/analyze-tender?tender_id=${id}&user_id=123`;
      if (orgName) {
        analyzeUrl += `&org_name=${encodeURIComponent(orgName)}`;
      }
      
      const analyzeResponse = await fetch(analyzeUrl);
      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze tender');
      }
      
      const analyzeData = await analyzeResponse.json();
      
      if (analyzeData.status === 'success') {
        // Refresh the page to show new data
        window.location.reload();
      } else {
        throw new Error('Failed to analyze tender data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const fetchTenderData = async () => {
      try {
        // Create the URL with required parameters and optional org_name
        let url = `http://localhost:8000/complete-tender-details?tender_id=${id}&user_id=123`;
        if (orgName) {
          url += `&org_name=${encodeURIComponent(orgName)}`;
        }
        
        // First, check if the tender has already been analyzed
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch tender data');
        }
        
        const data: TenderData = await response.json();
        
        if (data.status === 'success') {
          // Set organization name from response if available
          if (data.org_name && !orgName) {
            setOrgName(data.org_name);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTenderData();
  }, [id, orgName, location.state]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // Check if the files endpoint exists
        const response = await fetch('http://localhost:8000/files?user_id=123');
        if (response.ok) {
        const data = await response.json();
        setDocuments(data);
        } else if (response.status === 404) {
          // Handle 404 gracefully
          console.warn('Files endpoint not found. Document upload functionality will be limited.');
          setDocuments([]);
        } else {
          throw new Error('Failed to fetch documents');
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        // Set empty array to avoid undefined errors
        setDocuments([]);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    if (id) {
      fetchUploadedDocuments(id);
    }
  }, [id]);

  const fetchUploadedDocuments = async (tenderId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/tender-documents/${tenderId}`);
      if (response.ok) {
      const data = await response.json();
      setUploadedDocuments(data.uploaded_files || {});
      } else if (response.status === 404) {
        // Handle 404 gracefully
        console.warn('Tender documents endpoint not found. Document management functionality will be limited.');
        setUploadedDocuments({});
      } else {
        throw new Error('Failed to fetch uploaded documents');
      }
    } catch (error) {
      console.error('Error fetching uploaded documents:', error);
      // Set empty object to avoid undefined errors
      setUploadedDocuments({});
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

      const response = await fetch(`http://localhost:8000/tender-documents/${tenderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploaded_documents: newUploadedFiles
        }),
      });

      if (response.ok) {
        await fetchUploadedDocuments(tenderId);
      } else if (response.status === 404) {
        console.warn('Tender documents endpoint not found. Changes will only be saved locally.');
        setUploadedDocuments(newUploadedFiles);
      } else {
        throw new Error('Failed to update uploaded documents');
      }
    } catch (error) {
      console.error('Error updating uploaded documents:', error);
    }
  };

  const handleDocumentSelect = async (docIndex: number, document: Document | undefined) => {
    if (!id) return;
    
    console.log('Selecting document:', document, 'for index:', docIndex);
    
    // Update the uploaded documents on the backend
    await updateUploadedDocuments(
      id,
      docIndex,
      document?.file_id || null
    );
    
    setSelectedDocuments(prev => ({
      ...prev,
      [docIndex]: document
    }));
  };

  const handleGetAIRecommendation = async (docIndex: number) => {
    const annexuresData = annexuresQuery.data?.processed_section;
    if (!id || !annexuresData) return;
    
    setLoadingRecommendation(docIndex);
    
    try {
      const doc = annexuresData[docIndex];
      
      // Create FormData object as the API expects form data
      const formData = new FormData();
      formData.append('tender_id', id);
      formData.append('document_number', doc.nameNumber || `Document ${docIndex + 1}`);
      formData.append('purpose', doc.purposeDescription || '');
      formData.append('format_instructions', doc.formatSpecificInstructions || '');
      formData.append('submission_note', doc.submissionNote || '');

      const response = await fetch('http://localhost:8000/ai-recommend/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('AI recommendation endpoint not found. This functionality is not available.');
          alert('AI document recommendation is not available in this demo version');
        } else {
        throw new Error('Failed to get AI recommendation');
        }
        return;
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

  const handleBulkAIRecommendations = async () => {
    const annexuresData = annexuresQuery.data?.processed_section;
    if (!id || !annexuresData || bulkLoading) return;
    
    // Filter out indices of documents that don't have a selection yet
    const unselectedIndices = annexuresData.map((_: DocumentRow, index: number) => index)
      .filter((index: number) => !uploadedDocuments[index]);

    if (unselectedIndices.length === 0) {
      console.log('All documents are already selected');
      return;
    }

    setBulkLoading(true);
    setBulkProgress({ completed: 0, total: unselectedIndices.length });
    
    try {
      // First, check if AI recommendation endpoint exists
      const testResponse = await fetch('http://localhost:8000/ai-recommend/', {
        method: 'POST',
        body: new FormData() // Empty form data for test
      });
      
      if (testResponse.status === 404) {
        console.warn('AI recommendation endpoint not found. Bulk recommendation functionality is not available.');
        alert('AI document recommendation is not available in this demo version');
        setBulkLoading(false);
        setBulkProgress({ completed: 0, total: 0 });
        return;
      }
      
      // Create an array of promises only for unselected documents
      const recommendationPromises = unselectedIndices.map(async (index: number) => {
        const doc = annexuresData[index];
        const formData = new FormData();
        formData.append('tender_id', id);
        formData.append('document_number', doc.nameNumber || `Document ${index + 1}`);
        formData.append('purpose', doc.purposeDescription || '');
        formData.append('format_instructions', doc.formatSpecificInstructions || '');
        formData.append('submission_note', doc.submissionNote || '');

        const response = await fetch('http://localhost:8000/ai-recommend/', {
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
      const response = await fetch(`http://localhost:8000/tender-documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploaded_documents: newUploadedFiles
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Tender documents endpoint not found. Changes will only be saved locally.');
          setUploadedDocuments(newUploadedFiles);
        } else {
        throw new Error('Failed to update uploaded documents');
      }
      } else {
      // Refresh the uploaded documents
      await fetchUploadedDocuments(id);
      }

    } catch (error) {
      console.error('Error in bulk AI recommendations:', error);
    } finally {
      setBulkLoading(false);
      setBulkProgress({ completed: 0, total: 0 });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docIndex: number) => {
    const file = event.target.files?.[0];
    if (!file || !id) {
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
      formData.append('tender_id', id);

      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Handle 404 gracefully
          console.warn('Upload endpoint not found. File upload functionality is not available.');
          alert('File upload is not available in this demo version');
        } else {
        throw new Error(`Upload failed with status: ${response.status}`);
        }
        return;
      }

      const uploadedDoc = await response.json();
      console.log('Upload successful:', uploadedDoc);

      const newDocument: Document = {
        file_id: uploadedDoc.file_id,
        filename: file.name,
        type: file.type,
        size: file.size,
        timestamp: new Date().toISOString(),
        category: 'specific',
        tender_id: parseInt(id)
      };

      await handleDocumentSelect(docIndex, newDocument);

      // Refresh documents list
      const docsResponse = await fetch('http://localhost:8000/files?user_id=123');
      if (docsResponse.ok) {
        const docsData = await response.json();
        setDocuments(docsData);
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleModalUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (modalOpen === null) {
      console.error('No document slot selected for upload');
      return;
    }
    console.log('Modal upload triggered for index:', modalOpen);
    await handleFileUpload(event, modalOpen);
    setModalOpen(null);
  };

  const renderPortalLink = (portalLink: string | null) => {
    if (!portalLink) return null;
    return (
      <a 
        href={portalLink} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
      >
        <Globe size={16} className="mr-1" />
        Portal Link
      </a>
    );
  };

  const renderTableData = (tableData: TableData | null | undefined) => {
    if (!tableData) return null;

    // Convert comma-separated headers string to array if needed
    const headers = typeof tableData.headers === 'string' 
      ? tableData.headers.split(',')
      : tableData.headers;

    // Convert comma-separated rows string to array if needed
    const rows = typeof tableData.rows === 'string'
      ? tableData.rows.split('\n').map(row => row.split(','))
      : tableData.rows;

    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return null;
    }

    return (
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed Information</h4>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, index) => (
                  <th 
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.isArray(row) ? (
                    row.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex}
                        className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-500"
                      >
                        {cell?.trim() || '-'}
                      </td>
                    ))
                  ) : (
                    headers.map((header, cellIndex) => (
                      <td 
                        key={cellIndex}
                        className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-500"
                      >
                        {(row[header] || '').trim() || '-'}
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleModalSelect = (document: Document) => {
    if (modalOpen === null) return;
    const index = modalOpen;
    handleDocumentSelect(index, document);
    setModalOpen(null);
  };

  // Function to render section status indicator
  const renderSectionStatus = (sectionId: string) => {
    const { status, message } = getSectionStatus(sectionId);
    
    // Don't show reanalysis for tender_summary and submission (annexures_attachments)
    const canReanalyze = sectionId !== 'tender_summary' && sectionId !== 'submission';
    
    return (
      <div className="flex items-center gap-2">
        {status === 'failed' && (
          <div className="flex items-center text-amber-600 gap-1">
            <AlertTriangle size={16} />
            <span className="text-xs">{message}</span>
          </div>
        )}
        {canReanalyze && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSectionReanalysis(sectionId);
            }}
            disabled={reanalyzingSection !== null}
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              reanalyzingSection === sectionId
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {reanalyzingSection === sectionId ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-1" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={12} className="mr-1" />
                <span>Reanalyze</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  // Function to render tab button with status
  const renderTabButton = (id: string, label: string, icon: React.ReactNode) => {
    const isActive = activeTab === id;
    const sectionStatus = getSectionStatus(id);
    const canReanalyze = id !== 'tender_summary' && id !== 'submission';
    
    return (
      <div className="flex flex-col flex-1">
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`
            w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            transition-colors relative
            ${isActive 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          {icon}
          <span>{label}</span>
          {sectionStatus.status === 'failed' && (
            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-amber-500'}`} />
          )}
        </button>
        
        {/* Add reanalysis button */}
        {canReanalyze && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSectionReanalysis(id);
            }}
            disabled={reanalyzingSection !== null}
            className={`mt-1 inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-medium ${
              reanalyzingSection === id
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {reanalyzingSection === id ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-1" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={12} className="mr-1" />
                <span>Reanalyze</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  const handlePrevTabs = () => {
    if (visibleTabsStart > 0) {
      setVisibleTabsStart(prev => prev - 1);
    }
  };

  const handleNextTabs = () => {
    if (visibleTabsStart + 5 < availableTabs.length) {
      setVisibleTabsStart(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading tender details...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800">Error loading tender</h2>
        <p className="text-gray-600 mt-2">Failed to load one or more sections</p>
      </div>
    );
  }

  // Update the analysis UI to show progress like in UploadArea
  if (checkAllSectionsFailed()) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </a>
          
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{originalTenderName}</h1>
            
            {sectionStatus ? (
              <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
                <Loader size={40} className="text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  Analyzing tender document... ({sectionStatus.progress.completion_percentage.toFixed(1)}% complete)
                </p>
                
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
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Loader size={40} className="text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  Starting analysis...
                </p>
                <p className="text-xs text-gray-500 mt-2">This may take a few minutes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const tenderSummaryData = tenderSummaryQuery.data?.processed_section || {
    title: null,
    tenderNumber: null,
    issuingAuthority: null,
    tenderMode: null,
    portalLink: null
  };

  // Filter out empty sections
  // const availableTabs = TABS.filter(tab => hasSectionContent(tab.id));
  const availableTabs = TABS;
  const visibleTabs = availableTabs.slice(visibleTabsStart, visibleTabsStart + 5);

  // Update the renderContentSection function with proper type for item
  const renderContentSection = (data: any) => {
    if (!data || typeof data !== 'object') {
      return null;
    }
    
    // If data has processed_section
    if (data.processed_section) {
      return renderContentSection(data.processed_section);
    }

    // Special handling for evaluation criteria
    if (data.evaluationStages || data.technicalEvaluation) {
      return (
        <div className="space-y-6">
          {data.evaluationStages && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Evaluation Stages</h4>
              <p className="text-sm text-gray-600">{data.evaluationStages}</p>
            </div>
          )}

          {data.eligibilityQualifyingCriteria && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Eligibility & Qualifying Criteria</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.eligibilityQualifyingCriteria}</p>
            </div>
          )}

          {data.technicalEvaluation && Array.isArray(data.technicalEvaluation) && data.technicalEvaluation.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Technical Evaluation Criteria</h4>
              <div className="space-y-4">
                {data.technicalEvaluation.map((criteria: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4">
                      <div className="flex items-start justify-between mb-4">
                        <h5 className="text-base font-medium text-gray-900 flex-grow pr-4">
                          {criteria.criteriaParameter}
                        </h5>
                        <div className="flex-shrink-0 bg-blue-50 px-3 py-1 rounded-full">
                          <span className="text-sm font-medium text-blue-700">
                            Max Marks: {criteria.maxMarksWeightage}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {criteria.subCriteriaNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.minimumTechnicalScore && (
            <div className="mb-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Minimum Technical Score Required</h4>
              <p className="text-sm text-yellow-700">{data.minimumTechnicalScore}</p>
            </div>
          )}

          {data.financialEvaluation && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Financial Evaluation</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.financialEvaluation}</p>
              </div>
            </div>
          )}

          {data.overallSelectionMethod && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Overall Selection Method</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.overallSelectionMethod}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // If data is an array, map through it
    if (Array.isArray(data)) {
      return data.map((item: any, index: number) => {
        if (!item) return null;

        if (item.formatHint === 'table_block' && item.tableData) {
          return renderTableData(item.tableData);
        }

        if (!item.itemText) {
          return null;
        }

        return (
          <div key={index} className="mb-4">
            <div className="flex items-start">
              {item.formatHint === 'list_item' && (
                <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-2 mr-3"></div>
              )}
              <p className="text-sm text-gray-600">{item.itemText}</p>
            </div>
          </div>
        );
      });
    }

    // Handle direct object with content
    const contentItems = [];
    if (data.description) {
      contentItems.push({
        itemText: data.description,
        formatHint: 'text'
      });
    }
    if (data.listItems && Array.isArray(data.listItems)) {
      contentItems.push(...data.listItems.map((item: string) => ({
        itemText: item,
        formatHint: 'list_item'
      })));
    }
    if (data.tableData) {
      contentItems.push({
        formatHint: 'table_block',
        tableData: data.tableData
      });
    }
    return renderContentSection(contentItems);
  };

  // Update the section render functions
  const renderScopeOfWork = () => {
    if (scopeQuery.isLoading) return <div>Loading...</div>;
    if (scopeQuery.isError) return <div>Error loading scope of work</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Scope of Work</h3>
        {renderContentSection(scopeQuery.data)}
      </div>
    );
  };

  const renderEligibilityConditions = () => {
    if (eligibilityQuery.isLoading) return <div>Loading...</div>;
    if (eligibilityQuery.isError) return <div>Error loading eligibility conditions</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Eligibility Conditions</h3>
        {renderContentSection(eligibilityQuery.data)}
      </div>
    );
  };

  const renderTechnicalEvaluation = () => {
    if (technicalQuery.isLoading) return <div>Loading...</div>;
    if (technicalQuery.isError) return <div>Error loading technical evaluation</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Technical Evaluation</h3>
        {renderContentSection(technicalQuery.data)}
      </div>
    );
  };

  const renderFinancialRequirements = () => {
    if (financialQuery.isLoading) return <div>Loading...</div>;
    if (financialQuery.isError) return <div>Error loading financial requirements</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Financial Requirements</h3>
        {renderContentSection(financialQuery.data)}
      </div>
    );
  };

  const renderBillOfQuantities = () => {
    if (boqQuery.isLoading) return <div>Loading...</div>;
    if (boqQuery.isError) return <div>Error loading bill of quantities</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Bill of Quantities</h3>
        {renderContentSection(boqQuery.data)}
      </div>
    );
  };

  const renderContractConditions = () => {
    if (conditionsQuery.isLoading) return <div>Loading...</div>;
    if (conditionsQuery.isError) return <div>Error loading contract conditions</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Contract Conditions</h3>
        {renderContentSection(conditionsQuery.data)}
      </div>
    );
  };

  const renderImportantDates = () => {
    if (datesQuery.isLoading) return <div>Loading...</div>;
    if (datesQuery.isError) return <div>Error loading important dates</div>;
    
    const dates = datesQuery.data?.processed_section;
    if (!dates || !Array.isArray(dates)) return <div>No important dates available</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Key Dates</h3>
        <div className="space-y-4">
          {dates.map((date: any, index: number) => (
            <div 
              key={index}
              className="relative flex items-start space-x-4 p-4 rounded-lg border border-gray-200 hover:border-blue-200 bg-white"
            >
              {/* Timeline dot */}
              <div className="flex-shrink-0">
                <div className="w-3 h-3 rounded-full mt-2 bg-blue-500"></div>
              </div>

              {/* Content */}
              <div className="flex-grow">
                <h4 className="text-base font-medium text-gray-900">{date.event}</h4>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2" />
                    {date.dateTime || 'Date to be announced'}
                  </div>
                  {date.notesLocation && (
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-start">
                        <Info size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                        <span>{date.notesLocation}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSubmissionRequirements = () => {
    if (annexuresQuery.isLoading) return <div>Loading...</div>;
    if (annexuresQuery.isError) return <div>Error loading submission requirements</div>;
    if (!annexuresQuery.data?.processed_section) return <div>No submission requirements available</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Submission Requirements</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format Instructions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {annexuresQuery.data.processed_section.map((doc: DocumentRow, index: number) => renderDocumentRow(doc, index))}
            </tbody>
          </table>
        </div>
        {annexuresQuery.data.processed_section.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleBulkAIRecommendations}
              disabled={bulkLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                bulkLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
              } shadow-sm transition-colors`}
            >
              {bulkLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Processing... ({bulkProgress.completed}/{bulkProgress.total})
                </>
              ) : (
                <>
                  <Info size={16} className="mr-2" />
                  Get AI Recommendations for All
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Add back the renderDocumentRow function
  const renderDocumentRow = (doc: DocumentRow, index: number) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-6 py-4 text-sm font-medium text-gray-700">
        {doc.nameNumber || `Document ${index + 1}`}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 whitespace-normal">
        {doc.purposeDescription || '-'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 whitespace-normal">
        {doc.formatSpecificInstructions || '-'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 whitespace-normal">
        {doc.submissionNote || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
          uploadedDocuments[index]
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {uploadedDocuments[index] ? 'Attached' : 'Pending'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {uploadedDocuments[index] ? (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 truncate max-w-xs">
              {documents.find(d => d.file_id === uploadedDocuments[index])?.filename}
            </span>
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
  );

  // Add back the renderActiveTabContent function
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'scope':
        return renderScopeOfWork();
      case 'evaluation':
        return renderEvaluationCriteria();
      case 'eligibility':
        return renderEligibilityConditions();
      case 'technical':
        return renderTechnicalEvaluation();
      case 'financial':
        return renderFinancialRequirements();
      case 'boq':
        return renderBillOfQuantities();
      case 'conditions':
        return renderContractConditions();
      case 'dates':
        return renderImportantDates();
      case 'submission':
        return renderSubmissionRequirements();
      default:
        return null;
    }
  };

  // Add renderEvaluationCriteria function
  const renderEvaluationCriteria = () => {
    if (evaluationQuery.isLoading) return <div>Loading...</div>;
    if (evaluationQuery.isError) return <div>Error loading evaluation criteria</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Evaluation Criteria</h3>
        {renderContentSection(evaluationQuery.data)}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading tender details...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800">Error loading tender</h2>
        <p className="text-gray-600 mt-2">Failed to load one or more sections</p>
      </div>
    );
  }

  // Update the analysis UI to show progress like in UploadArea
  if (checkAllSectionsFailed()) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </a>
          
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{originalTenderName}</h1>
            
            {sectionStatus ? (
              <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
                <Loader size={40} className="text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  Analyzing tender document... ({sectionStatus.progress.completion_percentage.toFixed(1)}% complete)
                </p>
                
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
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Loader size={40} className="text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  Starting analysis...
                </p>
                <p className="text-xs text-gray-500 mt-2">This may take a few minutes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft size={16} className="mr-1" />
          Back to Dashboard
        </a>
        
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {originalTenderName}
                </h1>
                <h2 className="text-lg font-medium text-gray-600 mb-1">
                  {tenderSummaryData.title}
                </h2>
                <div className="flex items-center text-gray-600 mb-3">
                  <Building size={16} className="mr-1" />
                  <span>{tenderSummaryData.issuingAuthority}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tenderSummaryData.tenderNumber}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {tenderSummaryData.tenderMode}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                {pdfUrl && (
                  <a 
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    <Download size={16} className="mr-2" />
                    Download PDF
                  </a>
                )}
                {renderPortalLink(tenderSummaryData.portalLink)}
              </div>
            </div>
          </div>
          
          {/* Section Navigation */}
          <div className="mb-8 border-b border-gray-200 w-full">
            <div className="flex items-center justify-between w-full">
              {/* Previous button */}
              <button
                onClick={handlePrevTabs}
                disabled={visibleTabsStart === 0}
                className={`flex-shrink-0 p-2 rounded-lg ${
                  visibleTabsStart === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              
              {/* Tabs container */}
              <div className="flex-1 flex items-start justify-between gap-4 py-4 px-4 overflow-hidden">
                {visibleTabs.map(tab => renderTabButton(tab.id, tab.name, <tab.icon size={18} />))}
              </div>

              {/* Next button */}
              <button
                onClick={handleNextTabs}
                disabled={visibleTabsStart + 5 >= availableTabs.length}
                className={`flex-shrink-0 p-2 rounded-lg ${
                  visibleTabsStart + 5 >= availableTabs.length
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {renderActiveTabContent()}
          </div>
        </div>
      </div>
      
      {/* Add the modal at the end of the component */}
      {modalOpen !== null && id && (
        <DocumentExplorerModal
          isOpen={true}
          onClose={() => setModalOpen(null)}
          documents={documents}
          onSelect={handleModalSelect}
          onUpload={handleModalUpload}
          uploading={uploading !== null}
          selectedTenderId={id}
          selectedIndex={modalOpen}
        />
      )}
    </div>
  );
};

export default TenderSummary;