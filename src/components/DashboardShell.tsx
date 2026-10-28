'use client';

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';

function DashboardShellContent({ children }: { children: React.ReactNode }) {
  const {
    activeSection,
    isSidebarCollapsed,
    toggleSidebar,
    isLoading,
    lastUpdated,
    triggerReload
  } = useDashboard();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Top Header */}
      <Header
        activeSection={activeSection}
        onReload={triggerReload}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
      />

      {/* Main Body with Sidebar & Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 65px)', position: 'relative' }}>
        {/* Left Section: Sidebar with Next.js Link routing */}
        <Sidebar
          activeSection={activeSection}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        {/* Right Section: Page Content with Responsive Padding */}
        <main className="app-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShellContent>{children}</DashboardShellContent>
    </DashboardProvider>
  );
}
