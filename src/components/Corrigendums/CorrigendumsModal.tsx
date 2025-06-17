import React, { useState } from 'react';
import { Modal, Table, Button, Space, Upload, Spin, message } from 'antd';
import { FileText, Trash2, Upload as UploadIcon, X, Wand2 } from 'lucide-react';
import PDFViewer from '../PDFViewer/PDFViewer';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Corrigendum {
  id: number;
  tender_id: number;
  corrigendum_name: string;
  corrigendum_url: string;
  created_at: string;
}

interface AnalyzeCorrigendumResponse {
  status: 'success' | 'failed' | 'partial';
  tender_id: number;
  tender_name: string;
  successful_updates: Array<{
    section: string;
    status: string;
    changes: {
      text_updated: boolean;
      analysis_updated: boolean;
    };
  }>;
  partial_updates: any[];
  failed_updates: any[];
}

interface CorrigendumsModalProps {
  isOpen: boolean;
  onClose: () => void;
  corrigendums: Corrigendum[];
  onUpload: (file: File) => void;
  onDelete: (id: number) => void;
  onUpdateTender?: (id: number) => void;
  isLoading?: boolean;
  isDeletingCorrigendum?: boolean;
  isUploadingCorrigendum?: boolean;
  userId: number;
  orgName?: string;
}

const CorrigendumsModal: React.FC<CorrigendumsModalProps> = ({
  isOpen,
  onClose,
  corrigendums,
  onUpload,
  onDelete,
  onUpdateTender,
  isLoading = false,
  isDeletingCorrigendum = false,
  isUploadingCorrigendum = false,
  userId,
  orgName,
}) => {
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [analyzingCorrigendumId, setAnalyzingCorrigendumId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const handleAnalyzeCorrigendum = async (corrigendumId: number, tenderId: number) => {
    try {
      setAnalyzingCorrigendumId(corrigendumId);
      console.log('Starting corrigendum analysis for:', { corrigendumId, tenderId });
      
      const formData = new FormData();
      formData.append('tender_id', tenderId.toString());
      formData.append('corrigendum_id', corrigendumId.toString());
      formData.append('user_id', userId.toString());
      if (orgName) {
        formData.append('org_name', orgName);
      }

      const response = await axios.post<AnalyzeCorrigendumResponse>(
        'https://api.smarttender.rio.software/corrigendums/analyze-corrigendum',
        formData
      );
      
      console.log('API Response:', response.data);
      
      if (response.data.status === 'success') {
        message.success('Corrigendum analyzed successfully');
        
        // Invalidate only the sections that were successfully updated
        console.log('Successful updates:', response.data.successful_updates);
        
        response.data.successful_updates.forEach(update => {
          if (update.status === 'success') {
            console.log('Invalidating section:', update.section);
            const queryKey = ['tender', tenderId.toString(), 'section', update.section, orgName || undefined];
            console.log('Query invalidation parameters:', {
              tenderId: tenderId.toString(),
              section: update.section,
              orgName: orgName || undefined,
              fullQueryKey: queryKey,
              queryClient: queryClient ? 'exists' : 'undefined'
            });
            
            queryClient.invalidateQueries({ 
              queryKey,
              refetchType: 'all'
            });
          }
        });
      } else {
        console.log('API returned non-success status:', response.data.status);
        message.error('Failed to analyze corrigendum');
      }
    } catch (error) {
      console.error('Error analyzing corrigendum:', error);
      message.error('Failed to analyze corrigendum');
    } finally {
      setAnalyzingCorrigendumId(null);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'corrigendum_name',
      key: 'name',
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'PDF',
      key: 'pdf',
      render: (_: unknown, record: Corrigendum) => (
        <Button
          icon={<FileText size={16} />}
          onClick={() => setSelectedPdfUrl(record.corrigendum_url)}
        />
      ),
    },
    {
      title: 'Update Tender',
      key: 'update',
      render: (_: unknown, record: Corrigendum) => (
        <Button
          icon={<Wand2 size={16} />}
          onClick={() => handleAnalyzeCorrigendum(record.id, record.tender_id)}
          type="primary"
          className="bg-purple-600 hover:bg-purple-700"
          loading={analyzingCorrigendumId === record.id}
          disabled={analyzingCorrigendumId !== null}
        />
      ),
    },
    {
      title: 'Delete',
      key: 'delete',
      render: (_: unknown, record: Corrigendum) => (
        <Button
          icon={<Trash2 size={16} />}
          onClick={() => onDelete(record.id)}
          disabled={isDeletingCorrigendum || analyzingCorrigendumId !== null}
        />
      ),
    },
  ];

  const handleUpload = (info: any) => {
    if (info.file.status === 'done') {
      onUpload(info.file.originFileObj);
    } else if (info.file.status === 'error') {
      // Handle upload error if needed
      console.error('File upload failed:', info.file);
    }
  };

  return (
    <>
      <Modal
        title="Corrigendums"
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={800}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Table
              dataSource={corrigendums}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Upload
                customRequest={({ file, onSuccess }) => {
                  setTimeout(() => {
                    onSuccess?.('ok');
                  }, 0);
                }}
                onChange={handleUpload}
                showUploadList={false}
              >
                <Button icon={<UploadIcon size={16} />}
                  disabled={isUploadingCorrigendum}>
                  Upload Corrigendum
                </Button>
              </Upload>
            </div>
          </>
        )}
      </Modal>

      {selectedPdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001]">
          <div className="bg-white w-[95vw] h-[95vh] flex flex-col rounded-lg shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg">
              <h2 className="text-lg font-semibold">Corrigendum Document</h2>
              <button 
                onClick={() => setSelectedPdfUrl(null)} 
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewer pdfUrl={selectedPdfUrl} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CorrigendumsModal; 