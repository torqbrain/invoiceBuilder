import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Users, Building2, Settings, Globe, Receipt, ChevronLeft, ChevronRight, Package
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import AppFooter from "@/components/AppFooter";
import BusinessSwitcher from "@/components/BusinessSwitcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/business-profiles", icon: Building2, label: "Business Profiles" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/translations", icon: Globe, label: "Translations" },
  { to: "/tax-settings", icon: Receipt, label: "Tax Settings" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  // Hide sidebar on invoice preview page
  const isPreviewPage = location.pathname.includes("/preview");
  if (isPreviewPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "no-print bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
          <FileText className="h-6 w-6 text-sidebar-primary shrink-0" />
          {!collapsed && <span className="font-semibold text-lg tracking-tight">InvoiceHub</span>}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen flex flex-col">
          <div className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between gap-4 no-print">
            <BusinessSwitcher />
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
          <div className="flex-1 p-6 pt-0 max-w-7xl mx-auto w-full">{children}</div>
          <AppFooter className="no-print px-6 pb-6" />
        </div>
      </main>
    </div>
  );
}
