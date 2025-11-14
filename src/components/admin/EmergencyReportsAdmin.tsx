
import React, { useState } from 'react';
import { Eye, Edit, Trash2, Filter, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import { Skeleton } from '@/components/ui/skeleton';

const EmergencyReportsAdmin = () => {
  const { reports, loading, updateReportStatus } = useEmergencyReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesType = filterType === 'all' || report.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewReport = (id: string) => {
    console.log('View report:', id);
  };

  const handleEditReport = (id: string) => {
    console.log('Edit report:', id);
  };

  const handleDeleteReport = (id: string) => {
    console.log('Delete report:', id);
  };

  const handleStatusUpdate = (id: string, newStatus: 'pending' | 'dalam_penanganan' | 'selesai') => {
    updateReportStatus(id, newStatus);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Laporan Darurat</h2>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Download size={16} />
          <span>Export Data</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Cari laporan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Semua Jenis</option>
            <option value="trauma">Trauma</option>
            <option value="heart">Jantung</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="dalam_penanganan">Dalam Penanganan</option>
            <option value="selesai">Selesai</option>
          </select>

          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Pelapor</TableHead>
              <TableHead>Pasien</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Tingkat Keparahan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">#{report.id.slice(-8)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    report.type === 'trauma' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {report.type === 'trauma' ? 'Trauma' : 'Jantung'}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{report.reporter_name}</div>
                    <div className="text-sm text-gray-500">{report.reporter_rank}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{report.patient_name}</div>
                    {report.patient_rank && <div className="text-sm text-gray-500">{report.patient_rank}</div>}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(report.created_at).toLocaleString('id-ID')}
                </TableCell>
                <TableCell>{report.location}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    report.severity === 'berat' ? 'bg-red-100 text-red-800' :
                    report.severity === 'sedang' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <select
                    value={report.status}
                    onChange={(e) => handleStatusUpdate(report.id, e.target.value as any)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                      report.status === 'selesai' ? 'bg-green-100 text-green-800' :
                      report.status === 'dalam_penanganan' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="pending">Menunggu</option>
                    <option value="dalam_penanganan">Dalam Penanganan</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewReport(report.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Lihat Detail"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditReport(report.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredReports.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
              ? 'Tidak ada laporan yang sesuai dengan filter' 
              : 'Belum ada laporan darurat'}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyReportsAdmin;
