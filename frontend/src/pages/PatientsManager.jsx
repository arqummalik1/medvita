import { useState, useEffect, Fragment } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, FilePlus, X, Eye, MoreVertical, Users, Activity, Heart, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, Menu, Transition } from '@headlessui/react'
import PrescriptionCreator from '../components/PrescriptionCreator'
import PatientDetails from '../components/PatientDetails'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

import { startOfDay, subWeeks, subMonths, endOfDay } from 'date-fns'

export default function PatientsManager() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [patients, setPatients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('today') // Default to 'today'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)

  // ... (existing states)

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState(null)

  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState(null)

  // Pagination
  const PAGE_SIZE = 25
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    sex: 'Male',
    email: '',
    phone: '',
    blood_pressure: '',
    heart_rate: ''
  })

  useEffect(() => {
    fetchPatients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]) // Re-fetch when filter or page changes

  useEffect(() => {
    const action = searchParams.get('action')
    const search = searchParams.get('search')
    if (action === 'create') openAddModal()
    if (search) setSearchQuery(search)
  }, [searchParams])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      // Apply Date Filter
      const now = new Date()
      if (filter === 'today') {
        query = query.gte('created_at', startOfDay(now).toISOString())
      } else if (filter === 'week') {
        query = query.gte('created_at', subWeeks(now, 1).toISOString())
      } else if (filter === 'month') {
        query = query.gte('created_at', subMonths(now, 1).toISOString())
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,patient_id.ilike.%${searchQuery}%`)
      }

      const { data: patientsData, error, count } = await query
      if (error) throw error

      setTotalCount(count || 0)

      // Fetch prescription status for these patients (Only show if prescribed TODAY)
      if (patientsData && patientsData.length > 0) {
        const patientIds = patientsData.map(p => p.id)
        const todayStart = startOfDay(new Date()).toISOString()

        const { data: rxData } = await supabase
          .from('prescriptions')
          .select('patient_id')
          .in('patient_id', patientIds)
          .gte('created_at', todayStart)

        const patientsWithRx = new Set(rxData?.map(rx => rx.patient_id) || [])

        const enhancedPatients = patientsData.map(p => ({
          ...p,
          hasPrescription: patientsWithRx.has(p.id)
        }))
        setPatients(enhancedPatients)
      } else {
        setPatients([])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Real-time search debounce — reset to page 0 on search change
  useEffect(() => {
    setPage(0)
    const delayDebounceFn = setTimeout(() => {
      fetchPatients()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const patientData = {
        name: formData.name,
        age: parseInt(formData.age),
        sex: formData.sex,
        email: formData.email || null,
        phone: formData.phone || null,
        blood_pressure: formData.blood_pressure || null,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        doctor_id: user.id
      }

      let error
      if (editingPatient) {
        const { error: updateError } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', editingPatient.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('patients')
          .insert([patientData])
        error = insertError
      }

      if (error) throw error

      setIsModalOpen(false)
      setEditingPatient(null)
      setFormData({ name: '', age: '', sex: 'Male', email: '', phone: '', blood_pressure: '', heart_rate: '' })
      fetchPatients()
    } catch (error) {
      alert('Error saving patient: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this patient?')) return
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPatients()
    } catch (error) {
      alert('Error deleting patient: ' + error.message)
    }
  }

  const openEditModal = (patient) => {
    setEditingPatient(patient)
    setFormData({
      name: patient.name,
      age: patient.age,
      sex: patient.sex,
      email: patient.email || '',
      phone: patient.phone || '',
      blood_pressure: patient.blood_pressure || '',
      heart_rate: patient.heart_rate || ''
    })
    setIsModalOpen(true)
  }

  const openAddModal = () => {
    setEditingPatient(null)
    setFormData({ name: '', age: '', sex: 'Male', email: '', phone: '', blood_pressure: '', heart_rate: '' })
    setIsModalOpen(true)
  }

  const openPrescriptionModal = (patient) => {
    setSelectedPatientForPrescription(patient)
    setIsPrescriptionModalOpen(true)
  }

  const openPatientDetails = (patient) => {
    setSelectedPatientForDetails(patient)
    setIsDetailsOpen(true)
  }

  return (
    <div>
      <div className="sm:flex sm:items-center justify-between mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Patients</h1>
          <p className="text-slate-500 dark:text-slate-400">
            A list of all your patients including their name, ID, age, and gender.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button
            onClick={openAddModal}
            variant="primary"
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 shadow-teal-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex shadow-sm">
          {['today', 'week', 'month', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 text-sm font-bold rounded-lg transition-all capitalize
                ${filter === f
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }
              `}
            >
              {f === 'today' ? 'Today' : f === 'week' ? 'Last Week' : f === 'month' ? 'Last Month' : 'All Time'}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="input-field block w-full pl-14 pr-4 py-3 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:focus:ring-cyan-400/50 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all shadow-sm"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-50 dark:bg-slate-800 h-16 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 glass-panel bg-red-50/50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 font-medium">Error: {error}</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-[24px] border-dashed border-2 border-slate-200 dark:border-slate-700">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-xl shadow-cyan-500/30">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No patients found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
              {searchQuery ? "Try adjusting your search terms." : "Get started by adding a new patient to your practice."}
            </p>
            {!searchQuery && (
              <Button
                onClick={openAddModal}
                className="mt-6 bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Patient
              </Button>
            )}
          </div>
        ) : (
          <div className="glass-panel rounded-[24px] overflow-hidden p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Patient Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Age / Sex</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Vitals</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {patients.map((patient, index) => (
                    <tr
                      key={patient.id}
                      onClick={() => openPatientDetails(patient)}
                      className={`
                        group transition-all hover:bg-cyan-50/50 dark:hover:bg-cyan-900/20 cursor-pointer
                        ${index % 2 === 0 ? 'bg-white/20 dark:bg-slate-800/20' : 'bg-white/10 dark:bg-slate-800/10'}
                      `}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{patient.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{patient.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          {patient.patient_id?.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          {patient.age} yrs <span className="text-slate-300 dark:text-slate-600 mx-1">|</span> {patient.sex}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {patient.blood_pressure && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                              <Activity className="h-3 w-3 text-rose-500" />
                              BP: {patient.blood_pressure}
                            </div>
                          )}
                          {patient.heart_rate && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                              <Heart className="h-3 w-3 text-rose-500" />
                              HR: {patient.heart_rate} bpm
                            </div>
                          )}
                          {!patient.blood_pressure && !patient.heart_rate && (
                            <span className="text-xs text-slate-400 italic">No vitals</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 w-fit">
                            Active
                          </span>
                          {patient.hasPrescription && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 w-fit">
                              <CheckCircle className="h-3 w-3" />
                              Prescribed Today
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); openPrescriptionModal(patient); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 dark:hover:bg-teal-900/50 text-xs font-bold transition-all border border-teal-200 dark:border-teal-800 shadow-sm"
                          >
                            <FilePlus className="h-3.5 w-3.5" />
                            Prescribe
                          </button>
                          {/* Buttons kept as shortcuts but prevent bubbling */}
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(patient); }}
                            className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
                            title="Edit Details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(patient.id); }}
                            className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
                            title="Delete Patient"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {patients.map((patient) => (
                <div key={patient.id} className="glass-panel rounded-[20px] p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/30">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-lg">{patient.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{patient.email || 'No email'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 backdrop-blur-sm">
                      <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold block mb-1">ID</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{patient.patient_id?.slice(0, 8)}...</span>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 backdrop-blur-sm">
                      <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold block mb-1">Details</span>
                      <span className="text-slate-700 dark:text-slate-300 block">{patient.age} yrs • {patient.sex}</span>
                      {(patient.blood_pressure || patient.heart_rate) && (
                        <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-1">
                          {patient.blood_pressure && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Activity className="h-3 w-3 text-rose-500" />
                              <span className="text-slate-600 dark:text-slate-300">{patient.blood_pressure}</span>
                            </div>
                          )}
                          {patient.heart_rate && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Heart className="h-3 w-3 text-rose-500" />
                              <span className="text-slate-600 dark:text-slate-300">{patient.heart_rate} bpm</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 w-fit">
                        Active
                      </span>
                      {patient.hasPrescription && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Rx Created
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openPatientDetails(patient)}
                        className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openPrescriptionModal(patient)}
                        className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                      >
                        <FilePlus className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(patient)}
                        className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Patient Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md rounded-3xl glass-panel p-6 sm:p-8 text-left align-middle shadow-2xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold leading-6 text-slate-900 dark:text-white mb-8"
                  >
                    {editingPatient ? 'Edit Patient' : 'Add New Patient'}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">Personal Info</h4>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          className="input-field w-full p-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:focus:ring-cyan-400/50 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all"
                          placeholder="e.g. John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">Email <span className="font-normal text-slate-400">(Optional)</span></label>
                        <input
                          type="email"
                          className="input-field w-full p-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:focus:ring-cyan-400/50 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all"
                          placeholder="patient@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">Phone <span className="font-normal text-slate-400">(Optional)</span></label>
                        <input
                          type="tel"
                          className="input-field w-full p-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:focus:ring-cyan-400/50 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all"
                          placeholder="+1 555 000 0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">Age</label>
                        <input
                          type="number"
                          required
                          className="input-field w-full p-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                          placeholder="35"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">Gender</label>
                        <select
                          className="input-field w-full p-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                          value={formData.sex}
                          onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                        >
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 border-b border-slate-200 dark:border-slate-700 pb-1 mt-1">Vitals</h4>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">BP <span className="font-normal text-slate-400">(mmHg)</span></label>
                        <div className="relative">
                          <Activity className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            className="input-field w-full pl-8 p-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:focus:ring-rose-400/50 focus:border-rose-500 dark:focus:border-rose-400 transition-all"
                            placeholder="120/80"
                            value={formData.blood_pressure}
                            onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">Heart Rate</label>
                        <div className="relative">
                          <Heart className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="number"
                            className="input-field w-full pl-8 p-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:focus:ring-rose-400/50 focus:border-rose-500 dark:focus:border-rose-400 transition-all"
                            placeholder="72"
                            value={formData.heart_rate}
                            onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 rounded-xl text-sm py-2"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 text-sm py-2"
                      >
                        {editingPatient ? 'Save' : 'Add'}
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Prescription Creator Modal */}
      {selectedPatientForPrescription && (
        <PrescriptionCreator
          isOpen={isPrescriptionModalOpen}
          setIsOpen={setIsPrescriptionModalOpen}
          patient={selectedPatientForPrescription}
          onSuccess={fetchPatients}
        />
      )}

      {/* PatientDetails Modal */}
      {selectedPatientForDetails && (
        <PatientDetails
          isOpen={isDetailsOpen}
          setIsOpen={setIsDetailsOpen}
          patient={selectedPatientForDetails}
          onPrescribe={(patient) => {
            setIsDetailsOpen(false)
            openPrescriptionModal(patient)
          }}
        />
      )}
    </div>
  )
}
