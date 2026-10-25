import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AttendanceCheckInPage from './pages/AttendanceCheckInPage';
import EmployeeEnrollPage from './pages/EmployeeEnrollPage';
import EmployeeHistoryPage from './pages/EmployeeHistoryPage';
import HrCorrectionPage from './pages/HrCorrectionPage';
import AdminOfficeSettingsPage from './pages/AdminOfficeSettingsPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('camera'); // camera | enroll | history | corrections | admin
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [office, setOffice] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadInitialData = async () => {
    try {
      const [empRes, offRes] = await Promise.all([api.getEmployees(), api.getOffice()]);
      const empList = empRes.employees || [];
      setEmployees(empList);
      if (empList.length > 0 && !currentEmployee) {
        setCurrentEmployee(empList[0]);
      }
      setOffice(offRes.office);
    } catch (err) {
      console.error('Failed to load initial data from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const refreshOffice = async () => {
    try {
      const res = await api.getOffice();
      setOffice(res.office);
    } catch (err) {
      console.error('Failed to refresh office:', err);
    }
  };

  const refreshEmployees = async () => {
    try {
      const res = await api.getEmployees();
      setEmployees(res.employees || []);
      if (currentEmployee) {
        const updated = res.employees.find((e) => e.id === currentEmployee.id);
        if (updated) setCurrentEmployee(updated);
      }
    } catch (err) {
      console.error('Failed to refresh employees:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-4">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-medium">Connecting to GeoFace Attendance System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        employees={employees}
        currentEmployee={currentEmployee}
        setCurrentEmployee={setCurrentEmployee}
        office={office}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'camera' && (
          <AttendanceCheckInPage
            currentEmployee={currentEmployee}
            office={office}
            onNavigateToCorrection={() => setActiveTab('corrections')}
            onAttendanceComplete={refreshEmployees}
            onRefreshOffice={refreshOffice}
          />
        )}

        {activeTab === 'enroll' && (
          <EmployeeEnrollPage
            currentEmployee={currentEmployee}
            onEmployeeUpdated={refreshEmployees}
          />
        )}

        {activeTab === 'history' && (
          <EmployeeHistoryPage
            currentEmployee={currentEmployee}
            onNavigateToCorrection={() => setActiveTab('corrections')}
          />
        )}

        {activeTab === 'corrections' && (
          <HrCorrectionPage
            currentEmployee={currentEmployee}
          />
        )}

        {activeTab === 'admin' && (
          <AdminOfficeSettingsPage
            office={office}
            onRefreshOffice={refreshOffice}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        GeoFace Attendance AI &bull; Web &amp; Mobile Camera Verification &bull; Haversine Geofencing Engine
      </footer>
    </div>
  );
}
