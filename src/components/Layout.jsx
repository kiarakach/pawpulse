import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import ProfileGate from './ProfileGate';

export default function Layout() {
  return (
    <>
      <ProfileGate />
      <SideNav />
      <div className="min-h-screen max-w-2xl mx-auto px-4 pt-5 pl-28">
        <Outlet />
      </div>
    </>
  );
}