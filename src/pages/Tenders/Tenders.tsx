import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Building, User } from 'lucide-react';
import { useTenderContext } from '../../context/TenderContext';
import TenderCard from '../../components/Dashboard/TenderCard';
import { TenderStatus } from '../../types';

const ITEMS_PER_PAGE = 6;

type TenderType = 'all' | 'organization' | 'personal';

const Tenders = () => {
  const { allTenders, loading, error, totalPages, currentPage, fetchAllTenders } = useTenderContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenderStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TenderType>('all');

  useEffect(() => {
    fetchAllTenders(1);
  }, []);

  const filteredTenders = allTenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tender.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tender.status === statusFilter;
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'organization' && tender.org_name === 'lepton') ||
                       (typeFilter === 'personal' && !tender.org_name);
    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedTenders = filteredTenders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    fetchAllTenders(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tenders</h1>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search tenders..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filters Container */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TenderStatus | 'all')}
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            </div>

            {/* Type Filter */}
            <div className="w-full sm:w-48">
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as TenderType)}
                >
                  <option value="all">All Types</option>
                  <option value="organization">Organization</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tenders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading tenders: {error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTenders.map((tender) => (
              <TenderCard key={tender.id} tender={tender} />
            ))}
            {paginatedTenders.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'No tenders match your search criteria'
                    : 'No tenders available'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredTenders.length > 0 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg border ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Tenders; 