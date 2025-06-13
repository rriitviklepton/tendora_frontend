import React, { useState } from 'react';
import { Button, Spin, message } from 'antd';
import { FileText } from 'lucide-react';
import CorrigendumsModal from './CorrigendumsModal';
import { useCorrigendums } from '../../hooks/useCorrigendums';

interface CorrigendumsButtonProps {
  tenderId: number;
  onUpload: (file: File) => void;
  onDelete: (id: number) => void;
  onView: (fileUrl: string) => void;
  isDeletingCorrigendum: boolean;
  isUploadingCorrigendum: boolean;
}

const CorrigendumsButton: React.FC<CorrigendumsButtonProps> = ({
  tenderId,
  onUpload,
  onDelete,
  onView,
  isDeletingCorrigendum,
  isUploadingCorrigendum,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, error } = useCorrigendums(tenderId);

  if (error) {
    message.error('Failed to load corrigendums');
  }

  return (
    <>
      <Button
        icon={<FileText size={16} />}
        onClick={() => setIsModalOpen(true)}
      >
        Corrigendums
      </Button>
      <CorrigendumsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        corrigendums={data?.corrigendums || []}
        onUpload={onUpload}
        onDelete={onDelete}
        isLoading={isLoading}
        isDeletingCorrigendum={isDeletingCorrigendum}
        isUploadingCorrigendum={isUploadingCorrigendum}
      />
    </>
  );
};

export default CorrigendumsButton; 