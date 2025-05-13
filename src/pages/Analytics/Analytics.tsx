import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { useTenderContext } from '../../context/TenderContext';
import { TenderStatus } from '../../types';

const Analytics = () => {
  const { tenders } = useTenderContext();

  // Calculate status distribution
  const statusDistribution = tenders.reduce((acc, tender) => {
    acc[tender.status] = (acc[tender.status] || 0) + 1;
    return acc;
  }, {} as Record<TenderStatus, number>);

  const pieData = Object.entries(statusDistribution).map(([id, value]) => ({
    id,
    label: id,
    value,
  }));

  // Monthly submission data
  const monthlyData = [
    { month: 'Jan', submissions: 5, wins: 2 },
    { month: 'Feb', submissions: 7, wins: 3 },
    { month: 'Mar', submissions: 4, wins: 1 },
    // Add more months...
  ];

  // Department-wise success rate
  const departmentData = [
    {
      department: 'Ministry of Urban Dev',
      submitted: 8,
      won: 3,
    },
    {
      department: 'Ministry of Health',
      submitted: 6,
      won: 2,
    },
    // Add more departments...
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your tender performance and insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Tender Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tender Status Distribution</h2>
          <div className="h-80">
            <ResponsivePie
              data={pieData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ scheme: 'nivo' }}
              borderWidth={1}
              borderColor={{ theme: 'background' }}
              enableArcLinkLabels={true}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="white"
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#999',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                },
              ]}
            />
          </div>
        </div>

        {/* Monthly Submissions vs Wins */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Performance</h2>
          <div className="h-80">
            <ResponsiveBar
              data={monthlyData}
              keys={['submissions', 'wins']}
              indexBy="month"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              groupMode="grouped"
              colors={{ scheme: 'nivo' }}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                },
              ]}
            />
          </div>
        </div>

        {/* Department Success Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Department-wise Performance</h2>
          <div className="h-96">
            <ResponsiveBar
              data={departmentData}
              keys={['submitted', 'won']}
              indexBy="department"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              groupMode="grouped"
              colors={{ scheme: 'nivo' }}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
              }}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Common Disqualification Reasons</h3>
          <ul className="space-y-4">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Missing technical documentation (35%)</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Incomplete financial details (28%)</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Non-compliance with eligibility (20%)</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Reused Documents</h3>
          <ul className="space-y-4">
            <li className="flex justify-between items-center">
              <span className="text-gray-600">Company Registration</span>
              <span className="text-sm font-medium text-blue-600">Used 15 times</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-600">ISO Certificates</span>
              <span className="text-sm font-medium text-blue-600">Used 12 times</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-600">Financial Statements</span>
              <span className="text-sm font-medium text-blue-600">Used 10 times</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Success Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Win Rate</span>
                <span className="text-sm font-medium text-green-600">32%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Qualification Rate</span>
                <span className="text-sm font-medium text-blue-600">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">On-time Submission</span>
                <span className="text-sm font-medium text-purple-600">90%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;