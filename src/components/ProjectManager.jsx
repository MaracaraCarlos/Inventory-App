import { useState, useEffect } from 'react'
import { X, Trash2, Plus, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'

export default function ProjectManager({ isOpen, onClose, onProjectChange }) {
    const { t } = useLanguage()
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [newProject, setNewProject] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('name')

            if (error) throw error
            setProjects(data || [])
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchProjects()
        }
    }, [isOpen])

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!newProject.trim()) return

        setSubmitting(true)
        try {
            const { error } = await supabase
                .from('projects')
                .insert([{ name: newProject.trim() }])

            if (error) throw error

            setNewProject('')
            fetchProjects()
            onProjectChange?.()
        } catch (error) {
            alert(t('projects.createError'))
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm(t('projects.deleteConfirm'))) return

        try {
            // Check if used
            const { count, error: checkError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', id)

            if (checkError) throw checkError

            if (count > 0) {
                alert(t('projects.inUseError'))
                return
            }

            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchProjects()
            onProjectChange?.()
        } catch (error) {
            alert(t('projects.deleteError'))
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl transition-all">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('projects.title')}
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
                            value={newProject}
                            onChange={(e) => setNewProject(e.target.value)}
                            placeholder={t('projects.placeholder')}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newProject.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                        </button>
                    </form>

                    <div className="space-y-2">
                        {loading ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('common.loading')}</p>
                        ) : projects.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">No projects found</p>
                        ) : (
                            projects.map(proj => (
                                <div key={proj.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg group">
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{proj.name}</span>
                                    <button
                                        onClick={() => handleDelete(proj.id)}
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
