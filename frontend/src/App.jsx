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
import HospitalManagerModal from './components/common/HospitalManagerModal';
import { api } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);
  const [activeHospital, setActiveHospital] = useState(null);
  const [dataSource, setDataSource] = useState('CSV');
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Global filters
  const [globalFilters, setGlobalFilters] = useState({
    startDate: '',
    endDate: '',
    department: 'all',
    admissionType: 'all',
  });

  // Load initial metadata, active hospital, and health status
  const loadSystemContext = async () => {
    try {
      const [meta, activeHospData, health] = await Promise.all([
        api.getMetadata().catch(() => null),
        api.getActiveHospital().catch(() => null),
        api.getHealth().catch(() => null)
      ]);

      if (meta) setMetadata(meta);
      if (activeHospData?.hospital) {
        setActiveHospital(activeHospData.hospital);
        if (activeHospData.source) setDataSource(activeHospData.source);
      }
      if (health?.data_source && !activeHospData?.source) {
        setDataSource(health.data_source);
      }
    } catch (err) {
      console.warn('Could not load system context on startup:', err);
    }
  };

  useEffect(() => {
    loadSystemContext();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadSystemContext();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleHospitalSwitched = async (newHospital) => {
    setActiveHospital(newHospital);
    await handleRefresh();
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
        activeHospital={activeHospital}
        onOpenHospitalManager={() => setIsHospitalModalOpen(true)}
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
          activeHospital={activeHospital}
          onOpenHospitalManager={() => setIsHospitalModalOpen(true)}
        />

        {/* Page View Container with Key for Clean Remount on Hospital Switch */}
        <main key={`page-view-${refreshKey}-${activeHospital?.id || 'metro'}`} className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
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
              <strong>Hospital Operations Intelligence</strong> • Multi-Facility Healthcare Analytics Engine
            </p>
            <p className="text-slate-400">
              Active Facility: <strong className="text-slate-600">{activeHospital?.name || 'Default Hospital'}</strong> ({dataSource})
            </p>
          </div>
        </footer>
      </div>

      {/* Hospital & Database Manager Modal */}
      <HospitalManagerModal
        isOpen={isHospitalModalOpen}
        onClose={() => setIsHospitalModalOpen(false)}
        onHospitalSwitched={handleHospitalSwitched}
        currentHospital={activeHospital}
      />
    </div>
  );
}
