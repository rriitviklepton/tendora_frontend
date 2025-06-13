import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Calendar,
  FileText,
  CheckSquare,
  PieChart,
  Settings,
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
  FileCheck,
  Info,
  File,
  AlertTriangle,
  XCircle,
  Calculator,
  ChevronLeft,
  Globe,
  RefreshCw,
  CheckCircle,
  Loader,
  Eye,
  Link,
  Table,
  Code,
  GitBranch,
  Package,
  MapPin,
  Wrench,
  Target,
  GraduationCap,
  LifeBuoy,
  Shield,
  User,
  Check,
  ListTodo,
  Ruler,
  ThumbsDown
} from 'lucide-react';
import StatusBadge from '../../components/UI/StatusBadge';
import { getTimeRemaining, formatCurrency } from '../../utils/helpers';
import PDFViewer from '../../components/PDFViewer/PDFViewer';
import FeedbackForm from '../../components/Feedback/FeedbackForm';
import CorrigendumsButton from '../../components/Corrigendums/CorrigendumsButton';
import { useDeleteCorrigendum } from '../../hooks/useDeleteCorrigendum';
import { useUploadCorrigendum } from '../../hooks/useUploadCorrigendum';

declare global {
  interface Window {
    tenderApiResponse?: TenderData;
  }
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

interface ComplianceRequirement {
  clause_number: string | null;
  requirement: string | null;
  compliance_type: string | null;
  supporting_documents_needed: string[] | null;
  evaluation_impact: {
    is_mandatory: boolean;
    disqualification_risk: boolean;
    evaluation_weightage: number | null;
  };
  submission_details: {
    submission_format: {
      format_type: string | null;
      number_of_copies: string | number | null;
      special_instructions: string | null;
    } | string | null;
    submission_stage: string | null;
    special_instructions: string | null;
  };
  compliance_matrix: {
    headers: string[];
    rows: Array<{
      clause_no: string;
      description: string;
      type: string;
      documents: string | null;
      format: string;
      is_mandatory: string;
      remarks: string | null;
    }>;
  };
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
  'table_of_contents': 'table_of_contents',
  'scope': 'scope_of_work',
  'eligibility': 'eligibility_conditions',
  // 'technical': 'technical_requirements',
  // 'financial': 'financial_requirements',
  'boq': 'bill_of_quantities',
  'conditions': 'conditions_of_contract',
  'compliance': 'compliance_requirements',
  'dates': 'important_dates',
  'submission': 'annexures_attachments',
  'evaluation': 'evaluation_criteria',
  'tender_summary': 'tender_summary'
};

// Add type definitions for table of contents
interface TableOfContentsSection {
  section_number: string;
  section_title: string;
  page_number?: string;
  subsections?: {
    subsection_number: string;
    subsection_title: string;
    page_number?: string;
  }[];
}

type TableOfContentsData = TableOfContentsSection[];

// Custom hooks for section data
const useSectionDetails = (tenderId: string, sectionName: string, orgName?: string, enabled: boolean = true) => {
  return useQuery<SectionResponse>({
    queryKey: ['tender', tenderId, 'section', sectionName, { orgName }],
    queryFn: async () => {
      const url = new URL('https://api.smarttender.rio.software/api/section-details');
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
    enabled: Boolean(tenderId && sectionName && enabled),
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
      let url = `https://api.smarttender.rio.software/api/analyze-tender-section?tender_id=${tenderId}&user_id=123&section_name=${sectionName}`;
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
  { id: 'table_of_contents', name: 'Table of Contents', icon: FileText },
  { id: 'scope', name: 'Scope of Work', icon: FileText },
  { id: 'evaluation', name: 'Evaluation Criteria', icon: PieChart },
  { id: 'eligibility', name: 'Eligibility', icon: CheckSquare },
  // { id: 'technical', name: 'Technical Evaluation', icon: PieChart },
  // { id: 'financial', name: 'Financial Evaluation', icon: DollarSign },
  { id: 'boq', name: 'Bill of Quantities', icon: Calculator },
  { id: 'conditions', name: 'Contract Conditions', icon: FileText },
  { id: 'compliance', name: 'Compliance', icon: CheckSquare },
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
          <h2 className="text-lg font-semibold">Select Existing Document</h2>
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
            Click on a document to select it
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
  table_name?: string;
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

interface TenderInfo {
  scopeOfWork: {
    project_overview: {
      summary: string | null;
      background: string | null;
    };
    detailed_tasks: Array<{
      task_category: string;
      activities: string[];
      technical_specifications: string | null;
      dependencies: string | null;
    }>;
    deliverables: Array<{
      name: string;
      description: string;
      format: string | null;
      frequency: string | null;
      acceptance_criteria: string | null;
    }>;
    timeline: {
      total_duration: string;
      milestones: Array<{
        name: string;
        deadline: string;
        deliverables: string[];
      }>;
      phasing_details: string;
    };
    location: {
      work_mode: string;
      specific_locations: string[];
      site_requirements: string;
    };
    resources: {
      manpower: {
        team_structure: string;
        key_personnel: string[];
        minimum_qualifications: string;
      };
      equipment: {
        contractor_provided: string[];
        client_provided: string[];
      };
    };
    performance_standards: {
      service_levels: Array<{
        parameter: string;
        target: string;
        measurement: string | null;
        penalty: string;
      }>;
      quality_requirements: string;
    };
    training: {
      is_required: boolean;
      target_audience: string[];
      training_scope: string;
      duration: string | null;
    };
    support: {
      warranty_period: string | null;
      maintenance_support: string;
      sla_terms: string;
    };
  };
  tenderSummary: {
    title: string | null;
    tenderNumber: string | null;
    issuingAuthority: string | null;
    tenderMode: string | null;
    portalLink: string | null;
    financial_requirements: {
      emd: {
        amount: string | null;
        payment_mode: string | null;
        validity_period: string | null;
        exemptions: string | null;
        refund_terms: string | null;
      };
      tender_fee: {
        amount: string | null;
        payment_mode: string | null;
        is_refundable: boolean | null;
        exemptions: string | null;
      };
      estimated_value: string | null;
    };
  };
  importantDates: Array<{
    event: string;
    dateTime: string;
    notesLocation: string | null;
  }>;
  evaluationCriteria: {
    evaluationStages: string | null;
    eligibilityQualifyingCriteria: string | null;
    technicalEvaluation: Array<{
      criteriaParameter: string;
      maxMarksWeightage: string;
      subCriteriaNotes: string;
    }>;
    minimumTechnicalScore: string;
    financialEvaluation: string;
    overallSelectionMethod: string | null;
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
  complianceRequirements: Array<{
    clause_number: string | null;
    requirement: string | null;
    compliance_type: string | null;
    supporting_documents_needed: string[] | null;
    evaluation_impact: {
      is_mandatory: boolean;
      disqualification_risk: boolean;
      evaluation_weightage: number | null;
    };
    submission_details: {
      submission_format: {
        format_type: string | null;
        number_of_copies: string | number | null;
        special_instructions: string | null;
      } | string | null;
      submission_stage: string | null;
      special_instructions: string | null;
    };
    compliance_matrix: {
      headers: string[];
      rows: Array<{
        clause_no: string;
        description: string;
        type: string;
        documents: string | null;
        format: string;
        is_mandatory: string;
        remarks: string | null;
      }>;
    };
  }>;
}

// Add these type definitions at the top of the file
type ComplianceStatus = 'Mandatory' | 'Optional';
type ComplianceStatusColor = 'red' | 'blue' | 'yellow' | 'green' | 'gray';

interface ComplianceMatrixRow {
  clause_no: string;
  description: string;
  type: string;
  documents: string | null;
  format: string;
  is_mandatory: string;
  remarks: string | null;
}

// Update the StatusBadge component props
interface StatusBadgeProps {
  status: string;
  color?: 'red' | 'blue' | 'yellow' | 'green' | 'gray';
}

// Update the TenderStatus type to include compliance statuses
type TenderStatus = string;

// Add new interfaces for the modals
interface FinancialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  details: {
    amount: string | null;
    payment_mode: string | null;
    validity_period?: string | null;
    is_refundable?: boolean | null;
    exemptions: string | null;
    refund_terms?: string | null;
  };
}

// Add the FinancialDetailsModal component
const FinancialDetailsModal: React.FC<FinancialDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  details
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {/* <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button> */}
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Main Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
                <p className="text-base text-gray-900">{details.amount || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Mode</h3>
                <p className="text-base text-gray-900">{details.payment_mode || 'Not specified'}</p>
              </div>
              {details.validity_period !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Validity Period</h3>
                  <p className="text-base text-gray-900">{details.validity_period || 'Not specified'}</p>
                </div>
              )}
              {details.is_refundable !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Refundable</h3>
                  <p className="text-base text-gray-900">{details.is_refundable ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>

            {/* Additional Details */}
            {(details.exemptions || details.refund_terms) && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                {details.exemptions && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Exemptions</h3>
                    <p className="text-base text-gray-900 bg-gray-50 p-4 rounded-lg">
                      {details.exemptions}
                    </p>
                  </div>
                )}
                {details.refund_terms && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Refund Terms</h3>
                    <p className="text-base text-gray-900 bg-gray-50 p-4 rounded-lg">
                      {details.refund_terms}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Add this near the top of the file after imports
const POLLING_INTERVAL = 7000; // ` seconds

// Add this before the TenderSummary component
type SectionState = 'success' | 'failed' | 'analyzing';

const isSectionAccessible = (
  sectionId: string,
  sectionStatus: SectionStatus | null,
  sectionApiMapping: SectionMapping
): boolean => {
  if (!sectionStatus?.sections) return false;
  
  const section = sectionStatus.sections[sectionApiMapping[sectionId]];
  return section === 'success';
};

// Add helper function to get section state
const getSectionState = (
  sectionId: string,
  sectionStatus: SectionStatus | null,
  sectionApiMapping: SectionMapping
): SectionState | null => {
  if (!sectionStatus?.sections) return null;
  
  const section = sectionStatus.sections[sectionApiMapping[sectionId]];
  return section as SectionState;
};

// Add PDFViewerModal component before TenderSummary component
interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  initialPage?: number | null;
}

const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  initialPage
}) => {
  if (!isOpen || !pdfUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-[95vw] h-[95vh] flex flex-col rounded-lg shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg">
          <h2 className="text-lg font-semibold">Tender Document</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* PDF Viewer Container */}
        <div className="flex-1 overflow-hidden">
          <PDFViewer pdfUrl={pdfUrl} initialPage={initialPage} />
        </div>
      </div>
    </div>
  );
};

// Add this after other constants
const ELIGIBILITY_TABS = [
  { id: 'legal', name: 'Legal', icon: Building },
  { id: 'technical', name: 'Technical', icon: Settings },
  { id: 'financial', name: 'Financial', icon: DollarSign },
  { id: 'statutory', name: 'Statutory', icon: FileCheck },
  { id: 'consortium', name: 'Consortium', icon: Users },
  { id: 'disqualification', name: 'Disqualification', icon: AlertTriangle }
];

// Add these interfaces at the top of the file with other interfaces
interface EvaluationStage {
  stage_name: string | null;
  stage_type: string | null;
  sequence_number: string | number | null;
  description: string | null;
  is_eliminatory: boolean | null;
}

interface TechnicalParameter {
  parameter_name: string | null;
  max_marks: string | number | null;
  scoring_method: string | null;
  supporting_documents: string | null;
  evaluation_notes: string | null;
}

interface ScoringMatrixCategory {
  criteria_category: string | null;
  parameters: TechnicalParameter[] | null;
  category_weightage: string | number | null;
}

interface DisqualificationCriteria {
  criteria: string | null;
  stage: string | null;
  verification_method: string | null;
}

// Add these type definitions at the top of the file with other interfaces
interface SpecificRequirements {
  L1_specific: string | null;
  qcbs_specific: {
    technical_weightage: string;
    financial_weightage: string;
    scoring_formula: string;
  } | null;
  qbs_specific: string | null;
  fbs_specific: string | null;
  lcs_specific: string | null;
  sss_specific: string | null;
  era_specific: string | null;
}

interface SelectionMethod {
  primary_criteria: string;
  tie_breaker: string | null;
  negotiation_terms: string | null;
}

// Add these type definitions at the top of the file with other interfaces
interface EvaluationData {
  evaluation_type: {
    type: string | null;
    description: string | null;
    justification: string | null;
  } | null;
  stages: Array<{
    stage_name: string | null;
    stage_type: string | null;
    sequence_number: string | number | null;
    description: string | null;
    is_eliminatory: boolean | null;
  }> | null;
  technical_evaluation: {
    weightage: number | null;
    minimum_qualifying_score: number | null;
    scoring_matrix: Array<{
      criteria_category: string | null;
      parameters: Array<{
        parameter_name: string | null;
        max_marks: number | null;
        scoring_method: string | null;
        supporting_documents: string | null;
        evaluation_notes: string | null;
      }> | null;
      category_weightage: number | null;
    }> | null;
    scoring_formula: string | null;
    normalization_method: string | null;
  } | null;
  financial_evaluation: {
    weightage: number | null;
    bid_format: string | null;
    components: Array<{
      component_name: string | null;
      is_mandatory: boolean | null;
      weightage: number | null;
    }> | null;
    scoring_formula: string | null;
    normalization_method: string | null;
  } | null;
  composite_scoring: {
    formula: string | null;
    example_calculation: string | null;
    special_conditions: string[] | null;
  } | null;
  selection_method: {
    primary_criteria: string | null;
    tie_breaker: string | null;
    negotiation_terms: string | null;
  } | null;
  disqualification_criteria: Array<{
    criteria: string | null;
    stage: string | null;
    verification_method: string | null;
  }> | null;
  specific_requirements: {
    L1_specific: {
      price_preference: string | null;
      purchase_preference: string | null;
      msme_benefits: string | null;
    } | null;
    qcbs_specific: {
      technical_weightage: number | null;
      financial_weightage: number | null;
      scoring_formula: string | null;
    } | null;
    qbs_specific: {
      negotiation_process: string | null;
      fallback_options: string | null;
    } | null;
    fbs_specific: {
      budget_ceiling: number | null;
      compliance_requirements: string | null;
    } | null;
    lcs_specific: {
      technical_threshold: number | null;
      cost_evaluation_method: string | null;
    } | null;
    sss_specific: {
      justification: string | null;
      approval_requirements: string | null;
    } | null;
    era_specific: {
      auction_rules: string | null;
      decrement_value: number | null;
      duration: number | null;
    } | null;
  } | null;
}

// Add this interface near the top of the file with other interfaces
interface SubmissionFormat {
  format_type?: string | null;
  number_of_copies?: string | number | null;
  special_instructions?: string | null;
}

const TenderSummary = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('table_of_contents');
  const [activeScopeTab, setActiveScopeTab] = useState('project_overview');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
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
  const [orgName] = useState<string>('lepton');
  const [reanalyzingSection, setReanalyzingSection] = useState<string | null>(null);
  const [sectionStatus, setSectionStatus] = useState<SectionStatus | null>(null);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isEmdModalOpen, setIsEmdModalOpen] = useState(false);
  const [isTenderFeeModalOpen, setIsTenderFeeModalOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [assignments, setAssignments] = useState<{ [key: number]: string }>({});
  const [editingAssignment, setEditingAssignment] = useState<number | null>(null);
  const [expandedTocSections, setExpandedTocSections] = useState<{ [key: number]: boolean }>({});
  const [showPdf, setShowPdf] = useState(false);
  const [currentPdfPage, setCurrentPdfPage] = useState<number | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [activeEligibilityTab, setActiveEligibilityTab] = useState('legal');
  // Add this near the top of the component with other state declarations
  const [expandedTasks, setExpandedTasks] = useState<number[]>([]);
  // Add this near the top with other state declarations
  const [expandedDeliverables, setExpandedDeliverables] = useState<number[]>([]);
  const [feedbackFormOpen, setFeedbackFormOpen] = useState(false);
  const [feedbackSection, setFeedbackSection] = useState<string | null>(null);
  const [feedbackSubsection, setFeedbackSubsection] = useState<string | null>(null);
  
  const handleCloseFeedback = () => {
    setFeedbackFormOpen(false);
    setFeedbackSection(null);
    setFeedbackSubsection(null);
  }; // Close and reset feedback form states

  const tenderIdNum = id ? parseInt(id, 10) : undefined; // Convert id to number

  const deleteCorrigendumMutation = useDeleteCorrigendum();
  const uploadCorrigendumMutation = useUploadCorrigendum();

  const handleDeleteCorrigendum = (corrigendumId: number) => {
    if (tenderIdNum) {
      deleteCorrigendumMutation.mutate({ corrigendumId, tenderId: tenderIdNum });
    }
  };

  const handleUploadCorrigendum = (file: File) => {
    if (tenderIdNum) {
      uploadCorrigendumMutation.mutate({ tenderId: tenderIdNum, file });
    }
  };

  // Add useEffect for initial tab selection
  useEffect(() => {
    setActiveTab('table_of_contents');
  }, []); // Empty dependency array means this runs once when component mounts

  // Add PDF query near other queries
  const pdfQuery = useQuery({
    queryKey: ['tender-pdf', id],
    queryFn: async () => {
      if (!pdfUrl) return null;
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    enabled: !!pdfUrl,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  // React Query hooks for each section
  const scopeQuery = useSectionDetails(
    id || '', 
    'scope_of_work', 
    orgName || undefined, 
    isSectionAccessible('scope', sectionStatus, sectionApiMapping) && activeTab === 'scope'
  );
  
  const tenderSummaryQuery = useSectionDetails(id || '', 'tender_summary', orgName || undefined, true); // Always enabled
  const eligibilityQuery = useSectionDetails(
    id || '', 
    'eligibility_conditions', 
    orgName || undefined, 
    activeTab === 'eligibility' && isSectionAccessible('eligibility', sectionStatus, sectionApiMapping)
  );
  const technicalQuery = useSectionDetails(
    id || '', 
    'technical_requirements', 
    orgName || undefined, 
    activeTab === 'technical' && isSectionAccessible('technical', sectionStatus, sectionApiMapping)
  );
  const financialQuery = useSectionDetails(
    id || '', 
    'financial_requirements', 
    orgName || undefined, 
    activeTab === 'financial' && isSectionAccessible('financial', sectionStatus, sectionApiMapping)
  );
  const boqQuery = useSectionDetails(
    id || '', 
    'bill_of_quantities', 
    orgName || undefined, 
    activeTab === 'boq' && isSectionAccessible('boq', sectionStatus, sectionApiMapping)
  );
  const conditionsQuery = useSectionDetails(
    id || '', 
    'conditions_of_contract', 
    orgName || undefined, 
    activeTab === 'conditions' && isSectionAccessible('conditions', sectionStatus, sectionApiMapping)
  );
  const complianceQuery = useSectionDetails(
    id || '', 
    'compliance_requirements', 
    orgName || undefined, 
    activeTab === 'compliance' && isSectionAccessible('compliance', sectionStatus, sectionApiMapping)
  );
  const datesQuery = useSectionDetails(
    id || '', 
    'important_dates', 
    orgName || undefined, 
    activeTab === 'dates' && isSectionAccessible('dates', sectionStatus, sectionApiMapping)
  );
  const annexuresQuery = useSectionDetails(
    id || '', 
    'annexures_attachments', 
    orgName || undefined, 
    activeTab === 'submission' && isSectionAccessible('submission', sectionStatus, sectionApiMapping)
  );
  const evaluationQuery = useSectionDetails(
    id || '', 
    'evaluation_criteria', 
    orgName || undefined, 
    activeTab === 'evaluation' && isSectionAccessible('evaluation', sectionStatus, sectionApiMapping)
  );

  // Add table of contents query
  const tableOfContentsQuery = useSectionDetails(
    id || '', 
    'table_of_contents', 
    orgName || undefined, 
    activeTab === 'table_of_contents' && isSectionAccessible('table_of_contents', sectionStatus, sectionApiMapping)
  );

  // Mutation for reanalyzing sections
  const reanalyzeMutation = useReanalyzeSection();

  // Check if initial data is loading
  const isInitialLoading = tenderSummaryQuery.isLoading

  // Check if active section is loading
  const isActiveSectionLoading = () => {
    switch (activeTab) {
      case 'scope':
        return scopeQuery.isLoading;
      case 'eligibility':
        return eligibilityQuery.isLoading;
      case 'technical':
        return technicalQuery.isLoading;
      case 'financial':
        return financialQuery.isLoading;
      case 'boq':
        return boqQuery.isLoading;
      case 'conditions':
        return conditionsQuery.isLoading;
      case 'compliance':
        return complianceQuery.isLoading;
      case 'dates':
        return datesQuery.isLoading;
      case 'submission':
        return annexuresQuery.isLoading;
      case 'evaluation':
        return evaluationQuery.isLoading;
      case 'table_of_contents':
        return tableOfContentsQuery.isLoading;
      default:
        return false;
    }
  };

  // Check if any section has errored
  const hasError = [
    scopeQuery,
    tenderSummaryQuery
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
      const statusUrl = `https://api.smarttender.rio.software/api/section-status?tender_id=${id}&user_id=123&org_name=lepton`;
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
        case 'evaluation': return evaluationQuery;
        case 'compliance': return complianceQuery;
        case 'table_of_contents': return tableOfContentsQuery;
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
          let url = `https://api.smarttender.rio.software/api/tender/${id}?user_id=123`;
          // Always use lepton as the default org_name if none is provided
          const effectiveOrgName = orgName || 'lepton';
          url += `&org_name=${encodeURIComponent(effectiveOrgName)}`;
        
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
        const statusUrl = `https://api.smarttender.rio.software/api/section-status?tender_id=${id}&user_id=123&org_name=lepton`;
        const response = await fetch(statusUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch tender data');
        }
        const data = await response.json();
        setSectionStatus(data);
        setOriginalTenderName(data.tender_name);
        
        // Check if any section needs polling (is analyzing or null)
        const needsPolling = Object.values(data.sections).includes("analyzing")
        setIsPolling(needsPolling);
      } catch (error) {
        console.error('Error fetching section status:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSectionStatus();

    // Set up polling interval
    const pollInterval = setInterval(() => {
      if (isPolling) {
        fetchSectionStatus();
      }
    }, POLLING_INTERVAL);

    // Cleanup function
    return () => {
      clearInterval(pollInterval);
    };
  }, [id, isPolling]); // Added isPolling to dependencies

  // Update checkAllSectionsFailed to use sectionStatus
  const checkAllSectionsFailed = () => {
    if (!sectionStatus?.sections) return false;
    
    // Get the status of scope of work and tender summary sections
    const tableofContentsStatus = sectionStatus.sections['table_of_contents']?.status;
    const tenderSummaryStatus = sectionStatus.sections['tender_summary']?.status;
    
    // Show analyzing state if either:
    // 1. Both sections are in analyzing state
    // 2. One section is analyzing and other is null (not analyzed yet)
    // 3. Both sections are null (not analyzed yet)
    return (tableofContentsStatus === 'analyzing' || tableofContentsStatus === null) && 
           (tenderSummaryStatus === 'analyzing' || tenderSummaryStatus === null) &&
           // At least one section should be analyzing or both should be null
           (tableofContentsStatus === 'analyzing' || tenderSummaryStatus === 'analyzing' || 
            (tableofContentsStatus === null && tenderSummaryStatus === null));
  };

  // Function to trigger analysis
  const handleAnalyze = async () => {
    if (!id || analyzing) return;
    
    setAnalyzing(true);
    try {
      let analyzeUrl = `https://api.smarttender.rio.software/tenderanalysis/analyze-tender?tender_id=${id}&user_id=123`;
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
    const fetchDocuments = async () => {
      try {
        // Check if the files endpoint exists
        const response = await fetch('https://api.smarttender.rio.software/api/files?user_id=123');
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
      const response = await fetch(`https://api.smarttender.rio.software/api/tender-documents/${tenderId}`);
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

      const response = await fetch(`https://api.smarttender.rio.software/api/tender-documents/${tenderId}`, {
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

      const response = await fetch('https://api.smarttender.rio.software/api/ai-recommend/', {
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
      const testResponse = await fetch('https://api.smarttender.rio.software/api/ai-recommend/', {
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

        const response = await fetch('https://api.smarttender.rio.software/api/ai-recommend/', {
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
      const response = await fetch(`https://api.smarttender.rio.software/api/tender-documents/${id}`, {
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
      const response = await fetch('https://api.smarttender.rio.software/api/upload', {
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
      const docsResponse = await fetch('https://api.smarttender.rio.software/api/files?user_id=123');
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
    
    // Ensure the URL is absolute by adding https:// if needed
    const absoluteUrl = portalLink.startsWith('http://') || portalLink.startsWith('https://')
      ? portalLink
      : `https://${portalLink}`;
    
    return (
      <a 
        href={absoluteUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 shadow-sm transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
      ? tableData.headers.split(',').map(h => h.trim())
      : tableData.headers;

    // Convert comma-separated rows string to array if needed
    const rows = typeof tableData.rows === 'string'
      ? tableData.rows.split('\n').map(row => row.split(',').map(cell => cell.trim()))
      : tableData.rows;

    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return null;
    }

    // Function to safely convert any value to a string and trim it
    const formatCell = (cell: any): string => {
      if (cell === null || cell === undefined) return '-';
      if (typeof cell === 'string') return cell.trim();
      if (typeof cell === 'number') return cell.toString();
      if (typeof cell === 'boolean') return cell.toString();
      if (typeof cell === 'object') {
        // Handle object values by extracting meaningful information
        const values = Object.values(cell)
          .filter(val => val !== null && val !== undefined)
          .map(val => {
            if (typeof val === 'object') {
              // For nested objects, just show a summary
              return 'Details available';
            }
            return String(val);
          });
        return values.join(', ') || '-';
      }
      return String(cell);
    };

    // Get table name if available
    const tableName = 'table_name' in tableData ? tableData.table_name : null;

    return (
      <div>
        {tableName && (
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-50 rounded-lg mr-3">
              <FileText size={20} className="text-blue-600" />
            </div>
            <h4 className="text-base font-semibold text-gray-900">{tableName}</h4>
          </div>
        )}
        {!tableName && (
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gray-50 rounded-lg mr-3">
              <Table size={20} className="text-gray-600" />
            </div>
            <h4 className="text-base font-medium text-gray-700">Detailed Information</h4>
          </div>
        )}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-white">
                    {headers.map((header, index) => (
                      <th 
                        key={index}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {formatCell(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex} 
                      className="group transition-colors hover:bg-blue-50/50"
                    >
                      {Array.isArray(row) ? (
                        row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex}
                            className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-600 group-hover:text-gray-900"
                          >
                            {formatCell(cell)}
                          </td>
                        ))
                      ) : (
                        headers.map((header, cellIndex) => (
                          <td 
                            key={cellIndex}
                            className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-600 group-hover:text-gray-900"
                          >
                            {formatCell(row[header])}
                          </td>
                        ))
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
    const sectionState = getSectionState(id, sectionStatus, sectionApiMapping);
    const isAccessible = sectionState === 'success';
    const isAnalyzing = sectionState === 'analyzing';
    const hasFailed = sectionState === 'failed';
    
    return (
      <div className="flex flex-col flex-1">
        <button
          key={id}
          onClick={() => handleTabClick(id)}
          disabled={!isAccessible && !isAnalyzing}
          className={`
            w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            transition-colors relative
            ${isActive 
              ? 'bg-blue-600 text-white' 
              : isAccessible
                ? 'text-gray-600 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed bg-gray-50'
            }
          `}
        >
          {icon}
          <span>{label}</span>
          {isAnalyzing && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
          {hasFailed && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
          )}
          {!isAccessible && !isAnalyzing && !hasFailed && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Clock size={16} className="text-gray-400" />
            </div>
          )}
        </button>
        
        {/* Status badge for section state */}
        {!isNavCollapsed && (
          <div className="mt-1 ml-8">
            {isAnalyzing && (
              <StatusBadge status="Analyzing" color="blue" />
            )}
            {hasFailed && (
              <StatusBadge status="Failed" color="red" />
            )}
            {isAccessible && (
              <StatusBadge status="Completed" color="green" />
            )}
          </div>
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
    if (visibleTabsStart + 5 < visibleTabs.length) {
      setVisibleTabsStart(visibleTabsStart + 5);
    }
  };

  // Update the renderActiveTabContent function
  function renderActiveTabContent() {
    const sectionState = getSectionState(activeTab, sectionStatus, sectionApiMapping);

    if (sectionState === 'analyzing') {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">This section is being analyzed...</p>
        </div>
      );
    }

    if (sectionState === null) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Clock size={32} className="text-gray-400 mb-4" />
          <p className="text-gray-600">This section has not been analyzed yet</p>
        </div>
      );
    }

    if (sectionState === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle size={32} className="text-amber-500 mb-4" />
          <p className="text-gray-600 mb-2">Failed to analyze this section</p>
          <button
            onClick={() => handleSectionReanalysis(activeTab)}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (isActiveSectionLoading()) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'table_of_contents':
        return renderTableOfContents();
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
      case 'compliance':
        return renderComplianceRequirements();
      case 'dates':
        return renderImportantDates();
      case 'submission':
        return renderSubmissionRequirements();
      default:
        return null;
    }
  }

  // Update the main loading check
  if (isInitialLoading) {
    return (
      <div className="w-full text-center py-12">
        <div className="w-32 h-32 mx-auto bg-blue-100 rounded-lg animate-pulse"></div>
        <div className="mt-4 h-4 w-48 mx-auto bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800">Error loading tender</h2>
        <p className="text-gray-600 mt-2">Failed to load initial tender data</p>
      </div>
    );
  }

  if (checkAllSectionsFailed()) {
    return (
      <div className="w-full">
        <div className="mb-6">
         
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

  // Get tender summary data from the query
  const tenderSummaryData = tenderSummaryQuery.data?.processed_section || {
    title: null,
    tenderNumber: null,
    issuingAuthority: null,
    tenderMode: null,
    portalLink: null,
    financial_requirements: {
      emd: {
        amount: null,
        payment_mode: null,
        validity_period: null,
        exemptions: null,
        refund_terms: null
      },
      tender_fee: {
        amount: null,
        payment_mode: null,
        is_refundable: null,
        exemptions: null
      },
      estimated_value: null
    }
  };

  // Filter out empty sections and update the existing visibleTabs
  const visibleTabs = TABS
    .filter(tab => {
      const sectionState = getSectionState(tab.id, sectionStatus, sectionApiMapping);
      return sectionState === 'success' || sectionState === 'analyzing';
    })
    .slice(visibleTabsStart, visibleTabsStart + 5);

  // Update the renderContentSection function to handle all cases and ensure contentItems is always defined before use
  const renderContentSection = (data: any) => {
    if (!data || typeof data !== 'object') {
      return null;
    }

    // Handle processed_section wrapper if present
    if (data.processed_section) {
      return renderContentSection(data.processed_section);
    }

    // If data is an array of content items (most sections follow this format)
    if (Array.isArray(data)) {
      let currentGroup: any[] = [];
      let groups: any[] = [];
      let groupId = 0;

      // Group consecutive items of the same type
      data.forEach((item, index) => {
        if (!item) return;

        if (currentGroup.length === 0 || currentGroup[0].formatHint === item.formatHint) {
          currentGroup.push(item);
        } else {
          groups.push({ id: groupId++, items: currentGroup });
          currentGroup = [item];
        }

        if (index === data.length - 1 && currentGroup.length > 0) {
          groups.push({ id: groupId++, items: currentGroup });
        }
      });

      return groups.map(group => {
        const firstItem = group.items[0];

        // Handle table group
        if (firstItem.formatHint === 'table_block') {
          return (
            <div key={group.id} className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-all duration-200">
              {group.items.map((item: any, index: number) => (
                <div key={index} className="mb-6 last:mb-0">
                  {renderTableData(item.tableData)}
                </div>
              ))}
            </div>
          );
        }

        // Handle list items group
        if (firstItem.formatHint === 'list_item') {
          return (
            <div key={group.id} className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-all duration-200">
              <div className="space-y-3">
                {group.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-start group">
                    <div className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-2 mr-3 group-hover:scale-110 transition-transform duration-200"></div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{item.itemText}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Handle text content group
        if (firstItem.formatHint === 'text' || firstItem.itemText) {
          return (
            <div key={group.id} className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-all duration-200">
              <div className="space-y-4">
                {group.items.map((item: any, index: number) => (
                  <div key={index} className="prose max-w-none">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{item.itemText}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      });
    }

    // Handle object data by converting it to a list of key-value pairs
    if (typeof data === 'object' && !Array.isArray(data)) {
      const entries = Object.entries(data);
      if (entries.length === 0) return null;

      // Special handling for specific_requirements
      if ('specific_requirements' in data) {
        const specificReqs = data.specific_requirements;
        if (!specificReqs) return null;

      return (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-all duration-200">
            <h4 className="text-base font-medium text-gray-900 mb-4">Specific Requirements</h4>
        <div className="space-y-6">
              {Object.entries(specificReqs).map(([key, value]) => {
                // Skip if the value is null
                if (!value) return null;

                // Format the key for display
                const displayKey = key.split('_')[0].toUpperCase();

                // Handle the case where value is an object
                if (typeof value === 'object') {
                  // Check if all values in the object are null
                  const hasNonNullValue = Object.values(value).some(v => v !== null);
                  if (!hasNonNullValue) return null;

                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">{displayKey} Specific Requirements</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(value).map(([subKey, subValue]) => {
                          if (subValue === null) return null;
                          
                          return (
                            <div key={subKey} className="bg-white rounded p-3 shadow-sm">
                              <p className="text-xs text-gray-500 mb-1 capitalize">
                                {subKey.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-gray-900">{String(subValue)}</p>
                </div>
                          );
                        })}
              </div>
                </div>
                  );
                }

                // Handle the case where value is a primitive
                return (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900">{displayKey} Specific Requirements</h5>
                    <p className="text-sm text-gray-600 mt-2">{String(value)}</p>
                </div>
                );
              })}
              </div>
        </div>
      );
    }

      return (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-all duration-200">
          <div className="space-y-4">
            {entries.map(([key, value], index) => {
              // Skip rendering if value is null, undefined, or an empty object/array
              if (value === null || value === undefined || 
                 (typeof value === 'object' && Object.keys(value).length === 0) ||
                 (Array.isArray(value) && value.length === 0)) {
                return null;
              }

              // If value is an object or array, recursively render it
              if (typeof value === 'object') {
                return (
                  <div key={index} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    {renderContentSection(value)}
                  </div>
                );
              }

              // Render primitive values
              return (
                <div key={index} className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-600 mt-1">
                    {String(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  // Update the section render functions
    function renderScopeOfWork() {
    if (scopeQuery.isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
          </div>
        </div>
      );
    }
    
    if (scopeQuery.isError) return <div>Error loading scope of work</div>;
    if (!scopeQuery.data?.processed_section) return null;

    const scopeData = scopeQuery.data.processed_section;
    
    // Add null checks for all sections
    if (!scopeData) return null;
    
    // Ensure all required objects exist with proper defaults
    scopeData.project_overview = scopeData.project_overview || { summary: null, background: null };
    scopeData.detailed_tasks = Array.isArray(scopeData.detailed_tasks) ? scopeData.detailed_tasks : [];
    scopeData.detailed_tasks.forEach((task: { activities: string[] }) => {
      task.activities = Array.isArray(task.activities) ? task.activities : [];
    });

    scopeData.deliverables = Array.isArray(scopeData.deliverables) ? scopeData.deliverables : [];
    
    if (scopeData.timeline) {
      scopeData.timeline.milestones = Array.isArray(scopeData.timeline.milestones) ? scopeData.timeline.milestones : [];
      scopeData.timeline.milestones.forEach((milestone: { deliverables: string[] }) => {
        milestone.deliverables = Array.isArray(milestone.deliverables) ? milestone.deliverables : [];
      });
    } else {
      scopeData.timeline = {
        total_duration: '',
        milestones: [],
        phasing_details: ''
      };
    }

    if (scopeData.location) {
      scopeData.location.specific_locations = Array.isArray(scopeData.location.specific_locations) ? 
        scopeData.location.specific_locations : [];
    } else {
      scopeData.location = {
        work_mode: '',
        specific_locations: [],
        site_requirements: ''
      };
    }

    // Ensure resources arrays are properly initialized
    if (scopeData.resources?.manpower) {
      scopeData.resources.manpower.key_personnel = Array.isArray(scopeData.resources.manpower.key_personnel) ?
        scopeData.resources.manpower.key_personnel : [];
    }
    
    if (scopeData.resources?.equipment) {
      scopeData.resources.equipment.contractor_provided = Array.isArray(scopeData.resources.equipment.contractor_provided) ?
        scopeData.resources.equipment.contractor_provided : [];
      scopeData.resources.equipment.client_provided = Array.isArray(scopeData.resources.equipment.client_provided) ?
        scopeData.resources.equipment.client_provided : [];
    }

    // Ensure performance standards arrays are properly initialized
    if (scopeData.performance_standards) {
      scopeData.performance_standards.service_levels = Array.isArray(scopeData.performance_standards.service_levels) ?
        scopeData.performance_standards.service_levels : [];
    }

    // Ensure training arrays are properly initialized
    if (scopeData.training) {
      scopeData.training.target_audience = Array.isArray(scopeData.training.target_audience) ?
        scopeData.training.target_audience : 
        (scopeData.training.target_audience ? [scopeData.training.target_audience] : []);
    }
    
    scopeData.support = scopeData.support || { 
      warranty_period: null, 
      maintenance_support: '', 
      sla_terms: '' 
    };

    // Initialize resources if not present
    scopeData.resources = scopeData.resources || {
      manpower: { 
        team_structure: '', 
        key_personnel: [], 
        minimum_qualifications: '' 
      },
      equipment: { 
        contractor_provided: [], 
        client_provided: [] 
      }
    };

    // Initialize performance standards if not present
    scopeData.performance_standards = scopeData.performance_standards || { 
      service_levels: [], 
      quality_requirements: '' 
    };

         // Initialize training if not present
     scopeData.training = scopeData.training || { 
       is_required: false, 
       target_audience: [], 
       training_scope: '', 
       duration: null 
     };

     const scopeTabs = [
       { id: 'project_overview', label: 'Project Overview', icon: <FileText className="w-5 h-5" /> },
       { id: 'detailed_tasks', label: 'Tasks & Activities', icon: <ListTodo className="w-5 h-5" /> },
       { id: 'deliverables', label: 'Deliverables', icon: <Package className="w-5 h-5" /> },
       { id: 'timeline', label: 'Timeline', icon: <Calendar className="w-5 h-5" /> },
       { id: 'location', label: 'Location', icon: <MapPin className="w-5 h-5" /> },
       { id: 'resources', label: 'Resources', icon: <Users className="w-5 h-5" /> },
       { id: 'performance_standards', label: 'Performance', icon: <Target className="w-5 h-5" /> },
       { id: 'training', label: 'Training', icon: <GraduationCap className="w-5 h-5" /> },
       { id: 'support', label: 'Support', icon: <LifeBuoy className="w-5 h-5" /> },
     ];
    
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Scope of Work</h3>
          <div className="flex items-center text-sm text-gray-500">
            <FileText size={16} className="mr-1" />
            <span>Project Details</span>
          </div>
        </div>
        
        <div className="flex space-x-6">
          {/* Vertical Tabs */}
          <div className="w-64 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {scopeTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveScopeTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors
                    ${activeScopeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {tab.icon}
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-[600px] bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeScopeTab === 'project_overview' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="mr-2 text-blue-500" size={20} />
                    Project Overview
                  </div>
                  <button
                    onClick={() => handleOpenFeedback('Scope of Work', 'Project Overview')}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Project Overview"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </h4>
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4 max-w-2xl">
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Summary
                    </h5>
                    <p className="text-sm text-gray-600 leading-relaxed">{scopeData.project_overview.summary}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Background
                    </h5>
                    <div className="prose max-w-none">
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{scopeData.project_overview.background}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeScopeTab === 'detailed_tasks' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <ListTodo className="mr-2 text-green-500" size={20} />
                    Detailed Tasks
                  </div>
                  <button
                    onClick={() => handleOpenFeedback('Scope of Work', 'Tasks & Activities')}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Detailed Tasks"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </h4>
                <div className="space-y-4">
                  {(scopeData.detailed_tasks || []).map((task: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => setExpandedTasks(prev => 
                          prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
                        )}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex items-center">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 text-sm font-semibold mr-3">
                            {index + 1}
                          </span>
                          <h5 className="text-base font-medium text-gray-900">{task.task_category}</h5>
                      </div>
                        <div className="flex items-center space-x-2">
                          {task.technical_specifications && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Tech Specs
                            </span>
                          )}
                          {task.dependencies && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Dependencies
                            </span>
                          )}
                          {expandedTasks.includes(index) ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {expandedTasks.includes(index) && (
                        <div className="border-t border-gray-200 px-6 py-4">
                        <div className="space-y-4">
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-3">Activities:</h6>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(task.activities || []).map((activity: string, actIndex: number) => (
                                  <li key={actIndex} className="flex items-start">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                    <span className="text-sm text-gray-600">{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                          {task.technical_specifications && (
                              <div className="bg-blue-50 rounded-lg p-4">
                              <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Code className="mr-2 text-blue-500" size={16} />
                                Technical Specifications
                              </h6>
                              <p className="text-sm text-gray-600 leading-relaxed">{task.technical_specifications}</p>
                            </div>
                          )}

                          {task.dependencies && (
                              <div className="bg-purple-50 rounded-lg p-4">
                              <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <GitBranch className="mr-2 text-purple-500" size={16} />
                                Dependencies
                              </h6>
                              <p className="text-sm text-gray-600 leading-relaxed">{task.dependencies}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeScopeTab === 'deliverables' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="mr-2 text-orange-500" size={20} />
                    Deliverables
                  </div>
                  <button
                    onClick={() => handleOpenFeedback('Scope of Work', 'Deliverables')}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Deliverables"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </h4>
                <div className="space-y-4">
                  {(scopeData.deliverables || []).map((deliverable: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => setExpandedDeliverables(prev => 
                          prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
                        )}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex items-center">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-semibold mr-3">
                            {index + 1}
                        </span>
                          <h5 className="text-base font-medium text-gray-900">{deliverable.name}</h5>
                      </div>
                        <div className="flex items-center space-x-2">
                          {deliverable.frequency && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {deliverable.frequency}
                            </span>
                          )}
                          {expandedDeliverables.includes(index) ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                      </div>
                      </button>

                      {expandedDeliverables.includes(index) && (
                        <div className="border-t border-gray-200 px-6 py-4">
                          <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Description</h6>
                              <p className="text-sm text-gray-600 leading-relaxed">{deliverable.description}</p>
                            </div>

                            {deliverable.frequency && (
                              <div className="bg-green-50 rounded-lg p-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <Clock className="mr-2 text-green-500" size={16} />
                                  Frequency
                                </h6>
                                <p className="text-sm text-gray-600">{deliverable.frequency}</p>
                          </div>
                        )}

                        {deliverable.acceptance_criteria && (
                              <div className="bg-purple-50 rounded-lg p-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <CheckSquare className="mr-2 text-purple-500" size={16} />
                                  Acceptance Criteria
                                </h6>
                                <p className="text-sm text-gray-600 leading-relaxed">{deliverable.acceptance_criteria}</p>
                          </div>
                        )}
                      </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {(!scopeData.deliverables || scopeData.deliverables.length === 0) && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No Deliverables</h3>
                      <p className="mt-1 text-sm text-gray-500">No deliverables have been specified for this project.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeScopeTab === 'timeline' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="mr-2 text-blue-500" size={20} />
                    Timeline
                  </div>
                  <button
                    onClick={() => handleOpenFeedback('Scope of Work', 'Timeline')}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Timeline"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </h4>
                <div className="mb-6">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700">
                    <Clock size={16} className="mr-2" />
                    Total Duration: {scopeData?.timeline?.total_duration || 'Not specified'}
                  </div>
                </div>
                <div className="relative">
                  {(scopeData.timeline?.milestones || []).map((milestone: any, index: number) => (
                    <div key={index} className="relative pl-8 pb-8 last:pb-0">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-blue-200"></div>
                      <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                      <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h6 className="text-sm font-medium text-gray-900">{milestone.name || 'Untitled Milestone'}</h6>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {milestone.deadline || 'No deadline set'}
                          </span>
                        </div>
                        <div className="mt-3">
                          <h6 className="text-xs font-medium text-gray-500 mb-2">Deliverables:</h6>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(milestone?.deliverables || []).map((del: string, delIndex: number) => (
                              <li key={delIndex} className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                <span className="text-sm text-gray-600">{del || 'Untitled Deliverable'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {scopeData?.timeline?.phasing_details && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h6 className="text-sm font-medium text-gray-700 mb-2">Phasing Details:</h6>
                    <p className="text-sm text-gray-600 leading-relaxed">{scopeData.timeline.phasing_details}</p>
                  </div>
                )}
              </div>
            )}

            {activeScopeTab === 'location' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="mr-2 text-indigo-500" size={20} />
                    Location
                  </div>
                  <button
                    onClick={() => handleOpenFeedback('Scope of Work', 'Location')}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Location"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <Globe className="text-indigo-500" size={16} />
                      </div>
                      <div>
                        <h6 className="text-sm font-medium text-gray-900">Work Mode</h6>
                        <p className="text-sm text-gray-600">{scopeData?.location?.work_mode || 'Not specified'}</p>
                      </div>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Specific Locations:</h6>
                      <ul className="space-y-2">
                        {(scopeData.location?.specific_locations || []).map((location: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <MapPin size={16} className="text-indigo-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-600">{location}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <Building className="text-purple-500" size={16} />
                      </div>
                      <h6 className="text-sm font-medium text-gray-900">Site Requirements</h6>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{scopeData?.location?.site_requirements || 'No site requirements specified'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeScopeTab === 'resources' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 text-pink-500" size={20} />
                    Resources
                  </div>
                  <button
                    onClick={() => handleOpenFeedback('Scope of Work', 'Resources')}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Resources"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                        <Users className="text-pink-500" size={16} />
                      </div>
                      <h5 className="text-base font-medium text-gray-900">Manpower</h5>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Team Structure</h6>
                        <p className="text-sm text-gray-600">{scopeData.resources?.manpower?.team_structure || 'Not specified'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Key Personnel</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(scopeData.resources?.manpower?.key_personnel || []).map((person: any, index: number) => (
                            <div key={index} className="flex items-center">
                              <User size={14} className="text-pink-500 mr-2" />
                              <span className="text-sm text-gray-600">
                                {typeof person === 'object' ? (
                                  <div className="space-y-1">
                                    <div>Role: {person.role || 'Not specified'}</div>
                                    <div>Qualifications: {person.qualifications || 'Not specified'}</div>
                                    <div>Experience: {person.experience || 'Not specified'}</div>
                                    {person.certifications && (
                                      <div>Certifications: {person.certifications}</div>
                                    )}
                                    {person.minimum_number && (
                                      <div>Minimum Number: {person.minimum_number}</div>
                                    )}
                                  </div>
                                ) : (
                                  person || 'Unnamed Personnel'
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Minimum Qualifications</h6>
                        <p className="text-sm text-gray-600">{scopeData.resources?.manpower?.minimum_qualifications || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mr-3">
                        <Wrench className="text-rose-500" size={16} />
                      </div>
                      <h5 className="text-base font-medium text-gray-900">Equipment</h5>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Contractor Provided</h6>
                        <ul className="space-y-2">
                          {(scopeData.resources?.equipment?.contractor_provided || []).map((item: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <Check size={14} className="text-rose-500 mr-2" />
                              <span className="text-sm text-gray-600">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Client Provided</h6>
                        <ul className="space-y-2">
                          {(scopeData.resources?.equipment?.client_provided || []).map((item: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <Check size={14} className="text-rose-500 mr-2" />
                              <span className="text-sm text-gray-600">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeScopeTab === 'performance_standards' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="mr-2 text-yellow-500" size={20} />
                    Performance Standards
                  </div>
                  <button
                    onClick={() => handleOpenFeedback('Scope of Work', 'Performance')}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Performance Standards"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </h4>
                <div className="space-y-6">
                  {/* Service Levels */}
                  <div className="grid grid-cols-1 gap-4">
                        {(scopeData?.performance_standards?.service_levels || []).map((level: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-yellow-200 transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <Target className="h-5 w-5 text-yellow-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-base font-medium text-gray-900">{level?.parameter || 'Unnamed Parameter'}</h3>
                              <p className="mt-1 text-sm text-gray-500">Target: {level?.target || 'Not specified'}</p>
                            </div>
                          </div>
                          {level?.penalty && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Penalty: {level.penalty}
                              </span>
                          )}
                        </div>
                        {level?.measurement && (
                          <div className="mt-4 bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center">
                              <Ruler className="h-4 w-4 text-gray-400 mr-2" />
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Measurement Method:</span> {level.measurement}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Empty State for Service Levels */}
                  {(!scopeData?.performance_standards?.service_levels || scopeData.performance_standards.service_levels.length === 0) && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Target className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No Service Levels</h3>
                      <p className="mt-1 text-sm text-gray-500">No service level requirements have been specified.</p>
                  </div>
                  )}

                  {/* Quality Requirements */}
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Shield className="h-6 w-6 text-yellow-500 mr-3" />
                      <h5 className="text-base font-medium text-gray-900">Quality Requirements</h5>
                    </div>
                    <div className="prose max-w-none">
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {scopeData?.performance_standards?.quality_requirements || 'No quality requirements specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeScopeTab === 'training' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <GraduationCap className="mr-2 text-emerald-500" size={20} />
                    Training
                  </div>
                  <button
                    onClick={() => handleOpenFeedback('Scope of Work', 'Training')}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Training"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                      <CheckCircle className="text-emerald-500" size={16} />
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-gray-900">Training Required</h6>
                      <p className="text-sm text-gray-600">{scopeData.training.is_required ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  {scopeData.training.is_required && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-3">Target Audience</h6>
                        {scopeData?.training?.target_audience ? (
                          Array.isArray(scopeData.training.target_audience) ? (
                            <ul className="space-y-2">
                              {scopeData.training.target_audience.map((audience: string, index: number) => (
                                <li key={index} className="flex items-center">
                                  <Users size={14} className="text-emerald-500 mr-2" />
                                  <span className="text-sm text-gray-600">{audience}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="flex items-center">
                              <Users size={14} className="text-emerald-500 mr-2" />
                              <span className="text-sm text-gray-600">{scopeData.training.target_audience}</span>
                            </div>
                          )
                        ) : (
                          <span className="text-sm text-gray-500">No target audience specified</span>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Training Scope</h6>
                        <p className="text-sm text-gray-600 leading-relaxed">{scopeData.training.training_scope}</p>
                        {scopeData.training.duration && (
                          <div className="mt-3 flex items-center">
                            <Clock size={14} className="text-emerald-500 mr-2" />
                            <span className="text-sm text-gray-600">Duration: {scopeData.training.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeScopeTab === 'support' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <LifeBuoy className="mr-2 text-sky-500" size={20} />
                    Support
                  </div>
                  <button
                    onClick={() => handleOpenFeedback('Scope of Work', 'Support')}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Support"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {scopeData.support.warranty_period && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Shield className="text-sky-500 mr-2" size={16} />
                        <h6 className="text-sm font-medium text-gray-700">Warranty Period</h6>
                      </div>
                      <p className="text-sm text-gray-600">{scopeData.support.warranty_period}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                    <div className="flex items-center mb-3">
                      <Wrench className="text-sky-500 mr-2" size={16} />
                      <h6 className="text-sm font-medium text-gray-700">Maintenance Support</h6>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{scopeData?.support?.maintenance_support || 'No maintenance support details specified'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 md:col-span-3">
                    <div className="flex items-center mb-3">
                      <FileCheck className="text-sky-500 mr-2" size={16} />
                      <h6 className="text-sm font-medium text-gray-700">SLA Terms</h6>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{scopeData?.support?.sla_terms || 'No SLA terms specified'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderEligibilityConditions = () => {
    if (eligibilityQuery.isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
          </div>
        </div>
      );
    }
    if (eligibilityQuery.isError) return <div>Error loading eligibility conditions</div>;
    
    const eligibilityData = eligibilityQuery.data?.processed_section;
    if (!eligibilityData) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Eligibility Conditions</h3>
          {/* <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">View by category:</span>
            <select 
              value={activeEligibilityTab}
              onChange={(e) => setActiveEligibilityTab(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {ELIGIBILITY_TABS.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.name}</option>
              ))}
            </select>
          </div> */}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Eligibility sections">
            {ELIGIBILITY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveEligibilityTab(tab.id)}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                  ${activeEligibilityTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  flex items-center space-x-2
                `}
              >
                <tab.icon size={16} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeEligibilityTab === 'legal' && eligibilityData.legal_eligibility && (
            <div className="space-y-6 animate-fadeIn">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                <div className="flex items-center">
                  <Building className="mr-2 text-blue-500" size={20} />
                  Legal Eligibility
                </div>
                <button
                  onClick={() => handleOpenFeedback('Eligibility', 'Legal')}
                  className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Legal Eligibility"
                >
                  <ThumbsDown size={16} />
                </button>
              </h4>
              {/* Registration Requirements */}
              {eligibilityData.legal_eligibility.registration_requirements?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                  <div className="p-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <FileCheck className="mr-2 text-blue-500" size={20} />
                      Registration Requirements
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {eligibilityData.legal_eligibility.registration_requirements.map((reg: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                          <p className="text-sm font-medium text-gray-900">{reg.document_type}</p>
                          {reg.validity_period && (
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                              <Clock size={14} className="mr-1" />
                              <span>Validity: {reg.validity_period}</span>
                            </div>
                          )}
                          {reg.special_conditions && (
                            <div className="mt-2 flex items-start text-sm text-gray-600">
                              <Info size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                              <span>{reg.special_conditions}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mandatory Licenses */}
              {eligibilityData.legal_eligibility.mandatory_licenses?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                  <div className="p-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <FileCheck className="mr-2 text-green-500" size={20} />
                      Mandatory Licenses
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {eligibilityData.legal_eligibility.mandatory_licenses.map((license: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-green-50 transition-colors">
                          <p className="text-sm font-medium text-gray-900">{license.license_type}</p>
                          <div className="mt-2 space-y-2">
                            {license.issuing_authority && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Building size={14} className="mr-1" />
                                <span>{license.issuing_authority}</span>
                              </div>
                            )}
                            {license.validity_requirements && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock size={14} className="mr-1" />
                                <span>{license.validity_requirements}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Declarations Required */}
              {eligibilityData.legal_eligibility.declarations_required?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                  <div className="p-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <FileText className="mr-2 text-purple-500" size={20} />
                      Required Declarations
                    </h5>
                    <div className="space-y-4">
                      {eligibilityData.legal_eligibility.declarations_required.map((decl: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                          <p className="text-sm font-medium text-gray-900">{decl.declaration_type}</p>
                          <div className="mt-2 space-y-2">
                            {decl.format && (
                              <div className="flex items-center text-sm text-gray-600">
                                <File size={14} className="mr-1" />
                                <span>Format: {decl.format}</span>
                              </div>
                            )}
                            {decl.content && (
                              <div className="flex items-start text-sm text-gray-600">
                                <Info size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                                <span>{decl.content}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeEligibilityTab === 'technical' && eligibilityData.technical_eligibility && (
            <div className="space-y-6 animate-fadeIn">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="mr-2 text-blue-500" size={20} />
                  Technical Eligibility
                </div>
                <button
                  onClick={() => handleOpenFeedback('Eligibility', 'Technical')}
                  className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Technical Eligibility"
                >
                  <ThumbsDown size={16} />
                </button>
              </h4>
              {/* Past Experience */}
              {eligibilityData.technical_eligibility.past_experience && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                  <div className="p-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <Clock className="mr-2 text-blue-500" size={20} />
                      Past Experience Requirements
                    </h5>
                    <div className="space-y-4">
                      {eligibilityData.technical_eligibility.past_experience.similar_work && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h6 className="text-sm font-medium text-blue-900 mb-3">Similar Work Experience</h6>
                          <div className="space-y-3">
                            {eligibilityData.technical_eligibility.past_experience.similar_work.definition && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-sm text-gray-900">{eligibilityData.technical_eligibility.past_experience.similar_work.definition}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {eligibilityData.technical_eligibility.past_experience.similar_work.time_period && (
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                  <p className="text-xs text-gray-500 mb-1">Time Period</p>
                                  <p className="text-sm font-medium text-gray-900">{eligibilityData.technical_eligibility.past_experience.similar_work.time_period}</p>
                                </div>
                              )}
                              {eligibilityData.technical_eligibility.past_experience.similar_work.value_threshold?.project_value && (
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                  <p className="text-xs text-gray-500 mb-1">Project Value</p>
                                  <p className="text-sm font-medium text-gray-900">{eligibilityData.technical_eligibility.past_experience.similar_work.value_threshold.project_value}</p>
                                </div>
                              )}
                              {eligibilityData.technical_eligibility.past_experience.similar_work.value_threshold?.number_of_projects && (
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                  <p className="text-xs text-gray-500 mb-1">Number of Projects</p>
                                  <p className="text-sm font-medium text-gray-900">{eligibilityData.technical_eligibility.past_experience.similar_work.value_threshold.number_of_projects}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Manpower Requirements */}
              {eligibilityData.technical_eligibility.manpower_requirements?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                  <div className="p-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <Users className="mr-2 text-indigo-500" size={20} />
                      Manpower Requirements
                    </h5>
                    <div className="grid grid-cols-1 gap-4">
                      {eligibilityData.technical_eligibility.manpower_requirements.map((req: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-indigo-50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <h6 className="text-sm font-medium text-gray-900">{req.role}</h6>
                            {req.minimum_number && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                Required: {req.minimum_number}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {req.qualifications && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Qualifications</p>
                                <p className="text-sm text-gray-900">{req.qualifications}</p>
                              </div>
                            )}
                            {req.experience && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Experience</p>
                                <p className="text-sm text-gray-900">{req.experience}</p>
                              </div>
                            )}
                            {req.certifications && (
                              <div className="bg-white rounded p-3 shadow-sm md:col-span-2">
                                <p className="text-xs text-gray-500 mb-1">Required Certifications</p>
                                <p className="text-sm text-gray-900">{req.certifications}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Infrastructure Requirements */}
              {eligibilityData.technical_eligibility.infrastructure_requirements?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                  <div className="p-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <Building className="mr-2 text-orange-500" size={20} />
                      Infrastructure Requirements
                    </h5>
                    <div className="grid grid-cols-1 gap-4">
                      {eligibilityData.technical_eligibility.infrastructure_requirements.map((req: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-orange-50 transition-colors">
                          <h6 className="text-sm font-medium text-gray-900 mb-3">{req.requirement_type}</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {req.minimum_capacity && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Minimum Capacity</p>
                                <p className="text-sm text-gray-900">{req.minimum_capacity}</p>
                              </div>
                            )}
                            {req.ownership && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Ownership Requirements</p>
                                <p className="text-sm text-gray-900">{req.ownership}</p>
                              </div>
                            )}
                            {req.quantity && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Required Quantity</p>
                                <p className="text-sm text-gray-900">{req.quantity}</p>
                              </div>
                            )}
                            {req.location && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Location Requirements</p>
                                <p className="text-sm text-gray-900">{req.location}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Certifications */}
              {eligibilityData.technical_eligibility.quality_certifications?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                  <div className="p-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <CheckCircle className="mr-2 text-green-500" size={20} />
                      Quality Certifications
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {eligibilityData.technical_eligibility.quality_certifications.map((cert: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-green-50 transition-colors">
                          <h6 className="text-sm font-medium text-gray-900 mb-3">{cert.certificate_name}</h6>
                          <div className="space-y-3">
                            {cert.validity_requirement && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Validity Requirement</p>
                                <p className="text-sm text-gray-900">{cert.validity_requirement}</p>
                              </div>
                            )}
                            {cert.issuing_authority && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Issuing Authority</p>
                                <p className="text-sm text-gray-900">{cert.issuing_authority}</p>
                              </div>
                            )}
                            {cert.minimum_level && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Minimum Level Required</p>
                                <p className="text-sm text-gray-900">{cert.minimum_level}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Capabilities */}
              {eligibilityData.technical_eligibility.technical_capabilities?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                  <div className="p-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <Target className="mr-2 text-blue-500" size={20} />
                      Technical Capabilities
                    </h5>
                    <div className="grid grid-cols-1 gap-4">
                      {eligibilityData.technical_eligibility.technical_capabilities.map((cap: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                          <h6 className="text-sm font-medium text-gray-900 mb-3">{cap.capability_type}</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cap.minimum_requirement && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Minimum Requirement</p>
                                <p className="text-sm text-gray-900">{cap.minimum_requirement}</p>
                              </div>
                            )}
                            {cap.proof_required && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Required Proof</p>
                                <p className="text-sm text-gray-900">{cap.proof_required}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeEligibilityTab === 'financial' && eligibilityData.financial_eligibility && (
            <div className="space-y-6 animate-fadeIn">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="mr-2 text-green-500" size={20} />
                  Financial Eligibility
                </div>
                <button
                  onClick={() => handleOpenFeedback('Eligibility', 'Financial')}
                  className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Financial Eligibility"
                >
                  <ThumbsDown size={16} />
                </button>
              </h4>
              {/* Turnover Requirements */}
              {eligibilityData.financial_eligibility.turnover_requirements && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                  <div className="p-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <DollarSign className="mr-2 text-green-500" size={20} />
                      Turnover Requirements
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {eligibilityData.financial_eligibility.turnover_requirements.annual_requirement && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-xs text-green-800 font-medium mb-1">Annual Requirement</p>
                          <p className="text-sm text-gray-900">{eligibilityData.financial_eligibility.turnover_requirements.annual_requirement}</p>
                        </div>
                      )}
                      {eligibilityData.financial_eligibility.turnover_requirements.assessment_period && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-xs text-green-800 font-medium mb-1">Assessment Period</p>
                          <p className="text-sm text-gray-900">{eligibilityData.financial_eligibility.turnover_requirements.assessment_period}</p>
                        </div>
                      )}
                    </div>
                    {eligibilityData.financial_eligibility.turnover_requirements.proof_required && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-2">Required Documentation</p>
                        <p className="text-sm text-gray-900">{eligibilityData.financial_eligibility.turnover_requirements.proof_required}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Financial Metrics */}
              {eligibilityData.financial_eligibility.financial_metrics?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                  <div className="p-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <PieChart className="mr-2 text-blue-500" size={20} />
                      Financial Metrics
                    </h5>
                    <div className="grid grid-cols-1 gap-4">
                      {eligibilityData.financial_eligibility.financial_metrics.map((metric: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <h6 className="text-sm font-medium text-gray-900 mb-3">{metric.metric_name}</h6>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {metric.threshold && (
                              <div className="bg-blue-50 rounded p-3">
                                <p className="text-xs text-blue-800 font-medium mb-1">Threshold</p>
                                <p className="text-sm text-gray-900">{metric.threshold}</p>
                              </div>
                            )}
                            {metric.measurement_period && (
                              <div className="bg-blue-50 rounded p-3">
                                <p className="text-xs text-blue-800 font-medium mb-1">Period</p>
                                <p className="text-sm text-gray-900">{metric.measurement_period}</p>
                              </div>
                            )}
                            {metric.calculation_method && (
                              <div className="bg-blue-50 rounded p-3">
                                <p className="text-xs text-blue-800 font-medium mb-1">Calculation Method</p>
                                <p className="text-sm text-gray-900">{metric.calculation_method}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeEligibilityTab === 'statutory' && eligibilityData.statutory_compliance?.registrations?.length > 0 && (
            <div className="space-y-6 animate-fadeIn">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                <div className="flex items-center">
                  <FileCheck className="mr-2 text-purple-500" size={20} />
                  Statutory Compliance
                </div>
                <button
                  onClick={() => handleOpenFeedback('Eligibility', 'Statutory')}
                  className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Statutory Compliance"
                >
                  <ThumbsDown size={16} />
                </button>
              </h4>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                <div className="p-6">
                  <h5 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                    <FileCheck className="mr-2 text-purple-500" size={20} />
                    Required Registrations
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eligibilityData.statutory_compliance.registrations.map((reg: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                        <p className="text-sm font-medium text-gray-900">{reg.registration_type}</p>
                        {reg.validity_requirement && (
                          <div className="mt-2 flex items-center text-sm text-gray-600">
                            <Clock size={14} className="mr-1" />
                            <span>{reg.validity_requirement}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeEligibilityTab === 'consortium' && eligibilityData.consortium_conditions && (
            <div className="space-y-6 animate-fadeIn">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="mr-2 text-indigo-500" size={20} />
                  Consortium Conditions
                </div>
                <button
                  onClick={() => handleOpenFeedback('Eligibility', 'Consortium')}
                  className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Consortium Conditions"
                >
                  <ThumbsDown size={16} />
                </button>
              </h4>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="text-base font-semibold text-gray-900 flex items-center">
                      <Users className="mr-2 text-indigo-500" size={20} />
                      Consortium Details
                    </h5>
                    <StatusBadge 
                      status={eligibilityData.consortium_conditions.is_allowed ? "Allowed" : "Not Allowed"}
                      color={eligibilityData.consortium_conditions.is_allowed ? "green" : "red"}
                    />
                  </div>
                  
                  {eligibilityData.consortium_conditions.is_allowed && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {eligibilityData.consortium_conditions.maximum_members && (
                          <div className="bg-indigo-50 rounded-lg p-4">
                            <p className="text-xs text-indigo-800 font-medium mb-1">Maximum Members</p>
                            <p className="text-sm text-gray-900">{eligibilityData.consortium_conditions.maximum_members}</p>
                          </div>
                        )}
                        {eligibilityData.consortium_conditions.lead_member_requirements && (
                          <div className="bg-indigo-50 rounded-lg p-4">
                            <p className="text-xs text-indigo-800 font-medium mb-1">Lead Member Requirements</p>
                            <p className="text-sm text-gray-900">{eligibilityData.consortium_conditions.lead_member_requirements}</p>
                          </div>
                        )}
                      </div>
                      
                      {eligibilityData.consortium_conditions.member_qualifications && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h6 className="text-sm font-medium text-gray-900 mb-3">Member Qualifications</h6>
                          <div className="space-y-3">
                            {eligibilityData.consortium_conditions.member_qualifications.technical && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Technical Requirements</p>
                                <p className="text-sm text-gray-900">{eligibilityData.consortium_conditions.member_qualifications.technical}</p>
                              </div>
                            )}
                            {eligibilityData.consortium_conditions.member_qualifications.financial && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Financial Requirements</p>
                                <p className="text-sm text-gray-900">{eligibilityData.consortium_conditions.member_qualifications.financial}</p>
                              </div>
                            )}
                            {eligibilityData.consortium_conditions.member_qualifications.experience && (
                              <div className="bg-white rounded p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Experience Requirements</p>
                                <p className="text-sm text-gray-900">{eligibilityData.consortium_conditions.member_qualifications.experience}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeEligibilityTab === 'disqualification' && eligibilityData.disqualification_conditions?.length > 0 && (
            <div className="space-y-6 animate-fadeIn">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 text-red-500" size={20} />
                  Disqualification Conditions
                </div>
                <button
                  onClick={() => handleOpenFeedback('Eligibility', 'Disqualification')}
                  className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Disqualification Conditions"
                >
                  <ThumbsDown size={16} />
                </button>
              </h4>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-3">
                    {eligibilityData.disqualification_conditions.map((condition: string, index: number) => (
                      <div key={index} className="bg-red-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-red-600">{index + 1}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-900">{condition}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderTechnicalEvaluation = () => {
    if (technicalQuery.isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
          </div>
        </div>
      );
    };
    if (technicalQuery.isError) return <div>Error loading technical evaluation</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Technical Evaluation</h3>
        {renderContentSection(technicalQuery.data)}
      </div>
    );
  }

  const renderFinancialRequirements = () => {
    if (financialQuery.isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
          </div>
        </div>
      );
    }
    if (financialQuery.isError) return <div>Error loading financial requirements</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Financial Requirements</h3>
        {renderContentSection(financialQuery.data)}
      </div>
    );
  }

  const renderBillOfQuantities = () => {
    if (boqQuery.isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
          </div>
        </div>
      );
    }
    if (boqQuery.isError) return <div>Error loading bill of quantities</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Bill of Quantities</h3>
        {renderContentSection(boqQuery.data)}
      </div>
    );
  }

  const renderContractConditions = () => {
    if (conditionsQuery.isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
          </div>
        </div>
      );
    }
    if (conditionsQuery.isError) return <div>Error loading contract conditions</div>;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Contract Conditions</h3>
        {renderContentSection(conditionsQuery.data)}
      </div>
    );
  }

  const renderComplianceRequirements = () => {
    if (complianceQuery.isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (complianceQuery.isError) return <div>Error loading compliance requirements</div>;
    
    const complianceData = complianceQuery.data?.processed_section as ComplianceRequirement[];
    if (!complianceData || !Array.isArray(complianceData)) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Compliance Requirements</h3>
        
        {complianceData.map((item: ComplianceRequirement, index: number) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            {/* Requirement Header */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-base font-medium text-gray-900">
                  {item.clause_number && <span className="text-gray-500 mr-2">[{item.clause_number}]</span>}
                  {item.requirement}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">{item.compliance_type}</span>
                  {item.evaluation_impact.disqualification_risk && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Disqualification Risk
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge 
                status={item.evaluation_impact.is_mandatory ? "Mandatory" : "Optional"}
                color={item.evaluation_impact.is_mandatory ? "red" : "blue"}
              />
            </div>

            {/* Supporting Documents */}
            {item.supporting_documents_needed && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Required Documents:</h5>
                <div className="text-sm text-gray-600">
                  {Array.isArray(item.supporting_documents_needed) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {item.supporting_documents_needed.map((doc: string, docIndex: number) => (
                        <li key={docIndex}>{doc}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{item.supporting_documents_needed}</p>
                  )}
                </div>
              </div>
            )}

            {/* Submission Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Submission Format</p>
                <div className="text-sm font-medium">
                  {item.submission_details?.submission_format && 
                   typeof item.submission_details.submission_format === 'object' ? (
                    <div className="space-y-1">
                      {item.submission_details.submission_format.format_type && (
                        <div>Format: {item.submission_details.submission_format.format_type}</div>
                      )}
                      {item.submission_details.submission_format.number_of_copies && (
                        <div>Copies: {item.submission_details.submission_format.number_of_copies}</div>
                      )}
                      {item.submission_details.submission_format.special_instructions && (
                        <div>Instructions: {item.submission_details.submission_format.special_instructions}</div>
                      )}
                    </div>
                  ) : (
                    <div>{typeof item.submission_details?.submission_format === 'string' ? 
                          item.submission_details.submission_format : 
                          'Not specified'}</div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Submission Stage</p>
                <p className="text-sm font-medium">{item.submission_details?.submission_stage || 'Not specified'}</p>
              </div>
              {item.evaluation_impact.evaluation_weightage !== null && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-500">Evaluation Weightage</p>
                  <p className="text-sm font-medium">{item.evaluation_impact.evaluation_weightage}%</p>
                </div>
              )}
            </div>

            {/* Special Instructions */}
            {item.submission_details?.special_instructions && (
              <div className="bg-yellow-50 border border-yellow-100 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Special Instructions: </span>
                  {item.submission_details.special_instructions}
                </p>
              </div>
            )}

            {/* Compliance Matrix */}
            {item.compliance_matrix && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {item.compliance_matrix.headers.map((header: string, headerIndex: number) => (
                        <th 
                          key={headerIndex}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {item.compliance_matrix.rows.map((row: ComplianceMatrixRow, rowIndex: number) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.clause_no}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{row.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{row.documents || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.format}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.is_mandatory}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{row.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  const renderImportantDates = () => {
    if (datesQuery.isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200">
                <div className="w-3 h-3 rounded-full bg-gray-200 mt-2 animate-pulse"></div>
                <div className="flex-grow space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (datesQuery.isError) return <div>Error loading important dates</div>;
    
    const dates = datesQuery.data?.processed_section;
    if (!dates || !Array.isArray(dates)) return <div>No important dates available</div>;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Key Dates</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar size={16} className="mr-1" />
            <span>{dates.length} Important Dates</span>
          </div>
        </div>
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
          
          <div className="space-y-8">
            {dates.map((date: any, index: number) => (
              <div key={index} className="relative flex items-start group">
                {/* Date Circle */}
                <div className="absolute left-7 w-5 h-5 rounded-full border-4 border-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg transform group-hover:scale-110 transition-transform duration-200"></div>
                
                {/* Content Card */}
                <div className="ml-16 flex-grow">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transform transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-blue-200">
                    {/* Event Title */}
                    <h4 className="text-base font-semibold text-gray-900 mb-2">{date.event}</h4>
                    
                    {/* DateTime and Notes */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <div className="flex items-center text-blue-600">
                          <Clock size={16} className="mr-2" />
                          <span className="font-medium">{date.dateTime || 'Date to be announced'}</span>
                        </div>
                      </div>
                      
                      {date.notesLocation && (
                        <div className="flex items-start text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <Info size={16} className="mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                          <span>{date.notesLocation}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Page Link */}
                    {date.page_number && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handlePageClick(date.page_number)}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Link size={14} className="mr-1" />
                          <span>Page {date.page_number}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderSubmissionRequirements = () => {
    if (annexuresQuery.isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-1/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-1/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-1/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-1/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (annexuresQuery.isError) return <div>Error loading submission requirements</div>;
    if (!annexuresQuery.data?.processed_section) return <div>No submission requirements available</div>;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Submission Requirements</h3>
          {annexuresQuery.data.processed_section.length > 0 && (
            <div className="flex justify-end">
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
        <div className="relative overflow-hidden border border-gray-200 rounded-lg">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Requirements</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicability</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {annexuresQuery.data.processed_section.map((doc: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {doc.document_category || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{doc.document_details.name || '-'}</div>
                        {doc.document_details.reference_number && (
                          <div className="text-sm text-gray-500">Ref: {doc.document_details.reference_number}</div>
                        )}
                        {/* Add page number with clickable link */}
                        {doc.document_details.page_number && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {doc.document_details.page_number.split(',').map((page: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => handlePageClick(page.replace('Page ', '').trim())}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                >
                                  <Link size={14} className="mr-1" />
                                  <span>{page.trim()}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {doc.document_details.description && (
                          <div className="text-sm text-gray-600 mt-1">{doc.document_details.description}</div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {doc.document_details.is_mandatory && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Mandatory
                            </span>
                          )}
                          {doc.document_details.stage_required && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {doc.document_details.stage_required}
                            </span>
                          )}
                          {doc.document_details.submission_format?.format_type && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {doc.document_details.submission_format.format_type}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          {doc.submission_requirements?.deadline && (
                            <div>Deadline: {doc.submission_requirements.deadline}</div>
                          )}
                          {doc.submission_requirements?.submission_mode && (
                            <div>Mode: {doc.submission_requirements.submission_mode}</div>
                          )}
                          {doc.submission_requirements?.submission_location && (
                            <div>Location: {doc.submission_requirements.submission_location}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          {doc.applicability?.applicable_to && (
                            <div>For: {doc.applicability.applicable_to}</div>
                          )}
                          {doc.applicability?.exemptions && (
                            <div className="text-amber-600">
                              Exemptions: {doc.applicability.exemptions}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAssignment === index ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={assignments[index] || ''}
                              onChange={(e) => {
                                setAssignments(prev => ({
                                  ...prev,
                                  [index]: e.target.value
                                }));
                              }}
                              onBlur={() => setEditingAssignment(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingAssignment(null);
                                }
                              }}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Enter name"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingAssignment(index)}
                            className="text-sm text-gray-500 hover:text-blue-600 flex items-center space-x-1"
                          >
                            <span>{assignments[index] || 'Click to assign'}</span>
                            <Users size={14} className="ml-1" />
                          </button>
                        )}
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
                              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                              title="Select existing document"
                            >
                              <File size={16} className="mr-1" />
                              Select
                            </button>

                            <div className="relative">
                              <input
                                type="file"
                                id={`file-upload-${index}`}
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, index)}
                                disabled={uploading !== null}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                              />
                              <label
                                htmlFor={`file-upload-${index}`}
                                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                                  uploading === index
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
                                }`}
                                title="Upload new document"
                              >
                                {uploading === index ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent mr-1" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload size={16} className="mr-1" />
                                    Upload
                                  </>
                                )}
                              </label>
                            </div>

                            <button
                              onClick={() => handleGetAIRecommendation(index)}
                              disabled={loadingRecommendation !== null || uploading !== null}
                              className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium ${
                                loadingRecommendation !== null || uploading !== null
                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                              title="Get AI recommendation"
                            >
                              {loadingRecommendation === index ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Info size={16} className="mr-1" />
                                  Suggest
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Select Existing Document */}
            <button
              onClick={() => setModalOpen(index)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              title="Select existing document"
            >
              <File size={16} className="mr-1" />
              Select
            </button>

            {/* Upload New Document */}
            <div className="relative">
              <input
                type="file"
                id={`file-upload-${index}`}
                className="hidden"
                onChange={(e) => handleFileUpload(e, index)}
                disabled={uploading !== null}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <label
                htmlFor={`file-upload-${index}`}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                  uploading === index
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
                }`}
                title="Upload new document"
              >
                {uploading === index ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent mr-1" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-1" />
                    Upload
                  </>
                )}
              </label>
            </div>

            {/* AI Suggestion */}
            <button
              onClick={() => handleGetAIRecommendation(index)}
              disabled={loadingRecommendation !== null || uploading !== null}
              className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium ${
                loadingRecommendation !== null || uploading !== null
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              title="Get AI recommendation"
            >
              {loadingRecommendation === index ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Info size={16} className="mr-1" />
                  Suggest
                </>
              )}
            </button>
          </div>
        )}
      </td>
    </tr>
  );

  // Add renderEvaluationCriteria function
  const renderEvaluationCriteria = () => {
    if (evaluationQuery.isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (evaluationQuery.isError) return <div>Error loading evaluation criteria</div>;
    
    const evaluationData = evaluationQuery.data?.processed_section as EvaluationData;
    if (!evaluationData) return <div>No evaluation criteria available</div>;
    
    return (
      <div className="space-y-6">
        {/* Evaluation Type Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
            Evaluation Methodology
            <button
              onClick={() => handleOpenFeedback('Evaluation Criteria', 'Evaluation Methodology')}
              className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Evaluation Methodology"
            >
              <ThumbsDown size={16} />
            </button>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 w-32">Type:</span>
              <span className="text-sm text-gray-900">{evaluationData.evaluation_type?.type}</span>
            </div>
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 w-32">Description:</span>
              <span className="text-sm text-gray-900">{evaluationData.evaluation_type?.description}</span>
            </div>
            {evaluationData.evaluation_type?.justification && (
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-500 w-32">Justification:</span>
                <span className="text-sm text-gray-900">{evaluationData.evaluation_type?.justification}</span>
              </div>
            )}
          </div>
        </div>

        {/* Evaluation Stages */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
            Evaluation Stages
            <button
              onClick={() => handleOpenFeedback('Evaluation Criteria', 'Evaluation Stages')}
              className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Evaluation Stages"
            >
              <ThumbsDown size={16} />
            </button>
          </h3>
          <div className="space-y-4">
            {evaluationData.stages?.map((stage: EvaluationStage, index: number) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{stage.sequence_number}</span>
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-medium text-gray-900">{stage.stage_name}</h4>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{stage.stage_type}</span>
                    {stage.is_eliminatory && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Eliminatory
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Evaluation */}
        {evaluationData.technical_evaluation && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
              Technical Evaluation
              <button
                onClick={() => handleOpenFeedback('Evaluation Criteria', 'Technical Evaluation')}
                className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Technical Evaluation"
              >
                <ThumbsDown size={16} />
              </button>
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-medium text-gray-500">Weightage</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{evaluationData.technical_evaluation.weightage}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-medium text-gray-500">Minimum Qualifying Score</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{evaluationData.technical_evaluation.minimum_qualifying_score}</p>
                </div>
              </div>

              {/* Scoring Matrix */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Scoring Matrix</h4>
                {evaluationData.technical_evaluation.scoring_matrix?.map((category: ScoringMatrixCategory, index: number) => (
                  <div key={index} className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-900">{category.criteria_category}</h5>
                      <span className="text-sm font-medium text-blue-600">Weightage: {category.category_weightage ?? 'N/A'}%</span>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parameter</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scoring Method</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {category.parameters?.map((param: TechnicalParameter, pIndex: number) => (
                            <tr key={pIndex} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">{param.parameter_name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{param.max_marks || '-'}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{param.scoring_method || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Financial Evaluation */}
        {evaluationData.financial_evaluation && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
              Financial Evaluation
              <button
                onClick={() => handleOpenFeedback('Evaluation Criteria', 'Financial Evaluation')}
                className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Financial Evaluation"
              >
                <ThumbsDown size={16} />
              </button>
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-medium text-gray-500">Weightage</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{evaluationData.financial_evaluation.weightage}</p>
                </div>
              </div>
              {evaluationData.financial_evaluation.scoring_formula && (
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm font-medium text-blue-900">Scoring Formula</p>
                  <p className="mt-1 text-sm text-blue-800">{evaluationData.financial_evaluation.scoring_formula}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Composite Scoring */}
        {evaluationData.composite_scoring && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
              Composite Scoring
              <button
                onClick={() => handleOpenFeedback('Evaluation Criteria', 'Composite Scoring')}
                className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Composite Scoring"
              >
                <ThumbsDown size={16} />
              </button>
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-medium text-gray-900">Formula</p>
                <p className="mt-1 text-sm text-gray-600">{evaluationData.composite_scoring.formula}</p>
              </div>
              {evaluationData.composite_scoring.example_calculation && (
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-sm font-medium text-yellow-900">Example Calculation</p>
                  <p className="mt-1 text-sm text-yellow-800 whitespace-pre-line">{evaluationData.composite_scoring.example_calculation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selection Method */}
        {evaluationData.selection_method && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
              Selection Method
              <button
                onClick={() => handleOpenFeedback('Evaluation Criteria', 'Selection Method')}
                className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Selection Method"
              >
                <ThumbsDown size={16} />
              </button>
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-medium text-gray-900">Primary Criteria</p>
                <p className="mt-1 text-sm text-gray-600">{evaluationData.selection_method.primary_criteria}</p>
              </div>
              {evaluationData.selection_method.tie_breaker && (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-medium text-gray-900">Tie Breaker</p>
                  <p className="mt-1 text-sm text-gray-600">{evaluationData.selection_method.tie_breaker}</p>
                </div>
              )}
              {evaluationData.selection_method.negotiation_terms && (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-medium text-gray-900">Negotiation Terms</p>
                  <p className="mt-1 text-sm text-gray-600">{evaluationData.selection_method.negotiation_terms}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Specific Requirements */}
        {evaluationData.specific_requirements && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
              Specific Requirements
              <button
                onClick={() => handleOpenFeedback('Evaluation Criteria', 'Specific Requirements')}
                className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Specific Requirements"
              >
                <ThumbsDown size={16} />
              </button>
            </h3>
            <div className="space-y-4">
              {evaluationData.specific_requirements.qcbs_specific && (
                <div className="bg-blue-50 p-4 rounded">
                  <h4 className="text-base font-medium text-blue-900 mb-3">QCBS Specific Requirements</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Technical Weightage</p>
                      <p className="mt-1 text-sm text-blue-800">{evaluationData.specific_requirements.qcbs_specific.technical_weightage}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Financial Weightage</p>
                      <p className="mt-1 text-sm text-blue-800">{evaluationData.specific_requirements.qcbs_specific.financial_weightage}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Scoring Formula</p>
                      <p className="mt-1 text-sm text-blue-800 whitespace-pre-line">{evaluationData.specific_requirements.qcbs_specific.scoring_formula}</p>
                    </div>
                  </div>
                </div>
              )}
              {evaluationData.specific_requirements.L1_specific && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-base font-medium text-gray-900 mb-2">L1 Specific Requirements</h4>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.L1_specific.price_preference}</p>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.L1_specific.purchase_preference}</p>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.L1_specific.msme_benefits}</p>
                </div>
              )}
              {evaluationData.specific_requirements.qbs_specific && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-base font-medium text-gray-900 mb-2">QBS Specific Requirements</h4>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.qbs_specific.negotiation_process}</p>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.qbs_specific.fallback_options}</p>
                </div>
              )}
              {evaluationData.specific_requirements.fbs_specific && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-base font-medium text-gray-900 mb-2">FBS Specific Requirements</h4>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.fbs_specific.budget_ceiling}</p>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.fbs_specific.compliance_requirements}</p>
                </div>
              )}
              {evaluationData.specific_requirements.lcs_specific && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-base font-medium text-gray-900 mb-2">LCS Specific Requirements</h4>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.lcs_specific.technical_threshold}</p>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.lcs_specific.cost_evaluation_method}</p>
                </div>
              )}
              {evaluationData.specific_requirements.sss_specific && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-base font-medium text-gray-900 mb-2">SSS Specific Requirements</h4>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.sss_specific.justification}</p>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.sss_specific.approval_requirements}</p>
                </div>
              )}
              {evaluationData.specific_requirements.era_specific && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-base font-medium text-gray-900 mb-2">ERA Specific Requirements</h4>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.era_specific.auction_rules}</p>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.era_specific.decrement_value}</p>
                  <p className="text-sm text-gray-600">{evaluationData.specific_requirements.era_specific.duration}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disqualification Criteria */}
        {evaluationData.disqualification_criteria && evaluationData.disqualification_criteria.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
              Disqualification Criteria
              <button
                onClick={() => handleOpenFeedback('Evaluation Criteria', 'Disqualification Criteria')}
                className="p-1 rounded-full hover:bg-red-100 text-red-500" aria-label="Dislike Disqualification Criteria"
              >
                <ThumbsDown size={16} />
              </button>
            </h3>
            <div className="space-y-3">
              {evaluationData.disqualification_criteria.map((criteria: DisqualificationCriteria, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-red-900">{criteria.criteria}</p>
                    {criteria.stage && (
                      <p className="mt-1 text-xs text-red-700">
                        Stage: {criteria.stage}
                      </p>
                    )}
                    {criteria.verification_method && (
                      <p className="mt-1 text-xs text-red-700">
                        Verification: {criteria.verification_method}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Update the tab click handler
  const handleTabClick = (tabId: string) => {
    const sectionState = getSectionState(tabId, sectionStatus, sectionApiMapping);
    if (sectionState !== 'success' && sectionState !== 'analyzing') {
      // Don't switch tabs if section is not ready
      return;
    }
    setActiveTab(tabId);
  };

  // Add this function before renderTableOfContents
  const handlePageClick = (pageNumber: string | undefined) => {
    if (!pageNumber) return;
    const page = parseInt(pageNumber, 10);
    if (!isNaN(page)) {
      setCurrentPdfPage(page);
      setIsPdfModalOpen(true);
    }
  };

  const handleMultiplePagesClick = (pageNumbersString: string | undefined) => {
    if (!pageNumbersString) return;
    const pageNumbers = pageNumbersString.split(',').map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));

    if (pageNumbers.length > 0) {
      // Open PDF viewer with the first page
      setSelectedPage(pageNumbers[0]);
      setPdfViewerOpen(true);
    }
  };

  const renderPageNumbers = (pageNumbersString: string | undefined) => {
    if (!pageNumbersString) return null;
    const pageNumbers = pageNumbersString.split(',').map(num => parseInt(num.trim(), 10));

    if (pageNumbers.length === 1) {
      return (
        <span
          className="text-blue-500 hover:underline cursor-pointer ml-2"
          onClick={() => handlePageClick(pageNumbersString)}
        >
          (Page {pageNumbersString})
        </span>
      );
    } else if (pageNumbers.length > 1) {
      return (
        <span
          className="text-blue-500 hover:underline cursor-pointer ml-2"
          onClick={() => handleMultiplePagesClick(pageNumbersString)}
        >
          (Pages {pageNumbersString})
        </span>
      );
    }
    return null;
  };

  // Update the renderTableOfContents function
  const renderTableOfContents = () => {
    if (tableOfContentsQuery.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-3 w-full max-w-2xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (tableOfContentsQuery.isError) return <div>Error loading table of contents</div>;
    
    const data = tableOfContentsQuery.data?.processed_section;
    if (!data || !Array.isArray(data)) return null;

    const handleToggleSection = (index: number) => {
      setExpandedTocSections(prev => ({
        ...prev,
        [index]: !prev[index]
      }));
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Table of Contents</h3>
          <div className="flex items-center text-sm text-gray-500">
            <FileText size={16} className="mr-1" />
            <span>{data.length} Sections</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {data.map((section: TableOfContentsSection, index: number) => {
            const hasSubsections = section.subsections && section.subsections.length > 0;
            const expanded = expandedTocSections[index];
            const isAnnexure = (section.section_number || '').toLowerCase().includes('annexure') || (section.section_title || '').toLowerCase().includes('annexure');
            let annexureNumber = '';
            if (isAnnexure) {
              const match = (section.section_number || '').match(/Annexure\s*(\d+)/i);
              annexureNumber = match ? match[1] : (section.section_number || '').replace(/Annexure/i, '').trim();
            }
            return (
              <div 
                key={index} 
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between cursor-pointer" onClick={() => hasSubsections && handleToggleSection(index)}>
                  <div className="flex items-center gap-3">
                    {/* Circle for section number or annexure */}
                    {isAnnexure ? (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50">
                        <File size={18} className="text-purple-600" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50">
                        <FileText size={18} className="text-blue-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        {isAnnexure && (
                          <span className="text-xs font-semibold text-purple-600">Annexure {annexureNumber}</span>
                        )}
                        {!isAnnexure && (
                          <span className="text-xs font-semibold text-blue-600">{section.section_number}</span>
                        )}
                        <h4 className="text-base font-medium text-gray-900">{section.section_title}</h4>
                      </div>
                      {section.page_number && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePageClick(section.page_number);
                          }}
                          className="mt-1 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          <Link size={14} className="mr-1" />
                          <span>Page {section.page_number}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {hasSubsections && (
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-1">{(section.subsections || []).length}</span>
                      {expanded ? (
                        <ChevronDown size={16} className="text-blue-500 rotate-180 transition-transform duration-200" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400 transition-transform duration-200" />
                      )}
                    </div>
                  )}
                </div>
                {hasSubsections && expanded && (
                  <div className="mt-4 pl-11 space-y-3 border-t border-gray-100 pt-3">
                    {(section.subsections || []).map((subsection, subIndex: number) => (
                      <div 
                        key={subIndex} 
                        className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-md transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-50 group-hover:bg-blue-50 transition-colors duration-200 overflow-hidden">
                            <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600 text-ellipsis whitespace-nowrap overflow-hidden">
                              {subsection.subsection_number}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 group-hover:text-gray-900">
                            {subsection.subsection_title}
                          </span>
                        </div>
                        {subsection.page_number && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePageClick(subsection.page_number);
                            }}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <Link size={14} className="mr-1" />
                            
                            <span>Page {subsection.page_number}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Update the right side buttons in the header section
  const renderHeaderButtons = () => (
    <div className="flex flex-col items-end space-y-2">
      {pdfUrl && (
        <button
          onClick={() => setPdfViewerOpen(true)}
          className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 shadow-sm transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Eye size={20} className="mr-2" />
          View PDF
        </button>
      )}
      {renderPortalLink(tenderSummaryData.portalLink)}
      <CorrigendumsButton
        tenderId={Number(id)}
        onUpload={handleUploadCorrigendum}
        onDelete={handleDeleteCorrigendum}
        onView={(fileUrl) => {
          // Implement view logic
          console.log('View corrigendum:', fileUrl);
        }}
        isDeletingCorrigendum={deleteCorrigendumMutation.isPending}
        isUploadingCorrigendum={uploadCorrigendumMutation.isPending}
      />
    </div>
  );

  // Add this function to open feedback form for a section
  const handleOpenFeedback = (sectionName: string, subsectionName: string | null = null) => {
    console.log('Opening feedback form for section:', sectionName, 'subsection:', subsectionName);
    console.log('tenderSummaryQuery.data:', tenderSummaryQuery.data);
    setFeedbackSection(sectionName);
    setFeedbackSubsection(subsectionName);
    setFeedbackFormOpen(true);
  };

  // Update the content area section to remove the PDF viewer condition
  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900  shadow-xl text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <h1 className="text-xl font-bold mb-2 leading-tight">
                {originalTenderName}
              </h1>
              <h2 className="text-md text-blue-200 font-semibold opacity-90 mb-3">
                {tenderSummaryData.title}
              </h2>
              <div className="flex items-center  text-sm mb-4">
                <Building size={18} className="mr-2 opacity-80" />
                <span>{tenderSummaryData.issuingAuthority}</span>
              </div>

              <div className="flex flex-wrap gap-3 mb-5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white shadow-md">
                  {tenderSummaryData.tenderNumber}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white shadow-md">
                  {tenderSummaryData.tenderMode}
                </span>
              </div>

              {/* Financial Requirements Section */}
              {tenderSummaryData?.financial_requirements && (
                <div className="mt-6 flex flex-row gap-4 items-stretch">
                  {/* EMD Details */}
                  {tenderSummaryData.financial_requirements?.emd && (
                    <div className="flex-1 bg-white bg-opacity-10 p-4 rounded-lg flex flex-col justify-between border border-blue-700 shadow-inner">
                      
                      <button
                        onClick={() => setIsEmdModalOpen(true)}
                        className=" text-blue-300 hover:text-blue-100 flex items-center text-sm font-medium transition-colors"
                        title="View complete EMD details"
                      >
                        EMD Details <ChevronRight size={16} className="ml-1" />
                      </button>
                    </div>
                  )}

                  {/* Tender Fee Details */}
                  {tenderSummaryData.financial_requirements?.tender_fee && (
                    <div className="flex-1 bg-white bg-opacity-10 p-4 rounded-lg flex flex-col justify-between border border-blue-700 shadow-inner">
                      
                      <button
                        onClick={() => setIsTenderFeeModalOpen(true)}
                        className=" text-blue-300 hover:text-blue-100 flex items-center text-sm font-medium transition-colors"
                        title="View complete tender fee details"
                      >
                        Tender Fee Details <ChevronRight size={16} className="ml-1" />
                      </button>
                    </div>
                  )}

                  {/* Estimated Value - Placeholder/Example, if it exists */}
                  {tenderSummaryData.financial_requirements?.estimated_value && (
                    <div className="flex-1 bg-white bg-opacity-10 p-4 rounded-lg flex flex-col justify-between border border-blue-700 shadow-inner">
                      <div>
                        <h3 className="text-sm font-medium text-blue-200 mb-1">Estimated Value</h3>
                        <p className="text-xl font-bold text-white">
                          {formatCurrency(tenderSummaryData.financial_requirements.estimated_value)}
                        </p>
                      </div>
                      {/* No specific modal for this in original, can add if needed */}
                    </div>
                  )}
                </div>
              )}
            </div>

            {renderHeaderButtons()}
          </div>
        </div>

        {/* Main content layout */}
        <div className="flex">
          {/* Left Navigation */}
          <div className={`${isNavCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 border-r border-gray-200 transition-all duration-300 ease-in-out relative`}>
            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsNavCollapsed(!isNavCollapsed)}
              className="absolute -right-3 top-4 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50"
            >
              {isNavCollapsed ? (
                <ChevronRight size={16} className="text-gray-600" />
              ) : (
                <ChevronLeft size={16} className="text-gray-600" />
              )}
            </button>

            <nav className="py-4 pr-1">
              <div className="space-y-1">
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  const { status, hasData } = getSectionStatus(tab.id);
                  const showReanalyzeButton = tab.id !== 'tender_summary' && tab.id !== 'submission' && tab.id !== 'evaluation' && tab.id !== 'table_of_contents' && tab.id !== 'conditions' && tab.id !== 'dates' && tab.id !== 'boq' && tab.id !== 'technical' && tab.id !== 'eligibility' && tab.id !== 'scope' && tab.id !== 'financial' && tab.id !== 'compliance';

                  return (
                    <div key={tab.id} className="mb-2 flex items-center">
                      {/* Dislike button for completed sections - moved inside the main button for correct positioning */}
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        title={isNavCollapsed ? tab.name : undefined}
                      >
                        <tab.icon size={18} className={`${isNavCollapsed ? '' : 'mr-2'} ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                        {!isNavCollapsed && <span>{tab.name}</span>}
                        
                        {/* Container for dislike button and status indicators */}
                        {!isNavCollapsed && (
                          <div className="ml-auto flex items-center">
                            {status === 'success' && hasData && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent tab change on dislike click
                                  handleOpenFeedback(tab.name);
                                }}
                                className="p-1 rounded-full hover:bg-red-100 text-red-500"
                                title={`Give feedback for ${tab.name}`}
                              >
                                <ThumbsDown size={16} />
                              </button>
                            )}

                            {/* Status indicators */}
                            {status === 'failed' && (
                              <div className="p-1">
                                <AlertTriangle size={16} className="text-amber-500" />
                              </div>
                            )}
                            {status === 'success' && hasData && (
                              <div className="p-1">
                                <CheckCircle size={16} className="text-green-500" />
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                      {/* Reanalyze button - only show when nav is expanded */}
                      {!isNavCollapsed && showReanalyzeButton && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSectionReanalysis(tab.id);
                          }}
                          disabled={reanalyzingSection !== null}
                          className={`mt-1 ml-8 inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                            reanalyzingSection === tab.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          {reanalyzingSection === tab.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent mr-1" />
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
                })}
              </div>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto p-6">
              {renderActiveTabContent()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add PDF Modal */}
      <PDFViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          setCurrentPdfPage(null);
        }}
        pdfUrl={typeof pdfQuery.data === 'string' ? pdfQuery.data : null}
        initialPage={currentPdfPage}
      />

      {/* Document Explorer Modal */}
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

      {/* FeedbackForm modal for section feedback */}
      <FeedbackForm
        isOpen={feedbackFormOpen}
        onClose={handleCloseFeedback}
        tenderName={tenderSummaryQuery.data?.tender_name || 'N/A'}
        tenderId={tenderSummaryQuery.data?.tender_id}
        sectionOptions={TABS.map(tab => ({ id: tab.id, name: tab.name }))}
        showTenderFields={true}
        preselectedSection={feedbackSection || undefined}
        preselectedSubsection={feedbackSubsection || undefined}
      />

      {/* FinancialDetailsModal for EMD */}
      <FinancialDetailsModal
        isOpen={isEmdModalOpen}
        onClose={() => setIsEmdModalOpen(false)}
        title="EMD Details"
        details={{
          amount: tenderSummaryData.financial_requirements?.emd?.amount ?? null,
          payment_mode: tenderSummaryData.financial_requirements?.emd?.payment_mode ?? null,
          validity_period: tenderSummaryData.financial_requirements?.emd?.validity_period ?? null,
          exemptions: tenderSummaryData.financial_requirements?.emd?.exemptions ?? null,
          refund_terms: tenderSummaryData.financial_requirements?.emd?.refund_terms ?? null
        }}
      />

      {/* FinancialDetailsModal for Tender Fee */}
      <FinancialDetailsModal
        isOpen={isTenderFeeModalOpen}
        onClose={() => setIsTenderFeeModalOpen(false)}
        title="Tender Fee Details"
        details={{
          amount: tenderSummaryData.financial_requirements?.tender_fee?.amount ?? null,
          payment_mode: tenderSummaryData.financial_requirements?.tender_fee?.payment_mode ?? null,
          is_refundable: tenderSummaryData.financial_requirements?.tender_fee?.is_refundable ?? null,
          exemptions: tenderSummaryData.financial_requirements?.tender_fee?.exemptions ?? null
        }}
      />

      {/* PDF Viewer Modal */}
      {pdfUrl && (
        <PDFViewerModal
          isOpen={pdfViewerOpen}
          onClose={() => setPdfViewerOpen(false)}
          pdfUrl={pdfQuery.data || null}
          initialPage={selectedPage}
        />
      )}
    </div>
  );
};

export default TenderSummary;