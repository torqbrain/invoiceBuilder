import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Users, Building2, Settings, Globe, Receipt, ChevronLeft, ChevronRight, Package, Menu
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import AppFooter from "@/components/AppFooter";
import BusinessSwitcher from "@/components/BusinessSwitcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  // Hide sidebar on invoice preview page
  const isPreviewPage = location.pathname.includes("/preview");
  if (isPreviewPage) return <>{children}</>;

  const navLinks = navItems.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === "/"}
      onClick={() => setMobileNavOpen(false)}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  ));

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "no-print hidden bg-sidebar text-sidebar-foreground md:flex md:flex-col border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
          <FileText className="h-6 w-6 text-sidebar-primary shrink-0" />
          {!collapsed && <span className="font-semibold text-lg tracking-tight">InvoiceHub</span>}
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
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
          <div className="no-print mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3 md:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <span className="font-semibold tracking-tight">InvoiceHub</span>
              </div>
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Open navigation menu">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[84vw] max-w-sm bg-sidebar p-0 text-sidebar-foreground">
                  <div className="border-b border-sidebar-border px-5 py-4">
                    <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
                      <FileText className="h-5 w-5 text-sidebar-primary" />
                      <span>InvoiceHub</span>
                    </SheetTitle>
                  </div>
                  <nav className="space-y-1 px-3 py-4">
                    {navLinks}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BusinessSwitcher />
              <Button variant="outline" onClick={() => signOut()} className="w-full sm:w-auto">
                Sign Out
              </Button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-6 pt-0 sm:px-6">{children}</div>
          <AppFooter className="no-print px-4 pb-6 sm:px-6" />
        </div>
      </main>
    </div>
  );
}
