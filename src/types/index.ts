export type TenderStatus = 'Draft' | 'In Progress' | 'Submitted' | 'Disqualified' | 'Won';

export type TenderTag = 
  | 'High-value tender' 
  | 'LCS Evaluation' 
  | 'Joint Venture allowed' 
  | 'MSME preferred'
  | 'Technical Priority' 
  | 'Government' 
  | 'Private'
  | 'New';

export interface AnnexureAttachment {
  nameNumber: string | null;
  purposeDescription: string | null;
  formatSpecificInstructions: string | null;
  submissionNote: string | null;
}

export interface TenderInfo {
  annexuresAttachmentsRequired: AnnexureAttachment[];
  // ... other tender info fields
}

export interface Tender {
  id: string;
  title: string;
  department: string;
  org_name?: string;
  status: TenderStatus;
  deadline: string;
  uploadDate: string;
  tags: TenderTag[];
  aiConfidence: number;
  estimatedValue?: number;
  tenderInfo?: TenderInfo;
  progress: {
    parsing: boolean;
    analysis: boolean;
    docUpload: boolean;
    ready: boolean;
    submitted: boolean;
  };
  processingStatus?: {
    documentValidation: boolean;
    technicalEvaluation: boolean;
    financialEvaluation: boolean;
    complianceCheck: boolean;
  };
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  sections: string[];
  status: 'Valid' | 'Missing' | 'Non-compliant';
}

export interface Organization {
  name: string;
  pan: string;
  gst: string;
  msme: string;
  bankDetails: {
    accountNumber: string;
    bankName: string;
    ifsc: string;
  };
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

export interface ProcessingStep {
  step: 'parsing' | 'analysis' | 'docUpload' | 'ready' | 'submitted';
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export interface DeadlineInfo {
  event: string;
  tender_name: string;
  deadline_date: string;
  status_color: 'red' | 'yellow' | 'green';
  days_remaining: number | null;
  task_message: string;
  priority: number;
}