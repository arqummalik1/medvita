import { useState, useEffect, Fragment } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, FilePlus, X, Eye, MoreVertical, Users } from 'lucide-react'
import { Dialog, Menu, Transition } from '@headlessui/react'
import PrescriptionCreator from '../components/PrescriptionCreator'
import PatientDetails from '../components/PatientDetails'

export default function PatientsManager() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [patients, setPatients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  
  // Prescription State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState(null)

  // Patient Details State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    sex: 'Male',
    email: ''
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      openAddModal()
    }
  }, [searchParams])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchQuery) {
        // Search by name or patient_id
        query = query.or(`name.ilike.%${searchQuery}%,patient_id.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setPatients(data)
    } catch (error) {
      console.error('Error fetching patients:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Real-time search debounce could be added here, but for simplicity we trigger on effect change of searchQuery if we want "real-time"
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const patientData = {
        name: formData.name,
        age: parseInt(formData.age),
        sex: formData.sex,
        email: formData.email,
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
      setFormData({ name: '', age: '', sex: 'Male' })
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
      email: patient.email || ''
    })
    setIsModalOpen(true)
  }

  const openAddModal = () => {
    setEditingPatient(null)
    setFormData({ name: '', age: '', sex: 'Male', email: '' })
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
      <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Patients</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              A list of all your patients including their name, ID, age, and gender.
            </p>
          </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative max-w-2xl mx-auto">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="input-field block w-full pl-11 pr-4 py-4 rounded-2xl text-base placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
            placeholder="Search patients by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass-card h-16 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 glass-card rounded-2xl border-red-200">
            <p className="text-red-500 font-medium">Error: {error}</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-3xl border-dashed border-2 border-slate-200 dark:border-slate-700">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Users className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No patients found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
              {searchQuery ? "Try adjusting your search terms." : "Get started by adding a new patient to your practice."}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="mt-6 btn btn-primary"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Patient
              </button>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Patient Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Age / Sex</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {patients.map((patient, index) => (
                    <tr 
                      key={patient.id} 
                      className={`
                        group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10
                        ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/20'}
                      `}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{patient.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{patient.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          {patient.patient_id?.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          {patient.age} yrs <span className="text-slate-300 dark:text-slate-600 mx-1">|</span> {patient.sex}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openPatientDetails(patient)} 
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            title="View History"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openPrescriptionModal(patient)} 
                            className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                            title="New Prescription"
                          >
                            <FilePlus className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(patient)} 
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                            title="Edit Details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(patient.id)} 
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl glass-panel p-8 text-left align-middle shadow-2xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold leading-6 text-slate-900 dark:text-white mb-8"
                  >
                    {editingPatient ? 'Edit Patient' : 'Add New Patient'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address <span className="font-normal text-slate-400">(Optional)</span></label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="patient@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Age</label>
                        <input
                          type="number"
                          required
                          className="input-field"
                          placeholder="e.g. 35"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                        <select
                          className="input-field"
                          value={formData.sex}
                          onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                        >
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                      <button
                        type="button"
                        className="flex-1 btn bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 btn btn-primary"
                      >
                        {editingPatient ? 'Save Changes' : 'Add Patient'}
                      </button>
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
        />
      )}

      {/* Patient Details Modal */}
      {selectedPatientForDetails && (
        <PatientDetails
          isOpen={isDetailsOpen}
          setIsOpen={setIsDetailsOpen}
          patient={selectedPatientForDetails}
        />
      )}
    </div>
  )
}
