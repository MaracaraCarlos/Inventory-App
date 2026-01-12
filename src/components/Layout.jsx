import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
    LayoutDashboard,
    Package,
    History,
    LogOut,
    Menu,
    X,
    Globe,
    Moon,
    Sun,
    FileText,
    BarChart3
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useLanguage } from '../lib/LanguageContext'
import { useTheme } from '../lib/ThemeContext'

const SidebarItem = ({ icon: Icon, label, path, onClick }) => {
    const location = useLocation()
    const isActive = location.pathname === path

    return (
        <Link
            to={path}
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-700 dark:hover:text-blue-400'
            )}
        >
            <Icon
                size={20}
                className={cn(
                    'transition-colors',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                )}
            />
            <span className="font-medium">{label}</span>
        </Link>
    )
}

export default function Layout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    const { t, language, setLanguage } = useLanguage()
    const { theme, toggleTheme } = useTheme()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserEmail(user.email)
            }
        }
        getUser()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'es' : 'en')
    }

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
        { icon: Globe, label: t('nav.projects'), path: '/projects' },
        { icon: Package, label: t('nav.products'), path: '/products' },
        { icon: History, label: t('nav.movements'), path: '/movements' },
        { icon: FileText, label: t('nav.reports'), path: '/reports' },
        { icon: BarChart3, label: t('nav.charts'), path: '/charts' },
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex transition-colors duration-200">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {t('nav.appTitle')}
                        </h1>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    {userEmail && (
                        <p className="text-xs text-gray-400 mb-8 truncate" title={userEmail}>
                            {userEmail}
                        </p>
                    )}
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            {...item}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    ))}
                </nav>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all font-medium group"
                    >
                        {theme === 'dark' ? (
                            <Sun size={20} className="text-gray-400 group-hover:text-yellow-500 transition-colors" />
                        ) : (
                            <Moon size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                        )}
                        <span className="group-hover:text-gray-900 dark:group-hover:text-gray-200">
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>

                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-all font-medium group"
                    >
                        <Globe size={20} className="text-gray-400 group-hover:text-blue-600" />
                        <span className="group-hover:text-gray-900 dark:group-hover:text-gray-200">{language === 'en' ? 'Español' : 'English'}</span>
                    </button>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-all font-medium group"
                    >
                        <LogOut size={20} className="text-gray-400 group-hover:text-red-600" />
                        <span>{t('nav.signOut')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 lg:hidden sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm transition-colors duration-200">
                    <span className="font-bold text-lg dark:text-white">{t('nav.appTitle')}</span>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                </header>

                <div className="p-6 lg:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
                    {children}
                </div>
            </main>
        </div>
    )
}
