import { useAuth } from '../context/AuthContext'
import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Activity, FileText, Clock, Calendar, File, Download, Eye } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { supabase } from '../lib/supabaseClient'
import PrescriptionPreviewModal from './PrescriptionPreviewModal'

export default function PatientDetails({ isOpen, setIsOpen, patient }) {
  const { profile: doctorProfile } = useAuth()
  const [timelineData, setTimelineData] = useState([])
  const [loading, setLoading] = useState(true)
  const [medicalProfile, setMedicalProfile] = useState(null)

  // Preview Modal State
  const [viewPrescription, setViewPrescription] = useState(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isAutoDownload, setIsAutoDownload] = useState(false)

  const handleView = (prescription, autoDownload = false) => {
    setViewPrescription(prescription)
    setIsAutoDownload(autoDownload)
    setIsViewOpen(true)
  }

  // Prescription view handling
  useEffect(() => {
    if (isOpen && patient) {
      fetchPatientHistory()
      // Initialize medical profile with default values or fetch from database
      setMedicalProfile({
        bp: '120/80',
        hr: '72',
        temp: '98.6°F',
        weight: 'N/A',
        allergies: [],
        conditions: [],
        bloodType: 'N/A'
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patient])

  const fetchPatientHistory = async () => {
    setLoading(true)
    try {
      // 1. Fetch Appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patient.patient_id) // Assuming patient_id links to profiles.id or similar
        .or(`patient_id.eq.${patient.id}`) // Also check direct ID reference

      // 2. Fetch Prescriptions
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patient.id)

      // 3. Combine and Sort by Date
      const combined = [
        ...(appointments || []).map(a => ({
          type: 'appointment',
          date: a.date, // Assuming 'date' column YYYY-MM-DD
          time: a.time,
          ...a
        })),
        ...(prescriptions || []).map(p => ({
          type: 'prescription',
          date: p.created_at, // Timestamp
          ...p
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date))

      // Group by Date (YYYY-MM-DD)
      const grouped = combined.reduce((acc, item) => {
        const dateKey = item.date.includes('T') ? item.date.split('T')[0] : item.date
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(item)
        return acc
      }, {})

      setTimelineData(grouped)

    } catch (error) {
      console.error('Error fetching patient history:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-slate-50 dark:bg-slate-900 shadow-2xl">
                    {/* Header */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 py-6 sm:px-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                      <div className="flex items-center justify-between">
                        <div>
                          <Dialog.Title className="text-2xl font-bold text-slate-900 dark:text-white">
                            {patient?.name}
                          </Dialog.Title>
                          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 px-2 py-0.5 rounded-md text-xs">ID: {patient?.patient_id}</span>
                            <span>•</span>
                            <span>{patient?.age} years</span>
                            <span>•</span>
                            <span>{patient?.sex}</span>
                          </p>
                        </div>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-full p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
                            onClick={() => setIsOpen(false)}
                          >
                            <span className="sr-only">Close panel</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative flex-1 px-4 py-8 sm:px-8">
                      {/* Medical Overview Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {/* Vitals Card */}
                        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                              <Activity className="h-5 w-5" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white">Recent Vitals</h4>
                          </div>
                          {medicalProfile ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Blood Pressure</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{medicalProfile.bp}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Heart Rate</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{medicalProfile.hr}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Temperature</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{medicalProfile.temp}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Weight</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{medicalProfile.weight}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="animate-pulse space-y-3">
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                            </div>
                          )}
                        </div>

                        {/* Medical Profile Card */}
                        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                              <FileText className="h-5 w-5" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white">Medical Profile</h4>
                          </div>
                          {medicalProfile ? (
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Allergies</p>
                                <div className="flex flex-wrap gap-2">
                                  {medicalProfile.allergies.length > 0 ? medicalProfile.allergies.map(a => (
                                    <span key={a} className="px-2 py-1 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-xs font-medium border border-red-100 dark:border-red-900/30">{a}</span>
                                  )) : <span className="text-sm text-slate-500">None known</span>}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Chronic Conditions</p>
                                <div className="flex flex-wrap gap-2">
                                  {medicalProfile.conditions.length > 0 ? medicalProfile.conditions.map(c => (
                                    <span key={c} className="px-2 py-1 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 text-xs font-medium border border-orange-100 dark:border-orange-900/30">{c}</span>
                                  )) : <span className="text-sm text-slate-500">None</span>}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Blood Type</p>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{medicalProfile.bloodType}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="animate-pulse space-y-3">
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 px-1">Patient History</h3>

                      {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                          <p className="text-slate-400 text-sm animate-pulse">Loading history...</p>
                        </div>
                      ) : Object.keys(timelineData).length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 mx-4">
                          <div className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Clock className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No history found</h3>
                          <p className="text-slate-500 dark:text-slate-400 mt-1">This patient has no recorded appointments or prescriptions.</p>
                        </div>
                      ) : (
                        <div className="space-y-10">
                          {Object.entries(timelineData).map(([date, items]) => (
                            <div key={date} className="relative">
                              <div className="sticky top-[85px] z-10 mb-6 flex justify-center">
                                <span className="px-4 py-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700/80 backdrop-blur text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider shadow-sm border border-white/20">
                                  {format(parseISO(date), 'MMMM d, yyyy')}
                                </span>
                              </div>

                              <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 sm:ml-6 space-y-8 pb-4">
                                {items.map((item, idx) => (
                                  <div key={idx} className="relative pl-8 sm:pl-10">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[9px] top-6 h-[18px] w-[18px] rounded-full border-4 border-slate-50 dark:border-slate-900 shadow-sm ${item.type === 'appointment' ? 'bg-teal-500' : 'bg-emerald-500'
                                      }`}></div>

                                    <div className="group bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-xl ${item.type === 'appointment'
                                            ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400'
                                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                            }`}>
                                            {item.type === 'appointment' ? (
                                              <Calendar className="h-5 w-5" />
                                            ) : (
                                              <FileText className="h-5 w-5" />
                                            )}
                                          </div>
                                          <div>
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                                              {item.type}
                                            </h4>
                                            <span className="text-xs font-medium text-slate-400">
                                              {item.time || format(new Date(item.created_at), 'h:mm a')}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-sm text-slate-600 dark:text-slate-300 pl-[52px]">
                                        {item.type === 'appointment' ? (
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</span>
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.status === 'Confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                  'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                {item.status}
                                              </span>
                                            </div>
                                            {item.notes && (
                                              <p className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 italic">
                                                "{item.notes}"
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="space-y-3">
                                            {/* Structured Medications */}
                                            {item.medications && item.medications.length > 0 && (
                                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Medications</p>
                                                <ul className="space-y-2">
                                                  {item.medications.map((med, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                                      <span className="font-semibold">{med.name}</span>
                                                      <span className="text-slate-400 text-xs">•</span>
                                                      <span className="text-slate-500">{med.dosage}</span>
                                                      <span className="text-slate-400 text-xs">({med.frequency})</span>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}

                                            {/* Text Prescription */}
                                            {item.prescription_text && (
                                              <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
                                                <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                  {item.prescription_text}
                                                </div>
                                              </div>
                                            )}

                                            {/* File Attachments (if any) */}
                                            <div className="flex items-center gap-3 pt-2">
                                              {item.file_url && (
                                                <a
                                                  href={item.file_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-900/30"
                                                >
                                                  <File className="h-4 w-4" />
                                                  View Attachment
                                                </a>
                                              )}

                                              {/* PDF Generator */}
                                              <button
                                                onClick={() => handleView(item, true)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-100 dark:border-emerald-900/30"
                                                title="Download PDF"
                                              >
                                                <Download className="h-4 w-4" />
                                                Download PDF
                                              </button>

                                              <button
                                                onClick={() => handleView(item)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl text-sm font-medium hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors border border-teal-100 dark:border-teal-900/30"
                                              >
                                                <Eye className="h-4 w-4" />
                                                View
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>

      {/* View Modal */}
      {isViewOpen && (
        <PrescriptionPreviewModal
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false)
            setIsAutoDownload(false)
          }}
          prescription={viewPrescription}
          patient={patient}
          autoDownload={isAutoDownload}
        />
      )}
    </Transition.Root>
  )
}
