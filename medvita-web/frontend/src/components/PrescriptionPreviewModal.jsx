import { Fragment, useRef, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Printer, Download, FileText, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Export COLORS and Template for reuse in PrescriptionCreator
export const COLORS = {
    indigoPrimary: '#0284C7',
    indigoDark: '#0C2A4A',
    slateText: '#334155',
    slateLight: '#64748b',
    slateBorder: '#e2e8f0',
    white: '#ffffff',
    patientBg: '#f8fafc'
}

// Global A4 Metric Constants
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export const PrescriptionTemplate = ({ prescription, patient, doctorInfo, innerRef, id, isHidden = false }) => {
    const formattedRx = prescription?.prescription_text?.split('\n').map((str, i) => (
        <p key={i} style={{ minHeight: '1.2rem', margin: '0 0 0.5rem 0' }}>{str}</p>
    ))

    return (
        <div
            ref={innerRef}
            id={id}
            style={{
                fontFamily: '"Times New Roman", serif',
                backgroundColor: '#ffffff',
                color: '#000000',
                display: 'block',
                padding: '12mm 15mm', // Slightly tighter margins to prevent overflow
                width: `${A4_WIDTH_MM}mm`,
                height: `${A4_HEIGHT_MM}mm`,
                minHeight: `${A4_HEIGHT_MM}mm`,
                position: isHidden ? 'fixed' : 'relative',
                left: isHidden ? '-10000px' : '0',
                top: isHidden ? '-10000px' : '0',
                zIndex: isHidden ? -100 : 1,
                boxSizing: 'border-box',
                textAlign: 'left',
                border: isHidden ? 'none' : '1px solid #e2e8f0',
                margin: '0 auto',
                overflow: 'hidden' // Strictly contain everything within A4
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1.2mm solid ${COLORS.indigoPrimary}`, paddingBottom: '8mm', marginBottom: '12mm' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
                    {doctorInfo?.clinic_logo_url ? (
                        <img
                            src={doctorInfo.clinic_logo_url}
                            alt="Logo"
                            crossOrigin="anonymous"
                            style={{ height: '18mm', width: 'auto', objectFit: 'contain' }}
                        />
                    ) : (
                        <div style={{ height: '14mm', width: '14mm', backgroundColor: '#eef2ff', borderRadius: '2mm', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.indigoPrimary }}>
                            <FileText style={{ height: '7mm', width: '7mm' }} />
                        </div>
                    )}
                    <div>
                        <h1 style={{ fontSize: '20pt', fontWeight: 'bold', color: COLORS.indigoDark, margin: 0, lineHeight: 1 }}>
                            {doctorInfo?.clinic_name || 'Clinic Name'}
                        </h1>
                        <p style={{ fontSize: '11pt', color: COLORS.slateLight, margin: '2mm 0 0 0' }}>Excellence in Healthcare</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Dr. {doctorInfo?.full_name}</h2>
                    <p style={{ fontSize: '11pt', fontWeight: 'bold', color: COLORS.indigoPrimary, margin: '2mm 0', textTransform: 'uppercase' }}>
                        {doctorInfo?.doctor_qualification}
                    </p>
                    <div style={{ fontSize: '9pt', color: COLORS.slateLight, marginTop: '4mm' }}>
                        <p style={{ margin: '1mm 0' }}>{doctorInfo?.clinic_address}</p>
                        <p style={{ margin: '1mm 0', fontSize: '8.5pt' }}>{doctorInfo?.clinic_timings}</p>
                    </div>
                </div>
            </div>

            {/* Patient Meta */}
            <div style={{ backgroundColor: COLORS.patientBg, border: `0.3mm solid ${COLORS.slateBorder}`, borderRadius: '2mm', padding: '6mm', marginBottom: '12mm', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div>
                    <p style={{ fontSize: '9pt', fontWeight: 'bold', color: COLORS.slateLight, textTransform: 'uppercase', margin: 0 }}>Patient Name</p>
                    <p style={{ fontSize: '14pt', fontWeight: 'bold', color: '#0f172a', margin: '2mm 0' }}>{patient?.name}</p>
                    <p style={{ fontSize: '11pt', color: COLORS.slateLight, margin: 0 }}>{patient?.age} Years / {patient?.sex}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '9pt', fontWeight: 'bold', color: COLORS.slateLight, textTransform: 'uppercase', margin: 0 }}>Date</p>
                    <p style={{ fontSize: '14pt', fontWeight: 'bold', color: '#0f172a', margin: '2mm 0' }}>
                        {prescription.created_at
                            ? format(new Date(prescription.created_at), 'MMM dd, yyyy')
                            : format(new Date(), 'MMM dd, yyyy')}
                    </p>
                    <p style={{ fontSize: '9pt', fontFamily: 'monospace', color: COLORS.slateLight, margin: 0 }}>ID: {patient?.id?.slice(0, 8).toUpperCase()}</p>
                </div>
            </div>

            {/* Body */}
            <div style={{ marginBottom: '25mm', minHeight: '130mm' }}>
                <div style={{ fontSize: '42pt', fontWeight: 'bold', color: COLORS.indigoPrimary, marginBottom: '8mm', fontStyle: 'italic', opacity: 0.8 }}>Rx</div>
                <div style={{ color: COLORS.slateText, fontSize: '13pt', lineHeight: '1.5' }}>
                    {formattedRx}
                </div>
            </div>

            {/* Footer / Signature - Strictly positioned */}
            <div style={{ position: 'absolute', bottom: '20mm', left: '15mm', right: '15mm' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}>
                    <div style={{ textAlign: 'center', width: '55mm' }}>
                        <div style={{ height: '12mm', borderBottom: '0.4mm dashed #1e293b', marginBottom: '2mm' }}></div>
                        <p style={{ fontSize: '10pt', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', margin: 0 }}>Doctor's Signature</p>
                    </div>
                </div>
                <div style={{ borderTop: `0.2mm solid ${COLORS.slateBorder}`, paddingTop: '4mm', textAlign: 'center' }}>
                    <p style={{ fontSize: '9pt', color: COLORS.slateLight, margin: 0 }}>
                        {doctorInfo?.doctor_footer_text || 'Get well soon.'}
                    </p>
                    <p style={{ fontSize: '7pt', color: '#cbd5e1', marginTop: '2mm', textTransform: 'uppercase' }}>
                        Generated via MedVita
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function PrescriptionPreviewModal({ isOpen, onClose, prescription, patient, autoDownload = false }) {
    console.log('PrescriptionPreviewModal v13 - Anti-Overflow A4 Engine')
    const { profile } = useAuth()
    const contentRef = useRef(null)
    const mirrorRef = useRef(null)
    const [isExporting, setIsExporting] = useState(false)

    const doctorInfo = profile?.role === 'doctor' ? profile : prescription?.doctor

    const handlePrint = async () => {
        if (!contentRef.current) return;

        // Capture OUTER HTML to preserve root styles (padding, font, etc)
        const printContent = contentRef.current.outerHTML;
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Prescription_${patient?.name || 'Patient'}</title>
                    <style>
                        @media print {
                            @page { size: A4; margin: 0; }
                            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            .print-container { width: 210mm; height: 297mm; overflow: hidden; margin: 0 auto; }
                        }
                        body { 
                            margin: 0; 
                            padding: 0; 
                            background: white;
                        }
                        * { box-sizing: border-box; }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${printContent}
                    </div>
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    const handleDownloadPDF = async () => {
        if (!mirrorRef.current) return
        try {
            setIsExporting(true)
            console.log('Generating Precision PDF (Fixed Size)...')

            await new Promise(resolve => setTimeout(resolve, 600))

            const canvas = await html2canvas(mirrorRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794, // 210mm at 96dpi
                height: 1123, // 297mm at 96dpi
                windowWidth: 794,
                logging: false,
                scrollX: 0,
                scrollY: 0
            })

            const imgData = canvas.toDataURL('image/jpeg', 0.98)
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            })

            // Map the capture exactly to A4
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
            pdf.save(`Prescription_${patient?.name || 'Patient'}.pdf`)

        } catch (error) {
            console.error('PDF Error:', error)
            alert('PDF failed. Using Print fallback.')
        } finally {
            setIsExporting(false)
            if (autoDownload) onClose()
        }
    }

    useEffect(() => {
        if (isOpen && autoDownload && mirrorRef.current && !isExporting) {
            handleDownloadPDF()
        }
    }, [isOpen, autoDownload, mirrorRef.current])

    if (!prescription) return null

    return (
        <>
            {/* HIDDEN MIRROR - Exact A4 Metric Capture */}
            {isOpen && (
                <div style={{ position: 'fixed', left: '-20000px', top: '-20000px', zIndex: -1 }}>
                    <PrescriptionTemplate
                        prescription={prescription}
                        patient={patient}
                        doctorInfo={doctorInfo}
                        innerRef={mirrorRef}
                        id="prescription-mirror"
                        isHidden={true}
                    />
                </div>
            )}

            <Transition.Root show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={onClose}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">

                                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-4 sm:px-6 flex justify-between items-center sticky top-0 z-20">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-cyan-200">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Prescription Draft</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleDownloadPDF}
                                                disabled={isExporting}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-100 disabled:opacity-50"
                                            >
                                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                A4 PDF
                                            </button>

                                            <button
                                                onClick={handlePrint}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-100"
                                            >
                                                <Printer className="h-4 w-4" /> A4 Print
                                            </button>

                                            <button
                                                onClick={onClose}
                                                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all ml-2"
                                            >
                                                <X className="h-6 w-6" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-200/70 p-4 sm:p-10 overflow-y-auto max-h-[85vh] flex flex-col items-center custom-scrollbar scroll-smooth">
                                        <div className="shadow-2xl bg-white mb-10 mt-4" style={{ width: '210mm', flexShrink: 0 }}>
                                            <PrescriptionTemplate
                                                prescription={prescription}
                                                patient={patient}
                                                doctorInfo={doctorInfo}
                                                innerRef={contentRef}
                                                id="prescription-visible"
                                            />
                                        </div>
                                    </div>

                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    )
}
