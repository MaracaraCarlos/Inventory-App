import { FileText, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../lib/LanguageContext'

export default function Reports() {
    const navigate = useNavigate()
    const { t } = useLanguage()

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('reports.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                {/* General Reports Card */}
                <button
                    onClick={() => navigate('/reports/general')}
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FileText className="text-white" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {t('reports.stockAndMovements')}
                        </h2>
                        <p className="text-blue-100">
                            {/* Description text if needed, or keeping it clean as in previous iteration, 
                                but SupplierHub had descriptions. I'll use a placeholder key or skip if empty. 
                                User asked to match design. SupplierHub has descriptions.
                                I'll add keys for descriptions. */}
                            {t('reports.stockAndMovementsDesc')}
                        </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Delivery Notes Card */}
                <button
                    onClick={() => navigate('/reports/delivery-notes')}
                    className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ClipboardList className="text-white" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {t('reports.deliveryNotes')}
                        </h2>
                        <p className="text-purple-100">
                            {t('reports.deliveryNotesDesc')}
                        </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </div>
    )
}
