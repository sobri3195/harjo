import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, MapPin, AlertTriangle, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';

interface AnalyticsData {
  responseTimeData: any[];
  emergencyTypeData: any[];
  hotspotData: any[];
  dailyTrendData: any[];
  performanceMetrics: {
    averageResponseTime: number;
    totalReports: number;
    activeReports: number;
    resolvedReports: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    responseTimeData: [],
    emergencyTypeData: [],
    hotspotData: [],
    dailyTrendData: [],
    performanceMetrics: {
      averageResponseTime: 0,
      totalReports: 0,
      activeReports: 0,
      resolvedReports: 0
    }
  });
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7days');
  const [loading, setLoading] = useState(true);
  const { reports } = useEmergencyReports();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    generateAnalytics();
  }, [reports, selectedPeriod]);

  const generateAnalytics = () => {
    setLoading(true);
    
    try {
      // Calculate date range
      const now = new Date();
      const daysBack = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Filter reports by date range
      const reportsInPeriod = reports.filter(report => 
        new Date(report.created_at) >= startDate
      );

      // Emergency Type Distribution
      const typeDistribution = reportsInPeriod.reduce((acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const emergencyTypeData = Object.entries(typeDistribution).map(([type, count]) => ({
        name: type === 'trauma' ? 'Trauma' : 'Jantung',
        value: count,
        percentage: ((count / reportsInPeriod.length) * 100).toFixed(1)
      }));

      // Response Time Analysis (simulated data based on severity)
      const responseTimeData = [
        { severity: 'Ringan', avgTime: 12, count: reportsInPeriod.filter(r => r.severity === 'ringan').length },
        { severity: 'Sedang', avgTime: 8, count: reportsInPeriod.filter(r => r.severity === 'sedang').length },
        { severity: 'Berat', avgTime: 5, count: reportsInPeriod.filter(r => r.severity === 'berat').length }
      ];

      // Hotspot Analysis - group by location
      const locationCounts = reportsInPeriod.reduce((acc, report) => {
        const location = report.location.split(',')[0]; // Take first part of location
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const hotspotData = Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({
          area: location.trim(),
          incidents: count
        }));

      // Daily Trend (last 7 days)
      const dailyTrendData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dayReports = reportsInPeriod.filter(report => {
          const reportDate = new Date(report.created_at);
          return reportDate.toDateString() === date.toDateString();
        });
        
        dailyTrendData.push({
          date: date.toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' }),
          trauma: dayReports.filter(r => r.type === 'trauma').length,
          jantung: dayReports.filter(r => r.type === 'heart').length,
          total: dayReports.length
        });
      }

      // Performance Metrics
      const performanceMetrics = {
        averageResponseTime: responseTimeData.reduce((acc, item) => acc + item.avgTime, 0) / responseTimeData.length || 0,
        totalReports: reports.length,
        activeReports: reports.filter(r => r.status === 'pending').length,
        resolvedReports: reports.filter(r => r.status === 'selesai').length
      };

      setAnalyticsData({
        responseTimeData,
        emergencyTypeData,
        hotspotData,
        dailyTrendData,
        performanceMetrics
      });

    } catch (error) {
      console.error('Error generating analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Memuat data analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Analytics Dashboard</span>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Hari Terakhir</SelectItem>
                <SelectItem value="30days">30 Hari Terakhir</SelectItem>
                <SelectItem value="90days">90 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Laporan</p>
                <p className="text-2xl font-bold">{analyticsData.performanceMetrics.totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Laporan Aktif</p>
                <p className="text-2xl font-bold">{analyticsData.performanceMetrics.activeReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terselesaikan</p>
                <p className="text-2xl font-bold">{analyticsData.performanceMetrics.resolvedReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Respons (min)</p>
                <p className="text-2xl font-bold">{analyticsData.performanceMetrics.averageResponseTime.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribusi Jenis Darurat</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.emergencyTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.emergencyTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time by Severity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waktu Respons berdasarkan Tingkat Keparahan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis label={{ value: 'Menit', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} menit`, 'Rata-rata Respons']} />
                <Legend />
                <Bar dataKey="avgTime" fill="#8884d8" name="Rata-rata Waktu (menit)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tren Harian (7 Hari Terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="trauma" stroke="#ff7300" strokeWidth={2} name="Trauma" />
                <Line type="monotone" dataKey="jantung" stroke="#8884d8" strokeWidth={2} name="Jantung" />
                <Line type="monotone" dataKey="total" stroke="#82ca9d" strokeWidth={2} name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hotspot Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Area Hotspot</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.hotspotData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="area" type="category" width={80} />
                <Tooltip formatter={(value) => [`${value} insiden`, 'Jumlah']} />
                <Bar dataKey="incidents" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insights & Rekomendasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📈 Tren Positif</h4>
              <p className="text-sm text-blue-700">
                Waktu respons rata-rata untuk kasus berat mencapai {analyticsData.responseTimeData.find(d => d.severity === 'Berat')?.avgTime || 0} menit, 
                di bawah target 10 menit.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">⚠️ Perhatian</h4>
              <p className="text-sm text-orange-700">
                {analyticsData.hotspotData[0]?.area || 'Area tertentu'} memiliki insiden tertinggi. 
                Pertimbangkan penambahan unit standby di area ini.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">✅ Performance</h4>
              <p className="text-sm text-green-700">
                Tingkat penyelesaian kasus mencapai {((analyticsData.performanceMetrics.resolvedReports / analyticsData.performanceMetrics.totalReports) * 100).toFixed(1)}%.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">💡 Rekomendasi</h4>
              <p className="text-sm text-purple-700">
                Fokus pelatihan tim untuk kasus {analyticsData.emergencyTypeData[0]?.name?.toLowerCase() || 'trauma'} 
                yang merupakan mayoritas laporan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;