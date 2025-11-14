import React, { useState, useRef } from 'react';
import { Save, Bell, Shield, Database, Mail, Download, Upload, RotateCcw, Settings2, FileText, Clock, Users, AlertTriangle, Wifi, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface BackupEntry {
  id: string;
  date: string;
  time: string;
  type: 'auto' | 'manual';
  size: string;
  status: 'completed' | 'in-progress' | 'failed';
}

const EnhancedAdminSettings = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load settings from localStorage on component mount
  const loadSettings = () => {
    const savedSettings = localStorage.getItem('admin_settings');
    if (savedSettings) {
      try {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
        return defaultSettings;
      }
    }
    return defaultSettings;
  };

  const defaultSettings = {
    // General Settings
    hospitalName: 'RSPAU dr. Suhardi Harjolukito',
    adminEmail: 'admin@rsau-efram.mil.id',
    emergencyPhone: '115',
    backupPhone: '021-5555-0115',
    responseTimeLimit: 5,
    maxActiveReports: 10,
    timezone: 'Asia/Jakarta',
    language: 'id-ID',
    
    // Notification Settings
    autoNotification: true,
    emailNotification: true,
    smsNotification: false,
    pushNotification: true,
    emergencyBroadcast: true,
    criticalAlertThreshold: 3,
    notificationSound: true,
    quietHours: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
    
    // Security Settings
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    requireTwoFactor: false,
    allowRemoteAccess: true,
    ipWhitelist: '',
    dataRetentionDays: 365,
    
    // System Settings
    autoBackup: true,
    backupFrequency: 'daily',
    maxConcurrentUsers: 50,
    logLevel: 'info',
    cacheExpiry: 24,
    maintenanceMode: false
  };

  const [settings, setSettings] = useState(loadSettings());

  const [backups, setBackups] = useState<BackupEntry[]>([
    {
      id: '1',
      date: 'Today',
      time: '03:00 AM',
      type: 'auto',
      size: '125 MB',
      status: 'completed'
    },
    {
      id: '2',
      date: 'Yesterday',
      time: '03:00 AM',
      type: 'auto',
      size: '123 MB',
      status: 'completed'
    },
    {
      id: '3',
      date: '2 days ago',
      time: '03:00 AM',
      type: 'auto',
      size: '121 MB',
      status: 'completed'
    },
    {
      id: '4',
      date: '3 days ago',
      time: '14:30 PM',
      type: 'manual',
      size: '120 MB',
      status: 'completed'
    }
  ]);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveAll = () => {
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    toast({
      title: "✅ Settings Saved",
      description: "All settings have been saved successfully and are now active",
    });
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `admin_settings_${new Date().getTime()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "📥 Settings Exported",
      description: "Settings have been exported to JSON file",
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings({ ...settings, ...importedSettings });
          toast({
            title: "📤 Settings Imported",
            description: "Settings have been imported successfully",
          });
        } catch (error) {
          toast({
            title: "❌ Import Failed",
            description: "Invalid settings file format",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('admin_settings', JSON.stringify(defaultSettings));
    toast({
      title: "🔄 Settings Reset",
      description: "All settings have been reset to default values and saved",
    });
  };

  const handleCreateBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    // Simulate backup process
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          
          // Add new backup to list
          const newBackup: BackupEntry = {
            id: Date.now().toString(),
            date: 'Today',
            time: new Date().toLocaleTimeString('id-ID', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            }),
            type: 'manual',
            size: '126 MB',
            status: 'completed'
          };
          
          setBackups(prev => [newBackup, ...prev.slice(0, 9)]);
          
          toast({
            title: "💾 Backup Created",
            description: "Database backup has been created successfully",
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDownloadBackup = (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    toast({
      title: "⬇️ Backup Downloaded",
      description: `Backup from ${backup?.date} ${backup?.time} is being downloaded`,
    });
  };

  const handleRestoreBackup = (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (backup) {
      toast({
        title: "⚠️ Restore Confirmation",
        description: `Are you sure you want to restore backup from ${backup.date}? This will overwrite current data.`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings2 className="mr-2" size={20} />
              Enhanced System Settings
            </div>
            <div className="flex space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline" 
                size="sm"
              >
                <Upload className="mr-2" size={16} />
                Import
              </Button>
              <Button onClick={handleExportSettings} variant="outline" size="sm">
                <Download className="mr-2" size={16} />
                Export
              </Button>
              <Button onClick={handleResetSettings} variant="outline" size="sm">
                <RotateCcw className="mr-2" size={16} />
                Reset
              </Button>
              <Button onClick={handleSaveAll} size="sm">
                <Save className="mr-2" size={16} />
                Save All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings2 className="mr-2" size={20} />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hospitalName">Hospital Name</Label>
                    <Input
                      id="hospitalName"
                      value={settings.hospitalName}
                      onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="adminEmail">Administrator Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={settings.adminEmail}
                      onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={settings.emergencyPhone}
                      onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="backupPhone">Backup Phone</Label>
                    <Input
                      id="backupPhone"
                      value={settings.backupPhone}
                      onChange={(e) => handleInputChange('backupPhone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="responseTimeLimit">Response Time Limit (minutes)</Label>
                    <Input
                      id="responseTimeLimit"
                      type="number"
                      value={settings.responseTimeLimit}
                      onChange={(e) => handleInputChange('responseTimeLimit', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxActiveReports">Max Active Reports</Label>
                    <Input
                      id="maxActiveReports"
                      type="number"
                      value={settings.maxActiveReports}
                      onChange={(e) => handleInputChange('maxActiveReports', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                        <SelectItem value="Asia/Makassar">Asia/Makassar (WITA)</SelectItem>
                        <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={settings.language} onValueChange={(value) => handleInputChange('language', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id-ID">Bahasa Indonesia</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2" size={20} />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoNotification">Auto Notifications</Label>
                      <p className="text-sm text-muted-foreground">Automatically send notifications for new reports</p>
                    </div>
                    <Switch
                      id="autoNotification"
                      checked={settings.autoNotification}
                      onCheckedChange={(checked) => handleInputChange('autoNotification', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotification">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotification"
                      checked={settings.emailNotification}
                      onCheckedChange={(checked) => handleInputChange('emailNotification', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsNotification">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                    </div>
                    <Switch
                      id="smsNotification"
                      checked={settings.smsNotification}
                      onCheckedChange={(checked) => handleInputChange('smsNotification', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotification">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send push notifications to mobile apps</p>
                    </div>
                    <Switch
                      id="pushNotification"
                      checked={settings.pushNotification}
                      onCheckedChange={(checked) => handleInputChange('pushNotification', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emergencyBroadcast">Emergency Broadcast</Label>
                      <p className="text-sm text-muted-foreground">Broadcast critical alerts to all users</p>
                    </div>
                    <Switch
                      id="emergencyBroadcast"
                      checked={settings.emergencyBroadcast}
                      onCheckedChange={(checked) => handleInputChange('emergencyBroadcast', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="criticalAlertThreshold">Critical Alert Threshold</Label>
                    <Input
                      id="criticalAlertThreshold"
                      type="number"
                      value={settings.criticalAlertThreshold}
                      onChange={(e) => handleInputChange('criticalAlertThreshold', parseInt(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Number of concurrent critical alerts before system alert</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notificationSound">Notification Sound</Label>
                      <p className="text-sm text-muted-foreground">Play sound for notifications</p>
                    </div>
                    <Switch
                      id="notificationSound"
                      checked={settings.notificationSound}
                      onCheckedChange={(checked) => handleInputChange('notificationSound', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="quietHours">Quiet Hours Mode</Label>
                      <p className="text-sm text-muted-foreground">Reduce notifications during specified hours</p>
                    </div>
                    <Switch
                      id="quietHours"
                      checked={settings.quietHours}
                      onCheckedChange={(checked) => handleInputChange('quietHours', checked)}
                    />
                  </div>

                  {settings.quietHours && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <Label htmlFor="quietHoursStart">Start Time</Label>
                        <Input
                          id="quietHoursStart"
                          type="time"
                          value={settings.quietHoursStart}
                          onChange={(e) => handleInputChange('quietHoursStart', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quietHoursEnd">End Time</Label>
                        <Input
                          id="quietHoursEnd"
                          type="time"
                          value={settings.quietHoursEnd}
                          onChange={(e) => handleInputChange('quietHoursEnd', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2" size={20} />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                    <Input
                      id="passwordExpiry"
                      type="number"
                      value={settings.passwordExpiry}
                      onChange={(e) => handleInputChange('passwordExpiry', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataRetentionDays">Data Retention (days)</Label>
                    <Input
                      id="dataRetentionDays"
                      type="number"
                      value={settings.dataRetentionDays}
                      onChange={(e) => handleInputChange('dataRetentionDays', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireTwoFactor">Require Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                    </div>
                    <Switch
                      id="requireTwoFactor"
                      checked={settings.requireTwoFactor}
                      onCheckedChange={(checked) => handleInputChange('requireTwoFactor', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowRemoteAccess">Allow Remote Access</Label>
                      <p className="text-sm text-muted-foreground">Allow access from external networks</p>
                    </div>
                    <Switch
                      id="allowRemoteAccess"
                      checked={settings.allowRemoteAccess}
                      onCheckedChange={(checked) => handleInputChange('allowRemoteAccess', checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                    <Textarea
                      id="ipWhitelist"
                      placeholder="Enter IP addresses separated by commas&#10;Leave empty to allow all IPs"
                      value={settings.ipWhitelist}
                      onChange={(e) => handleInputChange('ipWhitelist', e.target.value)}
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2" size={20} />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maxConcurrentUsers">Max Concurrent Users</Label>
                    <Input
                      id="maxConcurrentUsers"
                      type="number"
                      value={settings.maxConcurrentUsers}
                      onChange={(e) => handleInputChange('maxConcurrentUsers', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cacheExpiry">Cache Expiry (hours)</Label>
                    <Input
                      id="cacheExpiry"
                      type="number"
                      value={settings.cacheExpiry}
                      onChange={(e) => handleInputChange('cacheExpiry', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="logLevel">Log Level</Label>
                    <Select value={settings.logLevel} onValueChange={(value) => handleInputChange('logLevel', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="backupFrequency">Auto Backup Frequency</Label>
                    <Select value={settings.backupFrequency} onValueChange={(value) => handleInputChange('backupFrequency', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoBackup">Auto Backup</Label>
                      <p className="text-sm text-muted-foreground">Automatically backup system data</p>
                    </div>
                    <Switch
                      id="autoBackup"
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => handleInputChange('autoBackup', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable maintenance mode (blocks user access)</p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                    />
                  </div>

                  {settings.maintenanceMode && (
                    <div className="ml-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="text-yellow-600 mr-2" size={16} />
                        <p className="text-sm text-yellow-800 font-medium">
                          Maintenance mode is active. Users cannot access the system.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* System Status Display */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">System Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">CPU Usage</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={35} className="w-16 h-2" />
                          <span className="text-sm">35%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Memory Usage</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={67} className="w-16 h-2" />
                          <span className="text-sm">67%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Storage Usage</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={42} className="w-16 h-2" />
                          <span className="text-sm">42%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore */}
        <TabsContent value="backup">
          <div className="grid gap-6">
            {/* Database Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDrive className="mr-2" size={20} />
                  Database Backup
                </CardTitle>
                <p className="text-sm text-muted-foreground">Create and manage database backups</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Button 
                      onClick={handleCreateBackup} 
                      disabled={isBackingUp}
                      className="w-full"
                    >
                      {isBackingUp ? (
                        <>
                          <Clock className="mr-2 animate-spin" size={16} />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2" size={16} />
                          Create Backup Now
                        </>
                      )}
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last backup:</p>
                    <p className="font-medium">Today, 03:00 AM</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next scheduled:</p>
                    <p className="font-medium">Tomorrow, 03:00 AM</p>
                  </div>
                </div>

                {isBackingUp && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Creating backup...</span>
                      <span>{backupProgress}%</span>
                    </div>
                    <Progress value={backupProgress} className="w-full" />
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Backup size: ~125 MB</span>
                  <Badge variant="secondary">Auto Backup Enabled</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Database Restore */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2" size={20} />
                  Database Restore
                </CardTitle>
                <p className="text-sm text-muted-foreground">Restore from previous backup</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <input
                    type="file"
                    accept=".sql,.backup"
                    className="hidden"
                    id="backup-file"
                  />
                  <Button variant="outline" onClick={() => document.getElementById('backup-file')?.click()}>
                    <Upload className="mr-2" size={16} />
                    Select Backup File
                  </Button>
                  <Button variant="destructive" disabled>
                    <Database className="mr-2" size={16} />
                    Restore Database
                  </Button>
                </div>
                <div className="flex items-center space-x-2 text-sm text-yellow-800 bg-yellow-50 p-3 rounded-lg">
                  <AlertTriangle size={16} />
                  <span>⚠️ This will overwrite current data</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Backups */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Backups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Database size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{backup.date}, {backup.time}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant={backup.type === 'auto' ? 'secondary' : 'outline'}>
                              {backup.type === 'auto' ? 'Auto backup' : 'Manual backup'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">• {backup.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadBackup(backup.id)}
                        >
                          <Download size={14} className="mr-1" />
                          Download
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRestoreBackup(backup.id)}
                        >
                          <RotateCcw size={14} className="mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAdminSettings;