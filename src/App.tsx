import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import InvoiceList from "@/pages/InvoiceList";
import InvoiceEditor from "@/pages/InvoiceEditor";
import InvoicePreview from "@/pages/InvoicePreview";
import CustomersPage from "@/pages/CustomersPage";
import BusinessProfilesPage from "@/pages/BusinessProfilesPage";
import ProductsPage from "@/pages/ProductsPage";
import TranslationsPage from "@/pages/TranslationsPage";
import TaxSettingsPage from "@/pages/TaxSettingsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/new" element={<InvoiceEditor />} />
            <Route path="/invoices/:id/edit" element={<InvoiceEditor />} />
            <Route path="/invoices/:id/preview" element={<InvoicePreview />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/business-profiles" element={<BusinessProfilesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/translations" element={<TranslationsPage />} />
            <Route path="/tax-settings" element={<TaxSettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
