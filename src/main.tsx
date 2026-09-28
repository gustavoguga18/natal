import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TvPage } from '@/pages/TvPage'
import { AdminPage } from '@/pages/AdminPage'
import { LobbyPage } from '@/pages/LobbyPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/tv" element={<TvPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
