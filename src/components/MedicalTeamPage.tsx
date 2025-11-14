
import React from 'react';
import { Users, Phone, Clock, MapPin } from 'lucide-react';

const MedicalTeamPage = () => {
  const medicalTeam = [
    {
      id: 1,
      name: 'Dr. Kolonel Adi Setiawan, Sp.JP',
      specialty: 'Kardiologi',
      status: 'Piket',
      phone: '0821-1234-5678',
      location: 'IGD RSAU',
      shift: '07:00 - 19:00'
    },
    {
      id: 2,
      name: 'Dr. Mayor Susan Hartini, Sp.B',
      specialty: 'Bedah Trauma',
      status: 'Piket',
      phone: '0821-8765-4321',
      location: 'Ruang Operasi',
      shift: '07:00 - 19:00'
    },
    {
      id: 3,
      name: 'Dr. Kapten Rizki Pratama, Sp.A',
      specialty: 'Anestesi',
      status: 'Standby',
      phone: '0822-5555-7777',
      location: 'Ruang Operasi',
      shift: '19:00 - 07:00'
    },
    {
      id: 4,
      name: 'Ns. Sertu Mega Sari, S.Kep',
      specialty: 'Perawat IGD',
      status: 'Piket',
      phone: '0823-9999-1111',
      location: 'IGD RSAU',
      shift: '07:00 - 19:00'
    },
    {
      id: 5,
      name: 'Ns. Kopda Bayu Aji, S.Kep',
      specialty: 'Perawat Darurat',
      status: 'Piket',
      phone: '0821-3333-2222',
      location: 'Ambulans Unit 1',
      shift: '07:00 - 19:00'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Piket': return 'bg-green-100 text-green-800';
      case 'Standby': return 'bg-yellow-100 text-yellow-800';
      case 'Off': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-military-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users size={32} className="text-military-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Tim Medis Piket</h2>
        <p className="text-gray-600">Daftar tim medis yang sedang bertugas</p>
      </div>

      {/* Emergency Call Section */}
      <div className="bg-emergency-red-50 border border-emergency-red-200 rounded-xl p-4">
        <h3 className="font-bold text-emergency-red-700 mb-2">🚨 Panggilan Darurat</h3>
        <div className="flex items-center justify-between">
          <p className="text-emergency-red-600 text-sm">Hubungi IGD untuk panggilan darurat</p>
          <a
            href="tel:115"
            className="bg-emergency-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emergency-red-700 transition-colors"
          >
            📞 115
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {medicalTeam.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg">{member.name}</h3>
                <p className="text-military-green-600 font-medium">{member.specialty}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                {member.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <Phone size={14} className="mr-2 text-navy-blue-600" />
                <a 
                  href={`tel:${member.phone}`}
                  className="text-navy-blue-600 hover:underline font-medium"
                >
                  {member.phone}
                </a>
              </div>
              <div className="flex items-center text-gray-700">
                <MapPin size={14} className="mr-2" />
                <span>{member.location}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock size={14} className="mr-2" />
                <span>Shift: {member.shift}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-gray-500 text-sm">
        Data diperbarui setiap 5 menit
      </div>
    </div>
  );
};

export default MedicalTeamPage;
