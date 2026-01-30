import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { contractorRepository } from '../repositories/contractorRepository'
import { useLanguage } from '../lib/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import ContractorFormModal from '../components/ContractorFormModal'

export default function Contractors() {
    const { t } = useLanguage()
    const { item } = useAuth()
    const navigate = useNavigate()
    const [contractors, setContractors] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingContractor, setEditingContractor] = useState(null)

    const fetchContractors = async () => {
        setLoading(true)
        try {
            const { data, error } = await contractorRepository.getAllContractors()
            if (error) throw error
            setContractors(data || [])
        } catch (error) {
            console.error('Error fetching contractors:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchContractors()
    }, [])

    const handleDelete = async (id) => {
        if (!window.confirm(t('contractors.deleteConfirm'))) return

        try {
            const { error } = await contractorRepository.deleteContractor(id)
            if (error) throw error
            fetchContractors()
        } catch (error) {
            alert(t('contractors.deleteError'))
        }
    }

    const handleEdit = (contractor) => {
        setEditingContractor(contractor)
        setIsModalOpen(true)
    }

    const handleAddNew = () => {
        setEditingContractor(null)
        setIsModalOpen(true)
    }

    const filteredContractors = contractors.filter(contractor =>
        contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contractor.contact_person && contractor.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contractor.email && contractor.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div>
            <div className="mb-8">
                <button
                    onClick={() => navigate('/suppliers-contractors')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                >
                    <ArrowLeft size={20} />
                    {t('common.back')}
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('contractors.title')}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('contractors.subtitle')}</p>
                    </div>
                    {item.canCreate && (
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            <span>{t('contractors.add')}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t('contractors.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-green-600" size={32} />
                    </div>
                ) : filteredContractors.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        {searchTerm ? t('contractors.noResults') : t('contractors.empty')}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('contractors.name')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('contractors.contactPerson')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('contractors.phone')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('contractors.email')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('common.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredContractors.map((contractor) => (
                                    <tr key={contractor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900 dark:text-white">{contractor.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                            {contractor.contact_person || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                            {contractor.phone ? (
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} />
                                                    {contractor.phone}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                            {contractor.email ? (
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} />
                                                    {contractor.email}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.canEdit && (
                                                    <button
                                                        onClick={() => handleEdit(contractor)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                                {item.canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(contractor.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ContractorFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                contractorToEdit={editingContractor}
                onContractorSaved={fetchContractors}
            />
        </div >
    )
}
