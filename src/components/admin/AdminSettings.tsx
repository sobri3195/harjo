
import React, { useState } from 'react';
import { Save, Bell, Shield, Database, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    hospitalName: 'RSPAU dr. Suhardi Harjolukito',
    adminEmail: 'admin@rsau-efram.mil.id',
    emergencyPhone: '115',
    autoNotification: true,
    emailNotification: true,
    smsNotification: false,
    responseTimeLimit: '5',
    maxActiveReports: '10'
  });

  const handleSave = () => {
    console.log('Saving settings:', settings);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-800">Pengaturan Sistem</h2>

      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <Database className="text-blue-600 mr-2" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Pengaturan Umum</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Rumah Sakit
            </label>
            <Input
              value={settings.hospitalName}
              onChange={(e) => handleInputChange('hospitalName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Administrator
            </label>
            <Input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => handleInputChange('adminEmail', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor Darurat
            </label>
            <Input
              value={settings.emergencyPhone}
              onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batas Waktu Respon (menit)
            </label>
            <Input
              type="number"
              value={settings.responseTimeLimit}
              onChange={(e) => handleInputChange('responseTimeLimit', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <Bell className="text-green-600 mr-2" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Pengaturan Notifikasi</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Notifikasi Otomatis</h4>
              <p className="text-sm text-gray-600">Kirim notifikasi otomatis untuk laporan baru</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoNotification}
                onChange={(e) => handleInputChange('autoNotification', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Notifikasi Email</h4>
              <p className="text-sm text-gray-600">Kirim notifikasi melalui email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotification}
                onChange={(e) => handleInputChange('emailNotification', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Notifikasi SMS</h4>
              <p className="text-sm text-gray-600">Kirim notifikasi melalui SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsNotification}
                onChange={(e) => handleInputChange('smsNotification', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* System Limits */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <Shield className="text-purple-600 mr-2" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Batasan Sistem</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maksimal Laporan Aktif
            </label>
            <Input
              type="number"
              value={settings.maxActiveReports}
              onChange={(e) => handleInputChange('maxActiveReports', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Save size={16} />
          <span>Simpan Pengaturan</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
