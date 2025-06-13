import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Corrigendum {
  id: number;
  tender_id: number;
  corrigendum_name: string;
  corrigendum_url: string;
  created_at: string;
}

interface CorrigendumsResponse {
  corrigendums: Corrigendum[];
}

export const useCorrigendums = (tenderId: number) => {
  return useQuery<CorrigendumsResponse, Error>({
    queryKey: ['corrigendums', tenderId],
    queryFn: async (): Promise<CorrigendumsResponse> => {
      const response = await axios.get<CorrigendumsResponse>(`https://api.smarttender.rio.software/corrigendums/list-corrigendums/${tenderId}`, {
        params: {
          user_id: 123,
          org_name: 'lepton'
        }
      });
      return response.data;
    },
    enabled: !!tenderId,
  });
}; 