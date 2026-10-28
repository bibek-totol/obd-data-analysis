'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ActiveSection } from '@/components/Sidebar';

interface DashboardContextType {
  activeSection: ActiveSection;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  lastUpdated: string;
  setLastUpdated: (time: string) => void;
  registerReload: (fn: () => void) => void;
  triggerReload: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const reloadFnRef = useRef<(() => void) | null>(null);

  // Derive active section from the current URL pathname
  let activeSection: ActiveSection = 'forecast';
  if (pathname.startsWith('/advisory')) {
    activeSection = 'advisory';
  } else if (pathname.startsWith('/bmd')) {
    activeSection = 'bmd-forecast';
  } else if (pathname.startsWith('/bamis')) {
    activeSection = 'bamis-bulletin';
  } else if (pathname.startsWith('/forecast')) {
    activeSection = 'forecast';
  }

  // Automatically close mobile navigation drawer whenever route pathname changes
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  const registerReload = useCallback((fn: () => void) => {
    reloadFnRef.current = fn;
  }, []);

  const triggerReload = useCallback(() => {
    if (reloadFnRef.current) {
      reloadFnRef.current();
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const toggleMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(prev => !prev);
  }, []);

  const closeMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(false);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        activeSection,
        isSidebarCollapsed,
        toggleSidebar,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        toggleMobileDrawer,
        closeMobileDrawer,
        isLoading,
        setIsLoading,
        lastUpdated,
        setLastUpdated,
        registerReload,
        triggerReload
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
