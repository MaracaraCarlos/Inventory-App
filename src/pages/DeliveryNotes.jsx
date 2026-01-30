import { useState, useEffect } from 'react'
import { FileText, Download, Loader2, ArrowLeft, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { movementRepository } from '../repositories/movementRepository'
import { useLanguage } from '../lib/LanguageContext'

export default function DeliveryNotes() {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [batches, setBatches] = useState([])
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchMovementsAndGroup()
    }, [])

    const fetchMovementsAndGroup = async () => {
        setLoading(true)
        try {
            const { data, error } = await movementRepository.getAllMovements()
            if (error) throw error

            // Group movements into "batches" based on similarity (Time + User + Type)
            const grouped = {}

            data.forEach(move => {
                // Create a key based on 1-minute time window, user, and type
                const date = new Date(move.created_at)
                date.setSeconds(0, 0) // Round to minute
                const timeKey = date.toISOString()
                const key = `${timeKey}_${move.user_id}_${move.type}_${move.project_id}_${move.from_project_id || ''}`

                if (!grouped[key]) {
                    grouped[key] = {
                        id: key,
                        date: move.created_at,
                        type: move.type,
                        user: move.user_email,
                        project: move.project,
                        from_project: move.from_project,
                        supplier: move.supplier,
                        contractor: move.contractor,
                        items: []
                    }
                }
                grouped[key].items.push(move)
            })

            // Convert to array and sort by date desc
            const batchesArray = Object.values(grouped).sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            )

            setBatches(batchesArray)
        } catch (error) {
            console.error('Error fetching movements:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadImage = (url) => {
        return new Promise((resolve) => {
            const img = new Image()
            img.src = url
            img.onload = () => resolve(img)
            img.onerror = () => resolve(null)
        })
    }

    const generatePDF = async (batch) => {
        const doc = new jsPDF()

        // Try to load logo
        const logo = await loadImage('/logo.png') || await loadImage('/logo.jpg')

        if (logo) {
            // Add Logo Image - maintain aspect ratio, max width 40mm
            const logoWidth = 40
            const logoHeight = (logo.height * logoWidth) / logo.width
            doc.addImage(logo, 'PNG', 14, 15, logoWidth, logoHeight)
        } else {
            // Fallback Text Logo
            doc.setFontSize(24)
            doc.setTextColor(220, 38, 38) // Red color for KOMA
            doc.setFont("helvetica", "bold")
            doc.text("KOMA", 14, 20)

            doc.setFontSize(8)
            doc.setTextColor(0, 0, 0)
            doc.text("GERENCIA, PROYECTO Y CONSTRUCCIÓN", 14, 25)
            doc.text("RIF J-31087664-4", 14, 29)
        }

        // Title
        doc.setFontSize(16)
        doc.setFont("helvetica", "normal")
        doc.text("NOTA DE ENTREGA", 105, 40, { align: "center" })

        // Header Table
        const dateStr = new Date(batch.date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })

        let origin = ''
        let destination = ''

        if (batch.type === 'IN') {
            origin = batch.supplier?.name || "PROVEEDOR"
            destination = batch.project?.name || "PROYECTO"
        } else if (batch.type === 'OUT') {
            origin = batch.project?.name || "PROYECTO"
            destination = batch.contractor?.name || "CONTRATISTA"
        } else if (batch.type === 'TRANSFER') {
            origin = batch.from_project?.name || "ALMACÉN CENTRAL / PROYECTO"
            destination = batch.project?.name || "PROYECTO"
        }

        autoTable(doc, {
            startY: 50,
            head: [],
            body: [
                ['FECHA:', dateStr],
                ['ORIGEN:', origin],
                ['DESTINO:', destination]
            ],
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 2, lineColor: [200, 200, 200] },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40, fillColor: [250, 250, 250] },
                1: { cellWidth: 'auto' }
            }
        })

        // Text Paragraph
        const finalY = doc.lastAutoTable.finalY + 10
        doc.setFontSize(10)
        doc.text("Sirva la presente para hacer entrega de los siguientes productos, que se especifican a continuación.", 14, finalY, { maxWidth: 180 })

        // Products Table
        const productsBody = batch.items.map(item => [
            item.products?.sku || '-',
            item.products?.name || item.products?.description || '-',
            item.type === 'IN' ? 'ENTRADA' : item.type === 'OUT' ? 'SALIDA' : 'TRASLADO',
            item.notes || '',
            item.quantity
        ])

        // Add Footer Row for Total
        const totalQty = batch.items.reduce((sum, item) => sum + Number(item.quantity), 0)
        productsBody.push([
            { content: '', colSpan: 3, styles: { lineWidth: 0 } },
            { content: 'TOTAL DE PRODUCTOS', styles: { fontStyle: 'bold', halign: 'right' } },
            { content: totalQty, styles: { fontStyle: 'bold' } }
        ])

        autoTable(doc, {
            startY: finalY + 10,
            head: [['SKU', 'PRODUCTO', 'TIPO', 'NOTA', 'CANT.']],
            body: productsBody,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [200, 200, 200] },
            styles: { fontSize: 9, lineColor: [200, 200, 200] },
            columnStyles: {
                0: { cellWidth: 25 }, // SKU
                1: { cellWidth: 'auto' }, // Product
                2: { cellWidth: 25 }, // Type
                3: { cellWidth: 40 }, // Note
                4: { cellWidth: 20, halign: 'center' } // Qty
            }
        })

        // Closing Text
        const tableEnd = doc.lastAutoTable.finalY + 10
        doc.text("Sin más por los momentos.", 14, tableEnd)
        doc.text("Atentamente,", 14, tableEnd + 5)

        // Signatures Footer
        const pageHeight = doc.internal.pageSize.height
        const signatureHeight = 55 // Increased height to prevent splitting
        let signatureY = pageHeight - signatureHeight - 10

        // Check if current content (text) overlaps with where signature area should start
        if (tableEnd + 10 > signatureY) {
            doc.addPage()
            signatureY = pageHeight - signatureHeight - 10
        }

        autoTable(doc, {
            startY: signatureY,
            head: [['ENTREGADO POR:', 'RECIBIDO POR:']],
            body: [
                ['NOMBRE:', 'NOMBRE:'],
                ['\n\n\nFIRMA:', '\n\n\nFIRMA:']
            ],
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [150, 150, 150] },
            styles: { fontSize: 10, lineColor: [150, 150, 150], cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 90 },
                1: { cellWidth: 90 }
            },
            pageBreak: 'avoid' // Prevent table splitting
        })

        doc.save(`nota_entrega_${batch.type}_${dateStr.replace(/\//g, '-')}.pdf`)
    }

    const filteredBatches = batches.filter(batch =>
        batch.items.some(item =>
            (item.products?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    )

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <button
                    onClick={() => navigate('/reports')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    {t('common.back')}
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.deliveryNotes')}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{t('reports.deliveryNotesDesc')}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder={t('reports.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : filteredBatches.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                        No se encontraron notas de entrega.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredBatches.map((batch, index) => (
                            <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${backgroundForType(batch.type)}`}>
                                            {batch.type === 'IN' ? 'ENTRADA' : batch.type === 'OUT' ? 'SALIDA' : 'TRASLADO'}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(batch.date).toLocaleString()}
                                        </span>
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white text-lg">
                                        {descriptionForBatch(batch)}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {batch.items.length} productos • {batch.user}
                                    </p>
                                </div>
                                <button
                                    onClick={() => generatePDF(batch)}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <Download size={18} />
                                    Descargar PDF
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function backgroundForType(type) {
    if (type === 'IN') return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800'
    if (type === 'OUT') return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
}

function descriptionForBatch(batch) {
    if (batch.type === 'IN') return `Proveedor: ${batch.supplier?.name || 'N/A'}`
    if (batch.type === 'OUT') return `Destino: ${batch.contractor?.name || batch.project?.name || 'N/A'}`
    if (batch.type === 'TRANSFER') return `Desde: ${batch.from_project?.name || 'Central'} → ${batch.project?.name || 'Central'}`
    return 'Movimiento de Inventario'
}
