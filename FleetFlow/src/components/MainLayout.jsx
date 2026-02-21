import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = ({ children, title, breadcrumb }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title={title} breadcrumb={breadcrumb} />
        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
