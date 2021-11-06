import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface Props {
  children: React.ReactElement;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="layout">
      <Navbar />
      <Sidebar />
      <div className="layout__wrapper">
        <div className="layout__container">
          <div className="layout__content">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
