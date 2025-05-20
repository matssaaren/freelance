// src/components/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from './ChatWidget';
import './Layout.css';

function Layout() {
  return (
    <div className="app-wrapper">
      <Header />
      <main className="app-main">
        <Outlet />
      </main>

      {/* Floating chat panel */}
      <ChatWidget />

      <Footer />
    </div>
  );
}

export default Layout;
