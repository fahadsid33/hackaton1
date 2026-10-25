import React from 'react';
import { Shield, EyeOff, MapPin, Database } from 'lucide-react';

export default function PrivacyNotice({ storePhotos = false }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
      <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-2">
        <Shield className="w-4 h-4" />
        <span>Privacy & Data Transparency Notice</span>
      </div>
      <p className="text-slate-400 mb-3 leading-relaxed">
        In accordance with privacy and biometric compliance standards, this system is configured to capture only the essential verification telemetry required for attendance approval:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="flex items-start space-x-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <EyeOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-slate-200">
              {storePhotos ? 'Photo Backup Active' : 'No Photo Stored'}
            </div>
            <div className="text-[11px] text-slate-400">
              {storePhotos
                ? 'Company policy archives verification proof photo.'
                : 'Raw camera video stays on your device. Only face count & match metrics are sent.'}
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-slate-200">Location Geofencing</div>
            <div className="text-[11px] text-slate-400">
              GPS coordinates are verified on the server against the office radius and accuracy threshold.
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <Database className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-slate-200">Server Time Authoritative</div>
            <div className="text-[11px] text-slate-400">
              Official check-in timestamps are assigned by the server clock to prevent device clock spoofing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
