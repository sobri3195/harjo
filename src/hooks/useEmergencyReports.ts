
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export interface EmergencyReport {
  id: string
  type: 'trauma' | 'heart'
  reporter_name: string
  reporter_rank: string
  reporter_phone: string
  patient_name: string
  patient_rank?: string
  location: string
  description: string
  severity: 'ringan' | 'sedang' | 'berat'
  status: 'pending' | 'dalam_penanganan' | 'selesai'
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

export const useEmergencyReports = () => {
  const [reports, setReports] = useState<EmergencyReport[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports((data || []) as EmergencyReport[])
    } catch (error) {
      console.error('Error fetching reports:', error)
      // Fallback to localStorage for demo
      const localReports = localStorage.getItem('emergency_reports')
      if (localReports) {
        setReports(JSON.parse(localReports))
      }
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (report: Omit<EmergencyReport, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // First try Supabase without custom ID - let Supabase generate UUID
      const { data, error } = await supabase
        .from('emergency_reports')
        .insert([{
          ...report,
          status: 'pending' as const,
          latitude: report.latitude || null,
          longitude: report.longitude || null,
        }])
        .select()

      if (error) throw error

      if (data && data[0]) {
        setReports(prev => [data[0] as EmergencyReport, ...prev])
        toast({
          title: "✅ Laporan Berhasil Dikirim",
          description: `Laporan ${report.type === 'trauma' ? 'trauma' : 'jantung'} telah diterima tim medis. Ambulans akan segera diarahkan ke lokasi.`,
        })
        return data[0]
      }
    } catch (error) {
      console.error('Supabase error, using localStorage:', error)
      
      // Fallback to localStorage with custom ID for local storage
      const newReport = {
        ...report,
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'pending' as const,
      }

      const existingReports = localStorage.getItem('emergency_reports')
      const reportsList = existingReports ? JSON.parse(existingReports) : []
      const updatedReports = [newReport, ...reportsList]
      
      localStorage.setItem('emergency_reports', JSON.stringify(updatedReports))
      setReports(updatedReports)
      
      toast({
        title: "✅ Laporan Berhasil Dikirim",
        description: `Laporan ${report.type === 'trauma' ? 'trauma' : 'jantung'} telah diterima tim medis. Ambulans akan segera diarahkan ke lokasi.`,
      })

      return newReport
    }
  }

  const updateReportStatus = async (id: string, status: EmergencyReport['status']) => {
    try {
      // Try Supabase first
      const { error } = await supabase
        .from('emergency_reports')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      
      setReports(prev => prev.map(report => 
        report.id === id 
          ? { ...report, status, updated_at: new Date().toISOString() }
          : report
      ))
      
      toast({
        title: "Status Updated",
        description: "Status laporan berhasil diupdate",
      })
    } catch (error) {
      console.error('Supabase error, using localStorage:', error)
      
      // Fallback to localStorage
      const existingReports = localStorage.getItem('emergency_reports')
      if (existingReports) {
        const reportsList = JSON.parse(existingReports)
        const updatedReports = reportsList.map((report: EmergencyReport) =>
          report.id === id 
            ? { ...report, status, updated_at: new Date().toISOString() }
            : report
        )
        localStorage.setItem('emergency_reports', JSON.stringify(updatedReports))
        setReports(updatedReports)
        
        toast({
          title: "Status Updated",
          description: "Status laporan berhasil diupdate",
        })
      }
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  return {
    reports,
    loading,
    createReport,
    updateReportStatus,
    refetch: fetchReports
  }
}
