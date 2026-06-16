import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ThemeManager from './pages/ThemeManager';
import Typography from './pages/Typography';
import LayoutControls from './pages/LayoutControls';
import AnimationControls from './pages/AnimationControls';
import ContentBuilder from './pages/ContentBuilder';
import Projects from './pages/Projects';
import Education from './pages/Education';
import Experience from './pages/Experience';
import Messages from './pages/Messages';
import Bookings from './pages/Bookings';
import Media from './pages/Media';
import Database from './pages/Database';
import Analytics from './pages/Analytics';
import Security from './pages/Security';
import Backup from './pages/Backup';
import Deploy from './pages/Deploy';
import ApiKeys from './pages/ApiKeys';
import PageBuilder from './pages/PageBuilder';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="theme" element={<ThemeManager />} />
          <Route path="typography" element={<Typography />} />
          <Route path="layout" element={<LayoutControls />} />
          <Route path="animations" element={<AnimationControls />} />
          <Route path="content" element={<ContentBuilder />} />
          <Route path="pages" element={<PageBuilder />} />
          <Route path="projects" element={<Projects />} />
          <Route path="education" element={<Education />} />
          <Route path="experience" element={<Experience />} />
          <Route path="messages" element={<Messages />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="media" element={<Media />} />
          <Route path="database" element={<Database />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="security" element={<Security />} />
          <Route path="backup" element={<Backup />} />
          <Route path="deploy" element={<Deploy />} />
          <Route path="api-keys" element={<ApiKeys />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
