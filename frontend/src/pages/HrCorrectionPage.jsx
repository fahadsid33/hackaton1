import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function HrCorrectionPage({ currentEmployee }) {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [requestedType, setRequestedType] = useState('CHECK_IN');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetTime, setTargetTime] = useState('09:00');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const res = await api.getCorrections();
      setCorrections(res.corrections || []);
    } catch (err) {
      console.error('Failed to load corrections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, [currentEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentEmployee || !reason.trim()) {
      alert('Please fill out the reason for HR correction.');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await api.submitCorrection({
        employeeId: currentEmployee.id,
        requestedType,
        targetDate,
        targetTime,
        reason: reason.trim()
      });

      setMessage({ type: 'success', text: 'HR correction request submitted successfully! An HR administrator will review it.' });
      setReason('');
      fetchCorrections();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit correction' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">HR Attendance Correction Fallback</h2>
            <p className="text-xs text-slate-400">
              When camera detection or GPS location verification encounters an issue, submit a manual correction for HR review
            </p>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
          <span>Submit New Correction Request</span>
          <span className="text-xs text-indigo-400 font-normal">
            ({currentEmployee?.name} • {currentEmployee?.id})
          </span>
        </h3>

        {message && (
          <div
            className={`p-3.5 rounded-xl mb-4 text-xs flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                : 'bg-red-950/70 text-red-300 border border-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Attendance Action</label>
              <select
                value={requestedType}
                onChange={(e) => setRequestedType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="CHECK_IN">Check-In</option>
                <option value="CHECK_OUT">Check-Out</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Actual Time</label>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Reason & Context (e.g., GPS drift in underground lab, lighting glitch, office elevator)
            </label>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the automated camera/geofence check failed..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-amber-900/30"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Submit Correction for HR Review</span>
          </button>
        </form>
      </div>

      {/* Requests History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Correction Requests History</h3>
          <button
            onClick={fetchCorrections}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {corrections.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No correction requests submitted.</p>
        ) : (
          <div className="space-y-3">
            {corrections.map((corr) => {
              const isApproved = corr.status === 'APPROVED';
              const isRejected = corr.status === 'REJECTED';
              const isPending = corr.status === 'PENDING';

              return (
                <div
                  key={corr.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{corr.employeeName}</span>
                      <span className="text-slate-500">({corr.employeeId})</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px]">
                        {corr.requestedType}
                      </span>
                    </div>

                    <div>
                      {isApproved && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-950 text-red-400 border border-red-800 flex items-center space-x-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejected</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-800 flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Awaiting Review</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300">
                    <span className="text-slate-500">Target Time:</span> {corr.targetDate} at {corr.targetTime}
                  </p>
                  <p className="text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    "{corr.reason}"
                  </p>

                  {corr.reviewNotes && (
                    <div className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded border border-indigo-900/50">
                      <strong>HR Note ({corr.reviewedBy}):</strong> {corr.reviewNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
