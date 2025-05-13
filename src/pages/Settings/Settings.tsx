import React, { useState } from 'react';
import { mockOrganization } from '../../data/mockData';
import { Save, Users, Building, CreditCard } from 'lucide-react';

const Settings = () => {
  const [organization, setOrganization] = useState(mockOrganization);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setOrganization({
        ...organization,
        [parent]: {
          ...organization[parent as keyof typeof organization],
          [child]: value,
        },
      });
    } else {
      setOrganization({
        ...organization,
        [name]: value,
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save organization data
    console.log('Organization data saved:', organization);
  };
  
  const tabs = [
    { id: 'org', name: 'Organization Details', icon: Building },
    { id: 'team', name: 'Team Management', icon: Users },
    { id: 'billing', name: 'Billing & Subscription', icon: CreditCard },
  ];
  
  const [activeTab, setActiveTab] = useState('org');
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your organization profile and preferences.</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`
                  flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent'}
                `}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} className="mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'org' && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={organization.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="pan" className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    id="pan"
                    name="pan"
                    value={organization.pan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="gst" className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    id="gst"
                    name="gst"
                    value={organization.gst}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="msme" className="block text-sm font-medium text-gray-700 mb-1">
                    MSME Registration Number
                  </label>
                  <input
                    type="text"
                    id="msme"
                    name="msme"
                    value={organization.msme}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={organization.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="bankDetails.accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    id="bankDetails.accountNumber"
                    name="bankDetails.accountNumber"
                    value={organization.bankDetails.accountNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="bankDetails.bankName" className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    id="bankDetails.bankName"
                    name="bankDetails.bankName"
                    value={organization.bankDetails.bankName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="bankDetails.ifsc" className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    id="bankDetails.ifsc"
                    name="bankDetails.ifsc"
                    value={organization.bankDetails.ifsc}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3">Contact Person</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={organization.contactPerson}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={organization.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={organization.contactPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                >
                  <Save size={16} className="mr-2" />
                  Save Changes
                </button>
              </div>
            </form>
          )}
          
          {activeTab === 'team' && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Team Management</h3>
              <p className="text-gray-600">This section will allow you to manage team members and their roles.</p>
            </div>
          )}
          
          {activeTab === 'billing' && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Billing & Subscription</h3>
              <p className="text-gray-600">This section will allow you to manage your subscription and billing information.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;