import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { FileText, Download, User, Printer, Edit2, Trash2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import PrescriptionCreator from '../components/PrescriptionCreator'
import PrescriptionPreviewModal from '../components/PrescriptionPreviewModal'

export default function PrescriptionsViewer() {
  console.log('PrescriptionsViewer loaded v4 - handleView fix')
  const { user, profile } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingPrescription, setEditingPrescription] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [viewPrescription, setViewPrescription] = useState(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isAutoDownload, setIsAutoDownload] = useState(false)

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return
    try {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPrescriptions()
    } catch (error) {
      alert('Error deleting prescription: ' + error.message)
    }
  }

  const handleEdit = (prescription) => {
    setEditingPrescription(prescription)
    setIsEditOpen(true)
  }

  // Ref for printing (reserved for future use)
  // const printRef = useRef(null)

  useEffect(() => {
    if (profile) {
      fetchPrescriptions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email, profile])

  const handleView = (prescription, autoDownload = false) => {
    setViewPrescription(prescription)
    setIsAutoDownload(autoDownload)
    setIsViewOpen(true)
  }

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)

      let data, error

      if (profile.role === 'doctor') {
        // Fetch prescriptions written by this doctor
        const result = await supabase
          .from('prescriptions')
          .select('*')
          .eq('doctor_id', user.id)
          .order('created_at', { ascending: false })

        data = result.data
        error = result.error

        if (data && data.length > 0) {
          const patientIds = [...new Set(data.map(p => p.patient_id))]
          const { data: patientsData } = await supabase
            .from('patients')
            .select('id, name')
            .in('id', patientIds)

          if (patientsData) {
            const patientsMap = patientsData.reduce((acc, patient) => {
              acc[patient.id] = patient
              return acc
            }, {})

            data = data.map(prescription => ({
              ...prescription,
              patient: patientsMap[prescription.patient_id]
            }))
          }
        }
      } else {
        // Find patient record linked to this user's email
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('email', user.email)
          .single()

        if (patientError && patientError.code !== 'PGRST116') {
          console.error('Error finding patient record:', patientError)
        }

        if (!patientData) {
          setLoading(false)
          return
        }

        const result = await supabase
          .from('prescriptions')
          .select(`
            *,
            doctor:profiles!doctor_id(full_name)
          `)
          .eq('patient_id', patientData.id)
          .order('created_at', { ascending: false })

        data = result.data
        error = result.error
      }

      if (error) throw error
      setPrescriptions(data || [])
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading prescriptions...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {profile?.role === 'doctor' ? 'Prescriptions Management' : 'My Prescriptions'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          {profile?.role === 'doctor'
            ? 'View and manage prescriptions you have issued to patients.'
            : 'View and download your digital prescriptions from doctors.'}
        </p>
      </div>

      {error ? (
        <div className="text-center py-12 glass-panel bg-red-50/50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-bold">Error loading prescriptions: {error}</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-[24px] border-dashed border-2 border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center mb-6 shadow-xl shadow-cyan-500/30">
            <FileText className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No prescriptions yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            When a doctor prescribes you medication, it will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className="glass-panel rounded-[24px] flex flex-col hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 group">
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {profile?.role === 'doctor'
                          ? `To: ${prescription.patient?.name || 'Unknown Patient'}`
                          : `Dr. ${prescription.doctor?.full_name}`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {format(new Date(prescription.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    RX
                  </span>
                </div>

                <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 min-h-[100px] border border-slate-200/50 dark:border-slate-700/50">
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap line-clamp-4 leading-relaxed font-mono">
                    {prescription.prescription_text}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-b-[24px] p-2 flex gap-2">
                <button
                  onClick={() => handleView(prescription, true)}
                  className="p-3 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all duration-300 hover:scale-110"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleView(prescription)}
                  className="flex-1 flex items-center justify-center py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-300 gap-2 hover:scale-105"
                  title="View Prescription"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>

                {profile?.role === 'doctor' && (
                  <>
                    <button
                      onClick={() => handleEdit(prescription)}
                      className="p-3 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-all duration-300 hover:scale-110"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prescription.id)}
                      className="p-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all duration-300 hover:scale-110"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingPrescription && (
        <PrescriptionCreator
          isOpen={isEditOpen}
          setIsOpen={setIsEditOpen}
          patient={editingPrescription.patient}
          initialData={editingPrescription}
          onSuccess={fetchPrescriptions}
        />
      )}

      {/* View Modal */}
      {isViewOpen && (
        <PrescriptionPreviewModal
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false)
            setIsAutoDownload(false)
          }}
          prescription={viewPrescription}
          patient={viewPrescription?.patient}
          autoDownload={isAutoDownload}
        />
      )}
    </div>
  )
}
