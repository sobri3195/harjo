import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, TrendingUp, Download, FileText, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DatePickerWithRange } from '@/components/ui/calendar';
import { useAnalytics } from '@/hooks/useAnalytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AnalyticsDashboard = () => {
  const {
    responseAnalytics,
    performanceMetrics,
    loading,
    getResponseTimeStats,
    getPerformanceTrends,
    exportAnalytics,
    generateCustomReport
  } = useAnalytics();

  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedMetric, setSelectedMetric] = useState('daily');

  const responseTimeStats = getResponseTimeStats();
  const trends = getPerformanceTrends();

  // Prepare chart data
  const responseTimeData = performanceMetrics.map(metric => ({
    date: new Date(metric.metric_date).toLocaleDateString('id-ID'),
    responseTime: metric.average_response_time_minutes,
    dispatchTime: metric.average_dispatch_time_minutes,
    arrivalTime: metric.average_arrival_time_minutes
  }));

  const callVolumeData = performanceMetrics.map(metric => ({
    date: new Date(metric.metric_date).toLocaleDateString('id-ID'),
    total: metric.total_calls,
    critical: metric.critical_calls,
    success: metric.successful_transports
  }));

  const utilizationData = performanceMetrics.map(metric => ({
    date: new Date(metric.metric_date).toLocaleDateString('id-ID'),
    ambulance: metric.ambulance_utilization_percentage,
    hospital: metric.hospital_capacity_utilization
  }));

  // Outcome distribution for pie chart
  const outcomeDistribution = responseAnalytics.reduce((acc, report) => {
    const outcome = report.outcome || 'unknown';
    acc[outcome] = (acc[outcome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(outcomeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value
  }));

  const handleExport = async () => {
    await exportAnalytics({ dateRange }, 'csv');
  };

  const handleGenerateReport = async () => {
    await generateCustomReport(
      `Analytics Report ${new Date().toLocaleDateString('id-ID')}`,
      'performance',
      { dateRange }
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Analytics Dashboard</h2>
          <p className="text-gray-600">Performance metrics and response analytics</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Export Data
          </Button>
          <Button onClick={handleGenerateReport} className="flex items-center gap-2">
            <FileText size={16} />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Metric Type</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-blue-600">
                  {responseTimeStats?.avg.toFixed(1) || '0.0'}m
                </p>
              </div>
              <Clock className="text-blue-600" size={24} />
            </div>
            {trends && (
              <div className="mt-2">
                <Badge className={`text-xs ${
                  trends.responseTime.change < 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {trends.responseTime.change > 0 ? '+' : ''}{trends.responseTime.change.toFixed(1)}m
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-green-600">
                  {performanceMetrics[0]?.total_calls || 0}
                </p>
              </div>
              <TrendingUp className="text-green-600" size={24} />
            </div>
            {trends && (
              <div className="mt-2">
                <Badge className={`text-xs ${
                  trends.totalCalls.change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {trends.totalCalls.change > 0 ? '+' : ''}{trends.totalCalls.change}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Cases</p>
                <p className="text-2xl font-bold text-red-600">
                  {performanceMetrics[0]?.critical_calls || 0}
                </p>
              </div>
              <Calendar className="text-red-600" size={24} />
            </div>
            <div className="mt-2">
              <Badge className="text-xs bg-red-100 text-red-800">
                {performanceMetrics[0] ? 
                  ((performanceMetrics[0].critical_calls / performanceMetrics[0].total_calls) * 100).toFixed(1)
                  : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilization</p>
                <p className="text-2xl font-bold text-purple-600">
                  {performanceMetrics[0]?.ambulance_utilization_percentage.toFixed(1) || '0.0'}%
                </p>
              </div>
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            {trends && (
              <div className="mt-2">
                <Badge className={`text-xs ${
                  trends.utilization.change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {trends.utilization.change > 0 ? '+' : ''}{trends.utilization.change.toFixed(1)}%
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Time Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Response Time Trends</CardTitle>
          <CardDescription>Average response, dispatch, and arrival times over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="responseTime" stroke="#8884d8" name="Response Time" />
              <Line type="monotone" dataKey="dispatchTime" stroke="#82ca9d" name="Dispatch Time" />
              <Line type="monotone" dataKey="arrivalTime" stroke="#ffc658" name="Arrival Time" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Call Volume Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Call Volume Analysis</CardTitle>
            <CardDescription>Daily call volume and success rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={callVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#8884d8" name="Total Calls" />
                <Bar dataKey="critical" fill="#ff8042" name="Critical" />
                <Bar dataKey="success" fill="#00C49F" name="Successful" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Outcomes</CardTitle>
            <CardDescription>Distribution of emergency case outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Utilization</CardTitle>
          <CardDescription>Ambulance and hospital capacity utilization over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="ambulance" stroke="#8884d8" name="Ambulance Utilization" />
              <Line type="monotone" dataKey="hospital" stroke="#82ca9d" name="Hospital Capacity" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Response Time Statistics */}
      {responseTimeStats && (
        <Card>
          <CardHeader>
            <CardTitle>Response Time Statistics</CardTitle>
            <CardDescription>Detailed response time analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{responseTimeStats.avg.toFixed(1)}m</p>
                <p className="text-sm text-gray-600">Average</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{responseTimeStats.min}m</p>
                <p className="text-sm text-gray-600">Fastest</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{responseTimeStats.max}m</p>
                <p className="text-sm text-gray-600">Slowest</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{responseTimeStats.median.toFixed(1)}m</p>
                <p className="text-sm text-gray-600">Median</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{responseTimeStats.total}</p>
                <p className="text-sm text-gray-600">Total Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};