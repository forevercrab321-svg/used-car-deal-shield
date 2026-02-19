import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Upload } from './pages/Upload';
import { Preview } from './pages/Preview';
import { Paywall } from './pages/Paywall';
import { Report } from './pages/Report';
import { History } from './pages/History';
import { Account } from './pages/Account';
import { AdminLogin } from './pages/AdminLogin';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/preview/:dealId" element={<Preview />} />
          <Route path="/paywall/:dealId" element={<Paywall />} />
          <Route path="/report/:dealId" element={<Report />} />
          <Route path="/history" element={<History />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;