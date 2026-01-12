import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'

export default function ProductModal({ isOpen, onClose, productToEdit, onProductSaved }) {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState([])
    const [projects, setProjects] = useState([])
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category_id: '',
        project_id: '',
        quantity: 0,
        price: 0,
        min_stock_level: 5,
        description: ''
    })

    const fetchData = async () => {
        const { data: catData } = await supabase.from('categories').select('*').order('name')
        setCategories(catData || [])

        const { data: projData } = await supabase.from('projects').select('*').order('name')
        setProjects(projData || [])
    }

    useEffect(() => {
        if (isOpen) {
            fetchData()
        }

        if (productToEdit) {
            setFormData({
                name: productToEdit.name,
                sku: productToEdit.sku || '',
                category_id: productToEdit.category_id || '',
                project_id: productToEdit.project_id || '',
                quantity: productToEdit.quantity,
                price: productToEdit.price,
                min_stock_level: productToEdit.min_stock_level,
                description: productToEdit.description || ''
            })
        } else {
            setFormData({
                name: '',
                sku: '',
                category_id: '',
                project_id: '',
                quantity: 0,
                price: 0,
                min_stock_level: 5,
                description: ''
            })
        }
    }, [productToEdit, isOpen])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (productToEdit) {
                const { error } = await supabase
                    .from('products')
                    .update(formData)
                    .eq('id', productToEdit.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([formData])
                if (error) throw error
            }
            onProductSaved()
            onClose()
        } catch (error) {
            alert(t('common.error') + ': ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {productToEdit ? t('common.editProduct') : t('common.createProduct')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('common.productName')}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t('products.name')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('common.sku')}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="e.g. WM-001"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('products.category')}
                            </label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">{t('products.selectCategory')}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('products.project')}
                            </label>
                            <select
                                value={formData.project_id}
                                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">{t('products.selectProject')}</option>
                                {projects.map(proj => (
                                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('products.price')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('common.minStockLevel')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.min_stock_level}
                                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('common.description')}
                            </label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            {productToEdit ? t('common.saveChanges') : t('common.createProduct')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
