import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import Health from '@/pages/Health';
import Routines from '@/pages/Routines';
import Community from '@/pages/Community';
import Nearby from '@/pages/Nearby';
import Coach from '@/pages/Coach';
import DietLogger from '@/pages/DietLogger';

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AppRoutes = () => {
  const { isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <Spinner />;

  // No login gate — the app is open to everyone and lands straight on Home.
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/health" element={<Health />} />
        <Route path="/diet" element={<DietLogger />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/routines" element={<Routines />} />
        <Route path="/community" element={<Community />} />
        <Route path="/nearby" element={<Nearby />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
