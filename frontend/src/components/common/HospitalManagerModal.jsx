import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Database, 
  UploadCloud, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Layers, 
  BedDouble, 
  Users, 
  FileText, 
  X, 
  RotateCw, 
  Sparkles,
  HardDrive,
  ShieldCheck,
  Code
} from 'lucide-react';
import { api } from '../../api/client';

export default function HospitalManagerModal({ isOpen, onClose, onHospitalSwitched, currentHospital }) {
  const [activeTab, setActiveTab] = useState('switcher'); // 'switcher' | 'connect-db' | 'upload' | 'create' | 'schema'
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // DB Connection Form
  const [dbConfig, setDbConfig] = useState({
    hospital_id: currentHospital?.id || 'hosp_metro',
    db_type: 'mysql',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hospital_db',
  });
  const [testResult, setTestResult] = useState(null);

  // New Hospital Form
  const [newHospital, setNewHospital] = useState({
    name: '',
    code: '',
    type: 'Multi-Speciality Tertiary Care',
    city: '',
    state: '',
    beds_count: 250,
    departments_count: 10,
    description: '',
  });

  // File Upload State
  const [uploadFiles, setUploadFiles] = useState({
    admissions: null,
    patients: null,
    doctors: null,
    beds: null,
    treatments: null,
    billing: null,
  });

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const data = await api.getHospitals();
      setHospitals(data);
      if (currentHospital?.id) {
        setDbConfig(prev => ({ ...prev, hospital_id: currentHospital.id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load hospital profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHospitals();
      setMessage(null);
      setError(null);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitch = async (hospitalId) => {
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.switchHospital(hospitalId);
      setMessage(`Switched active hospital to: ${res.active_hospital?.name}`);
      await loadHospitals();
      if (onHospitalSwitched) {
        onHospitalSwitched(res.active_hospital);
      }
    } catch (err) {
      setError(err.message || 'Failed to switch hospital');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestConnection = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setTestResult(null);
    setError(null);
    try {
      const res = await api.testDbConnection(dbConfig);
      setTestResult(res);
      if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to test database connection');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDbConnection = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.connectHospitalDb(dbConfig.hospital_id, dbConfig);
      setMessage(res.message || 'Database connected successfully!');
      await loadHospitals();
      if (onHospitalSwitched) {
        onHospitalSwitched(res.hospital);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect hospital database');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    if (!newHospital.name || !newHospital.city) {
      setError('Hospital name and city are required.');
      return;
    }
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.createHospital(newHospital);
      setMessage(`Hospital profile '${res.hospital?.name}' created successfully!`);
      // Auto-switch to newly created hospital
      if (res.hospital?.id) {
        await api.switchHospital(res.hospital.id);
        if (onHospitalSwitched) {
          onHospitalSwitched(res.hospital);
        }
      }
      await loadHospitals();
      setActiveTab('switcher');
      setNewHospital({
        name: '',
        code: '',
        type: 'Multi-Speciality Tertiary Care',
        city: '',
        state: '',
        beds_count: 250,
        departments_count: 10,
        description: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to create hospital profile');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFiles.admissions) {
      setError('Please select at least the admissions.csv dataset file.');
      return;
    }
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      Object.entries(uploadFiles).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });
      const res = await api.uploadHospitalData(currentHospital?.id || 'hosp_metro', formData);
      setMessage(res.message || 'Dataset files uploaded and applied successfully!');
      if (onHospitalSwitched) {
        onHospitalSwitched(currentHospital);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload datasets');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                Hospital & Database Management Center
                <span className="text-[10px] uppercase font-semibold bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-500/30">
                  Multi-Tenant
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect any hospital database (MySQL/PostgreSQL/SQLite), upload custom CSVs, or switch hospital instances.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 overflow-x-auto gap-2">
          <button
            onClick={() => { setActiveTab('switcher'); setMessage(null); setError(null); }}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'switcher'
                ? 'border-brand-600 text-brand-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Switch Active Hospital ({hospitals.length})
          </button>
          <button
            onClick={() => { setActiveTab('connect-db'); setMessage(null); setError(null); }}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'connect-db'
                ? 'border-brand-600 text-brand-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="h-4 w-4 text-emerald-600" />
            Connect Live Database (MySQL / Postgres)
          </button>
          <button
            onClick={() => { setActiveTab('upload'); setMessage(null); setError(null); }}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'upload'
                ? 'border-brand-600 text-brand-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="h-4 w-4 text-blue-600" />
            Upload Custom CSV Dataset
          </button>
          <button
            onClick={() => { setActiveTab('create'); setMessage(null); setError(null); }}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'create'
                ? 'border-brand-600 text-brand-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="h-4 w-4 text-purple-600" />
            Add New Hospital Profile
          </button>
          <button
            onClick={() => { setActiveTab('schema'); setMessage(null); setError(null); }}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'schema'
                ? 'border-brand-600 text-brand-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="h-4 w-4 text-slate-600" />
            SQL Schema Guide
          </button>
        </div>

        {/* Notification Alerts */}
        {message && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: HOSPITAL SWITCHER */}
          {activeTab === 'switcher' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Available Hospital Databases</h3>
                  <p className="text-xs text-slate-500">
                    Select a hospital instance below. All metrics, charts, patient cohorts, and bed capacities update instantly.
                  </p>
                </div>
                <button
                  onClick={loadHospitals}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-brand-600 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white shadow-xs"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hospitals.map((hosp) => {
                  const isActive = hosp.is_active;
                  return (
                    <div
                      key={hosp.id}
                      className={`relative p-5 rounded-xl border transition-all ${
                        isActive
                          ? 'border-brand-500 bg-brand-50/40 shadow-sm ring-1 ring-brand-500/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{hosp.name}</h4>
                            {isActive && (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {hosp.city}, {hosp.state} • <span className="text-brand-700">{hosp.type}</span>
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {hosp.code}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mb-3.5 line-clamp-2">
                        {hosp.description}
                      </p>

                      <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-white/80 rounded-lg border border-slate-200/80 text-[11px] mb-4">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Bed Capacity</span>
                          <span className="font-bold text-slate-800">{hosp.beds_count} Beds</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Departments</span>
                          <span className="font-bold text-slate-800">{hosp.departments_count} Units</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Data Source</span>
                          <span className="font-semibold text-brand-600">{hosp.source_type}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-slate-500">
                          {hosp.live_records ? (
                            <span><strong>{hosp.live_records.toLocaleString()}</strong> Active Records</span>
                          ) : (
                            <span>Ready to load</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleSwitch(hosp.id)}
                          disabled={isActive || actionLoading}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            isActive
                              ? 'bg-brand-600 text-white cursor-default'
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-95 disabled:opacity-50'
                          }`}
                        >
                          {isActive ? 'Current Active' : 'Switch Database'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CONNECT LIVE DATABASE */}
          {activeTab === 'connect-db' && (
            <form onSubmit={handleSaveDbConnection} className="space-y-4 max-w-2xl mx-auto">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Connect External SQL Database</h3>
                <p className="text-xs text-slate-500">
                  Connect your hospital's MySQL, PostgreSQL, or SQLite database. The dashboard will automatically sync and compute analytics from your tables.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hospital Facility</label>
                  <select
                    value={dbConfig.hospital_id}
                    onChange={(e) => setDbConfig({ ...dbConfig, hospital_id: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Database Engine</label>
                  <select
                    value={dbConfig.db_type}
                    onChange={(e) => {
                      const t = e.target.value;
                      setDbConfig({
                        ...dbConfig,
                        db_type: t,
                        port: t === 'postgres' ? 5432 : 3306
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="mysql">MySQL Server</option>
                    <option value="mariadb">MariaDB</option>
                    <option value="postgres">PostgreSQL</option>
                    <option value="sqlite">SQLite Database File</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Host / Server IP</label>
                  <input
                    type="text"
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                    placeholder="localhost or 192.168.1.100"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
                  <input
                    type="number"
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig({ ...dbConfig, port: parseInt(e.target.value) || 3306 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Database User</label>
                  <input
                    type="text"
                    value={dbConfig.user}
                    onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
                    placeholder="root or db_admin"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Database Password</label>
                  <input
                    type="password"
                    value={dbConfig.password}
                    onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Database Name</label>
                  <input
                    type="text"
                    value={dbConfig.database}
                    onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                    placeholder="hospital_operations_db"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {testResult && testResult.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Connection Successful!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">{testResult.message}</p>
                  {testResult.tables && (
                    <p className="text-[11px] font-mono text-emerald-900">
                      Detected Tables: {testResult.tables.join(', ')}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5"
                >
                  <Server className="h-3.5 w-3.5" />
                  Test DB Connection
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save & Connect Database
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: UPLOAD CSV DATASET */}
          {activeTab === 'upload' && (
            <form onSubmit={handleFileUpload} className="space-y-4 max-w-2xl mx-auto">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload Hospital CSV Files</h3>
                <p className="text-xs text-slate-500">
                  Upload CSV datasets exported from your Hospital Information System (HIS / EHR). All files will be automatically ingested and parsed.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'admissions', label: 'Admissions Dataset (admissions.csv)', required: true },
                  { key: 'patients', label: 'Patients Master (patients.csv)', required: false },
                  { key: 'doctors', label: 'Doctors & Staff (doctors.csv)', required: false },
                  { key: 'beds', label: 'Bed Inventory (beds.csv)', required: false },
                  { key: 'treatments', label: 'Treatments & Procedures (treatments.csv)', required: false },
                  { key: 'billing', label: 'Billing & Invoices (billing.csv)', required: false },
                ].map(({ key, label, required }) => (
                  <div key={key} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        {label} {required && <span className="text-rose-500">*</span>}
                      </label>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setUploadFiles({ ...uploadFiles, [key]: e.target.files[0] })}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload & Ingest Hospital Data
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: ADD NEW HOSPITAL PROFILE */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateHospital} className="space-y-4 max-w-2xl mx-auto">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Register New Hospital Instance</h3>
                <p className="text-xs text-slate-500">
                  Add a new hospital facility. You can configure its departments, bed capacity, and connect a dedicated database or dataset.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Facility Name *</label>
                  <input
                    type="text"
                    required
                    value={newHospital.name}
                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                    placeholder="e.g. City General Memorial Hospital"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Code</label>
                  <input
                    type="text"
                    value={newHospital.code}
                    onChange={(e) => setNewHospital({ ...newHospital, code: e.target.value })}
                    placeholder="e.g. CGMH-04"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Classification</label>
                  <select
                    value={newHospital.type}
                    onChange={(e) => setNewHospital({ ...newHospital, type: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="Multi-Speciality Tertiary Care">Multi-Speciality Tertiary Care</option>
                    <option value="Trauma & Emergency Center">Trauma & Emergency Center</option>
                    <option value="Cardiology & Vascular Institute">Cardiology & Vascular Institute</option>
                    <option value="Oncology & Research Center">Oncology & Research Center</option>
                    <option value="Children & Pediatric Hospital">Children & Pediatric Hospital</option>
                    <option value="District General Hospital">District General Hospital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newHospital.city}
                    onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })}
                    placeholder="e.g. Mumbai / Delhi / Coimbatore"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={newHospital.state}
                    onChange={(e) => setNewHospital({ ...newHospital, state: e.target.value })}
                    placeholder="e.g. Maharashtra / Tamil Nadu"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Bed Capacity</label>
                  <input
                    type="number"
                    value={newHospital.beds_count}
                    onChange={(e) => setNewHospital({ ...newHospital, beds_count: parseInt(e.target.value) || 100 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Departments Count</label>
                  <input
                    type="number"
                    value={newHospital.departments_count}
                    onChange={(e) => setNewHospital({ ...newHospital, departments_count: parseInt(e.target.value) || 8 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Description</label>
                  <textarea
                    rows={2}
                    value={newHospital.description}
                    onChange={(e) => setNewHospital({ ...newHospital, description: e.target.value })}
                    placeholder="Brief description of hospital scope, specialties, or facilities..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Hospital Profile & Initialize
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: SQL SCHEMA REFERENCE */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hospital Database Standard Schema</h3>
                <p className="text-xs text-slate-500">
                  Any hospital database or CSV export matching this standard relational schema will plug seamlessly into this intelligence engine.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto space-y-1">
                  <span className="text-brand-400 font-bold block mb-1">-- Admissions Table</span>
                  <p>Admission_ID (VARCHAR PK)</p>
                  <p>Patient_ID (VARCHAR FK)</p>
                  <p>Doctor_ID (VARCHAR FK)</p>
                  <p>Bed_ID (VARCHAR FK)</p>
                  <p>Disease (VARCHAR)</p>
                  <p>Admission_Type (Emergency/Inpatient/Outpatient)</p>
                  <p>Admission_Date (DATE)</p>
                  <p>Admission_Time (TIME)</p>
                  <p>Waiting_Time_Minutes (INT)</p>
                  <p>Discharge_Date (DATE)</p>
                  <p>Length_of_Stay (INT)</p>
                  <p>Readmission (Yes/No)</p>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto space-y-1">
                  <span className="text-emerald-400 font-bold block mb-1">-- Billing & Financials Table</span>
                  <p>Bill_ID (VARCHAR PK)</p>
                  <p>Admission_ID (VARCHAR FK)</p>
                  <p>Treatment_Cost (DECIMAL)</p>
                  <p>Medicine_Cost (DECIMAL)</p>
                  <p>Room_Charges (DECIMAL)</p>
                  <p>Insurance (Yes/No)</p>
                  <p>Amount_Paid (DECIMAL)</p>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto space-y-1">
                  <span className="text-blue-400 font-bold block mb-1">-- Patients Table</span>
                  <p>Patient_ID (VARCHAR PK)</p>
                  <p>Patient_Name (VARCHAR)</p>
                  <p>Age (INT)</p>
                  <p>Gender (Male/Female)</p>
                  <p>Blood_Group (VARCHAR)</p>
                  <p>City (VARCHAR)</p>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto space-y-1">
                  <span className="text-purple-400 font-bold block mb-1">-- Beds & Capacity Table</span>
                  <p>Bed_ID (VARCHAR PK)</p>
                  <p>Ward (VARCHAR)</p>
                  <p>Room_Number (VARCHAR)</p>
                  <p>Bed_Type (General/ICU/Private)</p>
                  <p>Department_ID (VARCHAR FK)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
