import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Dark/Light theme persist logic
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const isActive = (path) => location.pathname === path;

  // Sidebar links conforming to reference layout: Dashboard, POS, Inventory, Transactions, Settings
  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: 'grid_view', adminOnly: true },
    { path: '/pos', label: 'Cashier POS', icon: 'shopping_cart', adminOnly: false },
    { path: '/transactions', label: 'Transactions', icon: 'receipt', adminOnly: true },
    { path: '/inventory', label: 'Inventory', icon: 'inventory_2', adminOnly: true },
    { path: '/settings', label: 'Settings', icon: 'settings', adminOnly: false },
  ];

  const handleLinkClick = (e, link) => {
    // If cashier clicks adminOnly links, prevent default behavior and alert them
    if (link.adminOnly && user?.role !== 'admin') {
      e.preventDefault();
      alert('Access Denied: You do not have permissions to access this screen.');
    }
  };

  return (
    <aside className="bg-card border-r border-border fixed left-0 top-0 h-full w-[260px] flex flex-col py-6 z-50 transition-all duration-200">
      
      {/* Brand Header */}
      <div 
        onClick={() => navigate('/pos')}
        className="px-6 mb-6 flex items-center gap-3.5 cursor-pointer select-none"
      >
        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm transition-colors duration-200">
          {/* Custom style for logo circle to remain red in light mode and white in dark mode */}
          <span className="material-symbols-outlined text-2xl font-bold">storefront</span>
        </div>
        <div>
          <h1 className="text-body-lg font-bold text-foreground leading-none font-sans">
            Emerald POS
          </h1>
          <p className="text-muted-foreground text-xs mt-1 font-bold">
            RetailOS · v2.4
          </p>
        </div>
      </div>

      {/* Dark Mode toggle button container matching screenshots */}
      <div className="px-4 mb-8">
        <div 
          onClick={toggleDarkMode}
          className="flex items-center justify-between px-4 py-2.5 bg-transparent border border-border text-foreground hover:bg-accent/30 transition-all rounded-full w-full cursor-pointer hover:-translate-y-0.5 duration-200 select-none"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary transition-transform duration-300">
              {isDarkMode ? 'dark_mode' : 'light_mode'}
            </span>
            <span className="text-body-md font-bold text-foreground">
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-200'} flex items-center relative cursor-pointer`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </div>
      </div>

      {/* MENU label */}
      <div className="px-6 mb-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          MENU
        </span>
      </div>

      {/* Navigation Links */}
      <ul className="flex flex-col gap-1.5 w-full px-3">
        {navLinks.map((link) => {
          const active = isActive(link.path);
          const isRestricted = link.adminOnly && user?.role !== 'admin';

          return (
            <li key={link.path}>
              <Link
                to={isRestricted ? '#' : link.path}
                onClick={(e) => handleLinkClick(e, link)}
                className={`flex items-center justify-between px-5 py-3 transition-all rounded-full group hover:-translate-y-0.5 duration-200 ${
                  active
                    ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/10'
                    : isRestricted
                    ? 'text-muted-foreground/60 cursor-not-allowed bg-transparent'
                    : 'text-foreground hover:bg-accent/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span 
                    className="material-symbols-outlined text-[22px] transition-transform duration-150 group-hover:scale-105"
                  >
                    {link.icon}
                  </span>
                  <span className="text-body-md font-bold">
                    {link.label}
                  </span>
                </div>
                
                {/* Lock icon display matching the user's privilege */}
                {isRestricted && (
                  <span className="material-symbols-outlined text-sm text-muted-foreground/70 font-bold">
                    lock
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Bottom Actions and Active User Info */}
      <div className="mt-auto px-4">
        {/* User profile capsule conforming to reference */}
        <div className="flex items-center justify-between p-4 bg-secondary rounded-[2rem] border border-border transition-all shadow-sm mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-extrabold font-sans text-body-lg shadow-sm">
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'DL'}
            </div>
            <div className="overflow-hidden">
              <p className="text-body-md text-foreground truncate font-bold leading-tight">
                {user?.fullName || 'Dewi Lestari'}
              </p>
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary mt-1.5">
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-accent/40"
            title="Logout"
            aria-label="Logout"
          >
            <span className="material-symbols-outlined text-xl">
              logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
