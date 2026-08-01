"use client"

import { useState } from 'react'
import ChatInterface from '../components/chat/ChatInterface'
import ChatHistorySidebar from '../components/chat/ChatHistorySidebar'
import GlobalSearchToggle from '../components/chat/GlobalSearchToggle'
import UploadZone from '../components/chat/UploadZone'
import WelcomeScreen from '../components/welcome-screen'
import { twMerge } from 'tailwind-merge'

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
}

export default function Home() {
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [isGlobalSearchEnabled, setIsGlobalSearchEnabled] = useState(false)

  const handleFilesSelected = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      progress: 0
    }))
    setFiles(prev => [...prev, ...newFiles])
    setShowWelcome(false)
  }

  const handleUpload = async () => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f.file))

      const response = await fetch('http://localhost:8000/rag/ingest', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      setFiles(prev => prev.map(f => ({
        ...f,
        status: 'completed',
        progress: 100
      })))
    } catch (error) {
      setFiles(prev => prev.map(f => ({
        ...f,
        status: 'error'
      })))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSearchToggle = (enabled: boolean) => {
    setIsGlobalSearchEnabled(enabled)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M6 17v-3m12 0v-3M3 7v3m0 0h18m-3-3v3m-6-6v6m-3-3h6" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Document Assistant</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload, search, and chat with your documents</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearchToggle onSearchToggle={handleSearchToggle} />
            <button
              onClick={() => setIsChatHistoryOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">History</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {files.length === 0 && showWelcome ? (
          <WelcomeScreen />
        ) : (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Documents</h2>
              <UploadZone onFilesSelected={handleFilesSelected} isLoading={isUploading} />
              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Selected Files ({files.length})
                    </h3>
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {isUploading ? 'Uploading...' : 'Upload & Process'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                      <div key={file.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                            {file.file.name}
                          </span>
                          <span
                            className={twMerge(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              file.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                              file.status === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                              file.status === 'uploading' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                              file.status === 'pending' && 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                            )}
                          >
                            {file.status}
                          </span>
                        </div>
                        {file.status === 'uploading' && (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Chat with Documents</h2>
              <ChatInterface apiUrl="http://localhost:8000/rag/ask" />
            </div>
          </div>
        )}
      </main>

      <ChatHistorySidebar
        isOpen={isChatHistoryOpen}
        onClose={() => setIsChatHistoryOpen(false)}
      />
    </div>
  )
}
