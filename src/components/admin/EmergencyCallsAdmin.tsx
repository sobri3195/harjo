
import React, { useState } from 'react';
import { Phone, Clock, MapPin, Users, AlertTriangle } from 'lucide-react';
import { useEmergencyCallSystem } from '@/hooks/useEmergencyCallSystem';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';

const EmergencyCallsAdmin = () => {
  const { emergencyCalls, updateCallStatus } = useEmergencyCallSystem();
  const { reports } = useEmergencyReports();
  const [selectedCall, setSelectedCall] = useState<string | null>(null);

  const getReportDetails = (reportId: string) => {
    return reports.find(r => r.id === reportId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'diterima': return 'bg-blue-100 text-blue-800';
      case 'dalam_perjalanan': return 'bg-yellow-100 text-yellow-800';
      case 'tiba_di_lokasi': return 'bg-orange-100 text-orange-800';
      case 'selesai': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeCalls = emergencyCalls.filter(call => call.status !== 'selesai');
  const completedCalls = emergencyCalls.filter(call => call.status === 'selesai');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Emergency Call Management</h2>
        <div className="flex items-center space-x-2">
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {activeCalls.length} Active Calls
          </div>
        </div>
      </div>

      {/* Active Calls */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Phone className="mr-2 text-red-600" size={20} />
            Panggilan Aktif ({activeCalls.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {activeCalls.map((call) => {
            const report = getReportDetails(call.reportId);
            return (
              <div key={call.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-semibold text-gray-800">#{call.id.slice(-8)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                        {call.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(call.priority)}`}>
                        {call.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    {report && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Pelapor: <span className="font-medium">{report.reporter_name}</span></p>
                          <p className="text-gray-600">Pasien: <span className="font-medium">{report.patient_name}</span></p>
                          <p className="text-gray-600">Jenis: <span className="font-medium">{report.type}</span></p>
                        </div>
                        <div>
                          <p className="text-gray-600 flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {call.location.address}
                          </p>
                          <p className="text-gray-600 flex items-center">
                            <Users size={14} className="mr-1" />
                            Tim: {call.teamMembers.join(', ')}
                          </p>
                          <p className="text-gray-600 flex items-center">
                            <Clock size={14} className="mr-1" />
                            {new Date(call.created_at).toLocaleTimeString('id-ID')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-3">
                  {call.status === 'diterima' && (
                    <button
                      onClick={() => updateCallStatus(call.id, 'dalam_perjalanan')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      🚑 Ambulans Berangkat
                    </button>
                  )}
                  {call.status === 'dalam_perjalanan' && (
                    <button
                      onClick={() => updateCallStatus(call.id, 'tiba_di_lokasi')}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      📍 Tiba di Lokasi
                    </button>
                  )}
                  {call.status === 'tiba_di_lokasi' && (
                    <button
                      onClick={() => updateCallStatus(call.id, 'selesai')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      ✅ Selesaikan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {activeCalls.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Phone size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Tidak ada panggilan darurat aktif</p>
            </div>
          )}
        </div>
      </div>

      {/* Completed Calls */}
      {completedCalls.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <AlertTriangle className="mr-2 text-green-600" size={20} />
              Panggilan Selesai ({completedCalls.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {completedCalls.slice(0, 10).map((call) => {
              const report = getReportDetails(call.reportId);
              return (
                <div key={call.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="font-medium text-gray-800">#{call.id.slice(-8)}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          SELESAI
                        </span>
                      </div>
                      {report && (
                        <div className="text-sm text-gray-600">
                          <span>{report.patient_name}</span> • 
                          <span className="ml-1">{report.type}</span> • 
                          <span className="ml-1">{new Date(call.completedAt!).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyCallsAdmin;
