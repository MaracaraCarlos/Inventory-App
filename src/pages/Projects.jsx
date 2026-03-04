import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Calendar, MapPin, Loader2, X, AlertTriangle } from 'lucide-react'
import { projectRepository } from '../repositories/projectRepository'
import { authRepository } from '../repositories/authRepository'
import { useLanguage } from '../lib/LanguageContext'
import { cn } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import ProjectFormModal from '../components/ProjectFormModal'

export default function Projects() {
    const { t } = useLanguage()
    const { item } = useAuth()
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProject, setEditingProject] = useState(null)
    const navigate = useNavigate()

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState(null)
    const [deleteEmail, setDeleteEmail] = useState('')
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteError, setDeleteError] = useState('')
    const [deleteLoading, setDeleteLoading] = useState(false)

    const fetchProjects = async () => {
        setLoading(true)
        try {
            const { data, error } = await projectRepository.getAllProjects()

            if (error) throw error
            const centralWarehouse = {
                id: 'central-warehouse',
                name: 'Almacén Central',
                location: 'Principal',
                start_date: null,
                end_date: null,
                is_virtual: true
            }

            setProjects([centralWarehouse, ...(data || [])])
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    const openDeleteModal = (project) => {
        setProjectToDelete(project)
        setDeleteEmail('')
        setDeletePassword('')
        setDeleteError('')
        setDeleteModalOpen(true)
    }

    const closeDeleteModal = () => {
        setDeleteModalOpen(false)
        setProjectToDelete(null)
        setDeleteEmail('')
        setDeletePassword('')
        setDeleteError('')
    }

    const handleDeleteConfirm = async (e) => {
        e.preventDefault()
        if (!projectToDelete) return

        setDeleteLoading(true)
        setDeleteError('')

        try {
            // Verify user credentials
            const { error: authError } = await authRepository.signIn(deleteEmail, deletePassword)

            if (authError) {
                setDeleteError(t('projects.authError'))
                setDeleteLoading(false)
                return
            }

            // Check if project is in use
            const { count, error: checkError } = await projectRepository.checkProjectInUse(projectToDelete.id)

            if (checkError) throw checkError

            if (count > 0) {
                setDeleteError(t('projects.inUseError'))
                setDeleteLoading(false)
                return
            }

            // Delete the project
            const { error } = await projectRepository.deleteProject(projectToDelete.id)

            if (error) throw error

            closeDeleteModal()
            fetchProjects()
        } catch (error) {
            setDeleteError(t('projects.deleteError'))
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleEdit = (project) => {
        setEditingProject(project)
        setIsModalOpen(true)
    }

    const handleAddNew = () => {
        setEditingProject(null)
        setIsModalOpen(true)
    }

    const handleProjectClick = (projectId) => {
        // Navigate to Products page with filtered project
        navigate(`/products?project=${projectId}`)
    }

    const filteredProjects = projects.filter(proj =>
        proj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proj.location && proj.location.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('projects.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('projects.subtitle')}</p>
                </div>
                {item.canCreate && (
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        <span>{t('projects.add')}</span>
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t('projects.placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-4">{t('projects.name')}</th>
                                <th className="px-6 py-4">{t('projects.location')}</th>
                                <th className="px-6 py-4">{t('projects.startDate')}</th>
                                <th className="px-6 py-4">{t('projects.endDate')}</th>
                                <th className="px-6 py-4 text-right">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                                        {t('projects.loading')}
                                    </td>
                                </tr>
                            ) : filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        {t('projects.noProjects')}
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map(project => (
                                    <tr
                                        key={project.id}
                                        onClick={() => handleProjectClick(project.id)}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {project.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {project.location ? (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-gray-400" />
                                                    {project.location}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {project.start_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-gray-400" />
                                                    {new Date(project.start_date).toLocaleDateString()}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {project.end_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-gray-400" />
                                                    {new Date(project.end_date).toLocaleDateString()}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            {!project.is_virtual && (
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {item.canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(project)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                    )}
                                                    {item.canDelete && (
                                                        <button
                                                            onClick={() => openDeleteModal(project)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProjectFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                projectToEdit={editingProject}
                onProjectSaved={fetchProjects}
            />

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('projects.deleteConfirmTitle')}
                                </h3>
                            </div>
                            <button
                                onClick={closeDeleteModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleDeleteConfirm} className="p-6 space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                {t('projects.deleteAuthMessage')} <strong className="text-gray-900 dark:text-white">{projectToDelete?.name}</strong>
                            </p>

                            {deleteError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                    {deleteError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('projects.email')}
                                </label>
                                <input
                                    type="email"
                                    value={deleteEmail}
                                    onChange={(e) => setDeleteEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder={t('products.emailPlaceholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('projects.password')}
                                </label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {deleteLoading && <Loader2 className="animate-spin" size={18} />}
                                    {t('common.delete')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
