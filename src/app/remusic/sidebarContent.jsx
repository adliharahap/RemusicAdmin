"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, 
  X, 
  ChevronDown, 
  Sun, 
  Moon, 
  Laptop, 
  MoreVertical,
  ChevronRight,
  Settings
} from "lucide-react";
import { logout } from "../../../utils/handleLogout"; // Sesuaikan path utils Anda

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// --- Komponen Item Menu ---
const MenuItem = ({ item, pathname, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Cek apakah halaman aktif berada di dalam submenu ini
  const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));
  const isChildActive = pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;

  // Auto expand jika anak aktif
  useEffect(() => {
    if (isActive && hasChildren) {
      setIsOpen(true);
    }
  }, [isActive, hasChildren]);

  const Icon = item.icon;

  if (hasChildren) {
    return (
      <li className="mb-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={classNames(
            isActive 
              ? 'bg-indigo-50/10 text-indigo-400 dark:text-indigo-400' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white',
            'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200'
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className={classNames(isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300', "h-5 w-5 shrink-0 transition-colors")} />}
            <span>{item.name}</span>
          </div>
          <ChevronRight 
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
          />
        </button>

        {/* Submenu Animation */}
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden pl-4 mt-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4"
            >
              {item.children.map((child) => (
                <MenuItem key={child.name} item={child} pathname={pathname} depth={depth + 1} />
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </li>
    );
  }

  return (
    <li className="mb-1">
      <Link
        href={item.href}
        className={classNames(
          isChildActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white',
          'group flex gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden'
        )}
      >
        {isChildActive && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute inset-0 bg-indigo-600 z-[-1]"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        {Icon && <Icon className={classNames(isChildActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300', "h-5 w-5 shrink-0")} aria-hidden="true" />}
        {item.name}
      </Link>
    </li>
  );
};

// --- Komponen Theme Switcher Dropdown ---
const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // Close click outside
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themes = [
    { name: 'Light', value: 'light', icon: Sun },
    { name: 'Dark', value: 'dark', icon: Moon },
    { name: 'System', value: 'system', icon: Laptop },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
      >
        <span className="sr-only">Toggle theme</span>
        {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 w-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161922] shadow-xl p-1 z-50 overflow-hidden"
          >
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
                className={classNames(
                  theme === t.value 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5',
                  'flex w-full items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors'
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Sidebar Component ---
export default function SidebarContent({ navigation, user, onClose }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-[#0F1117] px-6 pb-4 border-r border-slate-200 dark:border-white/5 transition-colors duration-300">
      
      {/* Header / Logo */}
      <div className="flex h-20 shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                R
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            ReMusic<span className="text-indigo-500">.</span>
            </h1>
        </div>
        <button
          type="button"
          className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white lg:hidden transition-colors"
          onClick={onClose}
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => (
            <MenuItem key={item.name} item={item} pathname={pathname} />
          ))}

          <li className="mt-auto pt-6 border-t border-slate-200 dark:border-white/5">
             <div className="flex items-center justify-between mb-2">
                 <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-600 px-2">Settings</p>
             </div>
             
             {/* Logout Button */}
             <button
                onClick={logout}
                className="group flex w-full gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
            >
                <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Footer: User & Theme */}
      <div className="mt-2 flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
        <img
          className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"
          src={user?.photo_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "https://i.pinimg.com/736x/f7/5c/b4/f75cb4ad9e644fa76c199b94c7c5877e.jpg"}
          alt="User profile"
        />

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">
            {user?.display_name || user?.user_metadata?.full_name || "Unknown user"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
             {user?.role || "User"}
          </p>
        </div>

        {/* Theme Toggle Button */}
        <ThemeSwitcher />
      </div>
    </div>
  );
}