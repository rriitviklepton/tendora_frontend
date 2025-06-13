import React, { useState } from 'react';
import { Modal, Table, Button, Space, Upload, Spin } from 'antd';
import { FileText, Trash2, Upload as UploadIcon, X } from 'lucide-react';
import PDFViewer from '../PDFViewer/PDFViewer';

interface Corrigendum {
  id: number;
  tender_id: number;
  corrigendum_name: string;
  corrigendum_url: string;
  created_at: string;
}

interface CorrigendumsModalProps {
  isOpen: boolean;
  onClose: () => void;
  corrigendums: Corrigendum[];
  onUpload: (file: File) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
  isDeletingCorrigendum?: boolean;
  isUploadingCorrigendum?: boolean;
}

const CorrigendumsModal: React.FC<CorrigendumsModalProps> = ({
  isOpen,
  onClose,
  corrigendums,
  onUpload,
  onDelete,
  isLoading = false,
  isDeletingCorrigendum = false,
  isUploadingCorrigendum = false,
}) => {
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);

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
      title: 'Delete',
      key: 'delete',
      render: (_: unknown, record: Corrigendum) => (
        <Button
          icon={<Trash2 size={16} />}
          onClick={() => onDelete(record.id)}
          disabled={isDeletingCorrigendum}
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