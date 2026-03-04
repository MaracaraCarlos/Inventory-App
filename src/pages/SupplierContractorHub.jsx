import { useNavigate } from 'react-router-dom'
import { Truck, Users, ArrowLeft } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

export default function SupplierContractorHub() {
    const { t } = useLanguage()
    const navigate = useNavigate()

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('supplierContractorHub.title')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {t('supplierContractorHub.subtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                {/* Suppliers Card */}
                <button
                    onClick={() => navigate('/suppliers')}
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Truck className="text-white" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {t('suppliers.title')}
                        </h3>
                        <p className="text-blue-100">
                            {t('suppliers.description')}
                        </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Contractors Card */}
                <button
                    onClick={() => navigate('/contractors')}
                    className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Users className="text-white" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {t('contractors.title')}
                        </h3>
                        <p className="text-green-100">
                            {t('contractors.description')}
                        </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </div>
    )
}
