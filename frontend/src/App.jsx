import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Admissions from './pages/Admissions';
import Beds from './pages/Beds';
import Doctors from './pages/Doctors';
import Treatments from './pages/Treatments';
import Billing from './pages/Billing';
import { api } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metadata, setMetadata] = useState({
    departments: [],
    admission_types: [],
    bed_types: [],
    wards: [],
    outcomes: [],
    insurance_options: [],
    genders: [],
    date_bounds: { min_date: '2024-01-01', max_date: '2025-12-31' },
  });
  const [dataSource, setDataSource] = useState('CSV');

  // Global filters
  const [globalFilters, setGlobalFilters] = useState({
    startDate: '',
    endDate: '',
    department: 'all',
    admissionType: 'all',
  });

  // Load initial metadata and health check
  useEffect(() => {
    async function init() {
      try {
        const meta = await api.getMetadata();
        setMetadata(meta);
        const health = await api.getHealth();
        if (health?.data_source) {
          setDataSource(health.data_source);
        }
      } catch (err) {
        console.warn('Could not load metadata on startup:', err);
      }
    }
    init();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger re-render / reload across active tabs
    try {
      const meta = await api.getMetadata();
      setMetadata(meta);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        dataSource={dataSource}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Header */}
        <Header
          activeTab={activeTab}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          globalFilters={globalFilters}
          setGlobalFilters={setGlobalFilters}
          departments={metadata.departments || []}
        />

        {/* Page View Container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <Dashboard 
              globalFilters={globalFilters} 
              setGlobalFilters={setGlobalFilters}
              metadata={metadata}
              onNavigateTab={setActiveTab}
            />
          )}
          {activeTab === 'patients' && (
            <Patients 
              globalFilters={globalFilters} 
              metadata={metadata}
            />
          )}
          {activeTab === 'admissions' && (
            <Admissions 
              globalFilters={globalFilters} 
              metadata={metadata}
            />
          )}
          {activeTab === 'beds' && (
            <Beds 
              globalFilters={globalFilters} 
              metadata={metadata}
            />
          )}
          {activeTab === 'doctors' && (
            <Doctors 
              globalFilters={globalFilters} 
              metadata={metadata}
            />
          )}
          {activeTab === 'treatments' && (
            <Treatments 
              globalFilters={globalFilters} 
              metadata={metadata}
            />
          )}
          {activeTab === 'billing' && (
            <Billing 
              globalFilters={globalFilters} 
              metadata={metadata}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              <strong>Hospital Operations Intelligence</strong> • Data-driven insights for hospital operations
            </p>
            <p className="text-slate-400">
              Built with React, FastAPI & Pandas • Connected to GitHub Repository
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
