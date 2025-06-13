import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface DeleteCorrigendumParams {
  corrigendumId: number;
  tenderId: number;
}

export const useDeleteCorrigendum = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteCorrigendumParams>({
    mutationFn: async ({ corrigendumId, tenderId }) => {
      await axios.delete(`https://api.smarttender.rio.software/corrigendums/delete-corrigendum/${corrigendumId}`, {
        params: {
          tender_id: tenderId,
          user_id: 123,
          org_name: 'lepton'
        }
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['corrigendums', variables.tenderId] });
    },
  });
}; 