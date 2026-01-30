import { useState, useEffect } from 'react'
import { X, Trash2, Plus, Loader2 } from 'lucide-react'
import { categoryRepository } from '../repositories/categoryRepository'
import { useLanguage } from '../lib/LanguageContext'

export default function CategoryManager({ isOpen, onClose, onCategoryChange }) {
    const { t } = useLanguage()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [newCategory, setNewCategory] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetchCategories = async () => {
        try {
            const { data, error } = await categoryRepository.getAllCategories()

            if (error) throw error
            setCategories(data || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchCategories()
        }
    }, [isOpen])

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!newCategory.trim()) return

        setSubmitting(true)
        try {
            const { error } = await categoryRepository.createCategory({ name: newCategory.trim() })

            if (error) throw error

            setNewCategory('')
            fetchCategories()
            onCategoryChange?.()
        } catch (error) {
            alert(t('categories.createError'))
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm(t('categories.deleteConfirm'))) return

        try {
            // Check if used - need to import productRepository for this
            const { supabase } = await import('../lib/supabase')
            const { count, error: checkError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', id)

            if (checkError) throw checkError

            if (count > 0) {
                alert(t('categories.inUseError'))
                return
            }

            const { error } = await categoryRepository.deleteCategory(id)

            if (error) throw error
            fetchCategories()
            onCategoryChange?.()
        } catch (error) {
            alert(t('categories.deleteError'))
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl transition-all">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('categories.title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder={t('categories.placeholder')}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newCategory.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                        </button>
                    </form>

                    <div className="space-y-2">
                        {loading ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('common.loading')}</p>
                        ) : categories.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">No categories found</p>
                        ) : (
                            categories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg group">
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{cat.name}</span>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
