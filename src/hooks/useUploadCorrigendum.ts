import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface UploadCorrigendumParams {
  tenderId: number;
  file: File;
}

export const useUploadCorrigendum = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, UploadCorrigendumParams>({
    mutationFn: async ({ tenderId, file }) => {
      const formData = new FormData();
      formData.append('tender_id', tenderId.toString());
      formData.append('corrigendum_file', file);
      formData.append('user_id', '123'); // Hardcoded user_id as per backend
      formData.append('org_name', 'lepton'); // Hardcoded org_name as per backend

      const response = await axios.post('https://api.smarttender.rio.software/corrigendums/upload-corrigendum', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['corrigendums', variables.tenderId] });
    },
  });
}; 