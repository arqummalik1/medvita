import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { FileText, Download, User } from 'lucide-react'
import { format } from 'date-fns'

export default function PrescriptionsViewer() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      // Find patient record linked to this user's email
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('email', user.email)
        .single() // Assuming one patient record per email for now

      if (patientError && patientError.code !== 'PGRST116') { // PGRST116 is no rows found
         console.error('Error finding patient record:', patientError)
      }

      if (!patientData) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctor:profiles!doctor_id(full_name)
        `)
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrescriptions(data)
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          My Prescriptions
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          View and download your digital prescriptions from doctors.
        </p>
      </div>

      {error ? (
         <div className="text-center py-12 glass-panel rounded-2xl border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
           <p className="text-red-600 dark:text-red-400 font-bold">Error loading prescriptions: {error}</p>
         </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center mb-6">
            <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No prescriptions yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            When a doctor prescribes you medication, it will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className="glass-panel rounded-2xl flex flex-col hover:shadow-xl transition-all duration-300 group">
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                       <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                         <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                       </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Dr. {prescription.doctor?.full_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {format(new Date(prescription.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-green">
                    RX
                  </span>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 min-h-[100px] border border-slate-100 dark:border-slate-700/50">
                   <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap line-clamp-4 leading-relaxed font-mono">
                     {prescription.prescription_text}
                   </p>
                </div>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl p-1">
                {prescription.file_url ? (
                  <a
                    href={prescription.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Attachment
                  </a>
                ) : (
                  <div className="w-full flex items-center justify-center py-3 text-sm text-slate-400 dark:text-slate-500 font-medium cursor-not-allowed">
                    No Attachment
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
