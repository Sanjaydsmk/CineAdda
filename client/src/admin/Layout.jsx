import React from 'react';
import AdminNavbar from '../components/admin/AdminNavbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Outlet } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Loading from '../components/Loading';

const Layout = () => {
  const {isAdmin} = useAppContext();
  
  if (isAdmin === null) return <Loading />;
  if (!isAdmin) return <div>Access Denied</div>;
  return (
    <>
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Layout;
