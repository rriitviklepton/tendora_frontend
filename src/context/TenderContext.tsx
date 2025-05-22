import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tender, TenderStatus, TenderTag } from '../types';

interface TenderContextType {
  tenders: Tender[];
  allTenders: Tender[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  addTender: (tender: Tender) => void;
  updateTenderStatus: (id: string, status: TenderStatus) => void;
  getTenderById: (id: string) => Tender | undefined;
  refreshTenders: () => Promise<void>;
  fetchAllTenders: (page: number) => Promise<void>;
}

const TenderContext = createContext<TenderContextType | undefined>(undefined);

export const useTenderContext = () => {
  const context = useContext(TenderContext);
  if (!context) {
    throw new Error('useTenderContext must be used within a TenderProvider');
  }
  return context;
};

interface TenderProviderProps {
  children: ReactNode;
}

const ITEMS_PER_PAGE = 6;

export const TenderProvider = ({ children }: TenderProviderProps) => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [allTenders, setAllTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const formatTenderData = (item: any): Tender => {
    // No need to parse tender_info as the new API structure doesn't have it
    // We'll use the processed_sections data if available, otherwise use basic info
    
    return {
      id: item.tender_id.toString(),
      title: item.tender_name || 'Untitled Tender',
      department: item.org_name || 'Personal',
      // Store org_name separately from department to use it in API calls
      org_name: item.org_name || null,
      status: 'Draft' as TenderStatus,
      deadline: new Date().toISOString(), // Will be updated when we get tender details
      uploadDate: item.created_at,
      tags: ['New'] as TenderTag[],
      aiConfidence: 95,
      tenderInfo: {
        annexuresAttachmentsRequired: []
      },
      progress: {
        parsing: true,
        analysis: false,
        docUpload: false,
        ready: false,
        submitted: false
      }
    };
  };

  const fetchTenders = async () => {
    try {
      setLoading(true);
      // Use the new API endpoint with user_id
      const userId = '123'; // Replace with actual user ID management
      const response = await fetch(`http://192.168.2.71:8000/recent-tenders?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenders');
      }
      
      const data = await response.json();
      console.log('Recent Tenders Response:', data);
      
      if (data.status === 'success') {
        const formattedTenders = data.tenders.map(formatTenderData);
        console.log('Formatted Recent Tenders:', formattedTenders);
        setTenders(formattedTenders);
        setError(null);
      } else {
        throw new Error('Failed to get tenders data');
      }
    } catch (err) {
      console.error('Error fetching recent tenders:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTenders = async (page: number) => {
    try {
      setLoading(true);
      // Use the new API endpoint with user_id
      const userId = '123'; // Replace with actual user ID management
      const response = await fetch(`http://192.168.2.71:8000/all-tenders?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenders');
      }
      
      const data = await response.json();
      console.log('All Tenders Response:', data);
      
      if (data.status === 'success') {
        const formattedTenders = data.tenders.map(formatTenderData);
        console.log('Formatted All Tenders:', formattedTenders);
        setAllTenders(formattedTenders);
        setTotalPages(Math.ceil(formattedTenders.length / ITEMS_PER_PAGE));
        setCurrentPage(page);
        setError(null);
      } else {
        throw new Error('Failed to get tenders data');
      }
    } catch (err) {
      console.error('Error fetching all tenders:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const addTender = (tender: Tender) => {
    setTenders((prev) => [...prev, tender]);
  };

  const updateTenderStatus = (id: string, status: TenderStatus) => {
    setTenders((prev) =>
      prev.map((tender) =>
        tender.id === id ? { ...tender, status } : tender
      )
    );
  };

  const getTenderById = (id: string) => {
    return tenders.find((tender) => tender.id === id);
  };

  const refreshTenders = async () => {
    await fetchTenders();
  };

  return (
    <TenderContext.Provider
      value={{ 
        tenders, 
        allTenders,
        loading, 
        error,
        totalPages,
        currentPage,
        addTender, 
        updateTenderStatus, 
        getTenderById,
        refreshTenders,
        fetchAllTenders
      }}
    >
      {children}
    </TenderContext.Provider>
  );
};