import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
    // Try to get language from localStorage, default to 'en'
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('app_language')
        return saved || 'en'
    })

    useEffect(() => {
        localStorage.setItem('app_language', language)
    }, [language])

    const t = (key) => {
        const keys = key.split('.')
        let value = translations[language]

        for (const k of keys) {
            if (value && value[k]) {
                value = value[k]
            } else {
                return key // Return key if translation not found
            }
        }

        return value
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
