import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, List, LogOut, PiggyBank, Tags, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transacciones", label: "Transacciones", icon: List },
  { to: "/presupuestos", label: "Presupuestos", icon: PiggyBank },
  { to: "/categorias", label: "Categorías", icon: Tags },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[--gridline] bg-[--surface-1] p-4">
        <div className="mb-8 flex items-center gap-2 px-2 text-lg font-semibold">
          <Wallet className="size-6 text-[#2a78d6]" aria-hidden />
          Presupuestador
        </div>
        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-[#2a78d6]/10 font-medium text-[#1c5cab]"
                    : "text-[--ink-secondary] hover:bg-black/5"
                }`
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-[--gridline] pt-4">
          <p className="truncate px-2 text-sm font-medium">{user?.name}</p>
          <p className="truncate px-2 text-xs text-[--ink-muted]">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-[--ink-secondary] hover:bg-black/5"
          >
            <LogOut className="size-4" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
