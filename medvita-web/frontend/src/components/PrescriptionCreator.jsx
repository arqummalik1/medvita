import { useState, useRef, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Upload, X, FileText, Check, Mail, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { PrescriptionTemplate, A4_WIDTH_MM, A4_HEIGHT_MM, COLORS } from './PrescriptionPreviewModal'

export default function PrescriptionCreator({ isOpen, setIsOpen, patient, onSuccess, initialData }) {
  const { user, profile } = useAuth()

  // Helper to parse existing text
  const parseInitialState = () => {
    if (!initialData?.prescription_text) return { diag: '', rx: '' }
    const parts = initialData.prescription_text.split('\n\nRx:\n')
    if (parts.length === 2 && parts[0].startsWith('Diagnosis: ')) {
      return {
        diag: parts[0].replace('Diagnosis: ', ''),
        rx: parts[1]
      }
    }
    return { diag: '', rx: initialData.prescription_text }
  }

  const initialState = parseInitialState()

  const [diagnosis, setDiagnosis] = useState(initialState.diag)
  const [prescriptionText, setPrescriptionText] = useState(initialState.rx)
  const [patientEmail, setPatientEmail] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('') // '', 'saving', 'generating', 'uploading', 'emailing'
  const [success, setSuccess] = useState(false)

  const fileInputRef = useRef(null)
  const mirrorRef = useRef(null)

  // Auto-fill patient email if exists
  useEffect(() => {
    if (patient?.email) {
      setPatientEmail(patient.email)
    }
  }, [patient])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const generateAndUploadPDF = async (prescriptionId, patientName) => {
    if (!mirrorRef.current) throw new Error('PDF Error: Render target missing')

    setStatus('generating')
    // Wait for render to stabilize
    await new Promise(resolve => setTimeout(resolve, 800))

    const canvas = await html2canvas(mirrorRef.current, {
      scale: 2, // 2x for email attachment is plenty and keeps size down
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 794,
      logging: false
    })

    setStatus('uploading')
    const imgData = canvas.toDataURL('image/jpeg', 0.8) // Compressed JPEG for attachment
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    })
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)

    // Convert to Blob for upload
    const pdfBlob = pdf.output('blob')
    const fileName = `prescriptions/${prescriptionId}_${Date.now()}.pdf`
    const filePath = `${user.id}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('medvita-files')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('medvita-files')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    setStatus('saving')

    try {
      // 1. Update Patient Email if it was changed/provided
      if (patientEmail && patientEmail !== patient?.email) {
        await supabase
          .from('patients')
          .update({ email: patientEmail })
          .eq('id', patient.id)
      }

      // 2. Prepare Payload
      const fullText = diagnosis ? `Diagnosis: ${diagnosis}\n\nRx:\n${prescriptionText}` : prescriptionText
      const payload = {
        patient_id: patient.id,
        doctor_id: user.id,
        prescription_text: fullText,
        file_url: initialData?.file_url || null
      }

      // 3. Save Prescription to DB
      let prescriptionData
      if (initialData) {
        const { data, error } = await supabase
          .from('prescriptions')
          .update(payload)
          .eq('id', initialData.id)
          .select()
        if (error) throw error
        prescriptionData = data[0]
      } else {
        const { data, error } = await supabase
          .from('prescriptions')
          .insert([payload])
          .select()
        if (error) throw error
        prescriptionData = data[0]
      }

      // 4. Generate & Upload A4 PDF
      const pdfUrl = await generateAndUploadPDF(prescriptionData.id, patient.name)

      // 5. Update Prescription with the generated PDF URL
      await supabase
        .from('prescriptions')
        .update({ file_url: pdfUrl })
        .eq('id', prescriptionData.id)

      // 6. Trigger Email via Supabase Edge Function
      if (patientEmail) {
        setStatus('emailing')
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-prescription-email', {
          body: {
            patientName: patient.name,
            patientEmail: patientEmail,
            pdfUrl: pdfUrl,
            doctorName: profile?.full_name || 'Your Doctor',
            clinicName: profile?.clinic_name || 'MedVita Clinic'
          }
        })

        if (emailError) throw new Error(`Email failed: ${emailError.message || 'Unknown network error'}`)
        if (emailData && emailData.error) throw new Error(`Email delivery blocked: ${emailData.error}`)

        console.log('Email Sent Successfully:', emailData)
      }

      setSuccess(true)
      setStatus('')
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setPrescriptionText('')
        setDiagnosis('')
        setFile(null)
        if (onSuccess) onSuccess()
      }, 2000)

    } catch (error) {
      console.error('Submit Error:', error)
      alert('Error saving/emailing prescription: ' + error.message)
    } finally {
      setUploading(false)
      setStatus('')
    }
  }

  return (
    <Dialog open={isOpen} onClose={() => !uploading && setIsOpen(false)} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />

      {/* HIDDEN MIRROR for PDF generation */}
      {isOpen && (
        <div style={{ position: 'fixed', left: '-15000px', top: '-15000px', zIndex: -1 }}>
          <div ref={mirrorRef}>
            <PrescriptionTemplate
              prescription={{ prescription_text: diagnosis ? `Diagnosis: ${diagnosis}\n\nRx:\n${prescriptionText}` : prescriptionText }}
              patient={patient}
              doctorInfo={profile}
              id="pdf-mirror"
              isHidden={false} // It's already in the hidden div
            />
          </div>
        </div>
      )}

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-3xl glass-panel p-8 shadow-2xl w-full">
          {success ? (
            <div className="text-center py-10">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 shadow-inner mb-6">
                <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Prescription Sent!</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">The PDF has been generated and emailed to</p>
              <p className="font-bold text-teal-600 mt-1">{patientEmail || 'the patient'}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-2xl font-bold leading-6 text-slate-900 dark:text-white">
                  {initialData ? 'Edit Prescription' : 'New Prescription'}
                  <div className="mt-1 text-base font-normal text-slate-500">
                    for <span className="font-semibold text-teal-600 dark:text-teal-400">{patient?.name}</span>
                  </div>
                </Dialog.Title>
                <button onClick={() => setIsOpen(false)} disabled={uploading} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Patient Email
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="patient@example.com for PDF delivery"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Diagnosis</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Acute Fever"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Rx / Treatment</label>
                  <textarea
                    required
                    className="input-field min-h-[120px]"
                    rows="4"
                    placeholder="Enter medications and instructions..."
                    value={prescriptionText}
                    onChange={(e) => setPrescriptionText(e.target.value)}
                  ></textarea>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    disabled={uploading}
                    className="flex-1 btn bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 btn btn-primary relative overflow-hidden"
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="capitalize">{status}...</span>
                      </span>
                    ) : (initialData ? 'Update & Email' : 'Create & Send Email')}
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
