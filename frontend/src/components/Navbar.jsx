import React from 'react';
import { Camera, MapPin, ShieldCheck, UserCheck, ClipboardList, Settings, User } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  employees,
  currentEmployee,
  setCurrentEmployee,
  office
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('camera')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                GeoFace
              </span>
              <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-medium">
                Attendance
              </span>
            </div>
          </div>

          {/* Nav Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'camera'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('enroll')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'enroll'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Enroll Face</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>My History</span>
            </button>

            <button
              onClick={() => setActiveTab('corrections')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'corrections'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>HR Correction</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Admin & Geofence</span>
            </button>
          </nav>

          {/* Active Employee Selector & Office Pill */}
          <div className="flex items-center space-x-3">
            {office && (
              <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium text-slate-300">{office.name}</span>
                <span className="text-slate-500">({office.radiusMeters}m radius)</span>
              </div>
            )}

            <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1">
              <User className="w-4 h-4 text-indigo-400" />
              <select
                value={currentEmployee ? currentEmployee.id : ''}
                onChange={(e) => {
                  const emp = employees.find((em) => em.id === e.target.value);
                  if (emp) setCurrentEmployee(emp);
                }}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-slate-900 text-slate-200">
                    {emp.name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-950/90 border-t border-slate-800 py-2 px-1 text-xs">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'camera' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Camera className="w-4 h-4 mb-0.5" />
          <span>Camera</span>
        </button>
        <button
          onClick={() => setActiveTab('enroll')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'enroll' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <UserCheck className="w-4 h-4 mb-0.5" />
          <span>Enroll</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'history' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <ClipboardList className="w-4 h-4 mb-0.5" />
          <span>History</span>
        </button>
        <button
          onClick={() => setActiveTab('corrections')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'corrections' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4 mb-0.5" />
          <span>HR</span>
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'admin' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Settings className="w-4 h-4 mb-0.5" />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
}
