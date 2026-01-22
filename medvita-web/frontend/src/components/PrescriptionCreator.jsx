import { useState, useRef } from 'react'
import { Dialog } from '@headlessui/react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Upload, X, FileText, Check } from 'lucide-react'

export default function PrescriptionCreator({ isOpen, setIsOpen, patient }) {
  const { user } = useAuth()
  const [diagnosis, setDiagnosis] = useState('')
  const [prescriptionText, setPrescriptionText] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    
    try {
      let fileUrl = null

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('medvita-files')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data } = supabase.storage
          .from('medvita-files')
          .getPublicUrl(filePath)
        
        fileUrl = data.publicUrl
      }

      const { error: dbError } = await supabase
        .from('prescriptions')
        .insert([
          {
            patient_id: patient.id,
            doctor_id: user.id,
            prescription_text: `Diagnosis: ${diagnosis}\n\nRx:\n${prescriptionText}`,
            file_url: fileUrl
          }
        ])

      if (dbError) throw dbError

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setPrescriptionText('')
        setFile(null)
      }, 1500)

    } catch (error) {
      alert('Error creating prescription: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-3xl glass-panel p-8 shadow-2xl w-full">
          {success ? (
             <div className="text-center py-10">
               <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 shadow-inner mb-6">
                 <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Prescription Sent!</h3>
               <p className="mt-2 text-slate-600 dark:text-slate-300">The patient has been updated successfully.</p>
             </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <Dialog.Title className="text-2xl font-bold leading-6 text-slate-900 dark:text-white">
                  New Prescription
                  <div className="mt-1 text-base font-normal text-slate-500">
                    for <span className="font-semibold text-blue-600 dark:text-blue-400">{patient?.name}</span>
                  </div>
                </Dialog.Title>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Diagnosis</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Acute Bronchitis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rx / Treatment</label>
                  <textarea
                    className="input-field min-h-[150px]"
                    rows="4"
                    placeholder="Enter medications and instructions..."
                    value={prescriptionText}
                    onChange={(e) => setPrescriptionText(e.target.value)}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Attachments <span className="font-normal text-slate-400">(Optional)</span></label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="space-y-1 text-center">
                      <div className="mx-auto h-12 w-12 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        PDF, PNG, JPG up to 10MB
                      </p>
                      {file && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 py-2 px-4 rounded-lg inline-block">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm font-semibold">{file.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    className="flex-1 btn bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 btn btn-primary"
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : 'Create Prescription'}
                  </button>
                </div>
              </form>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
