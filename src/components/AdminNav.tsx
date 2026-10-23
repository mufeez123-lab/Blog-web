"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FolderTree,
  Tags,
  Users,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import type { SessionUser } from "@/types";

interface AdminNavProps {
  user: SessionUser;
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      roles: ["ADMIN", "EDITOR", "AUTHOR"],
    },
    {
      label: "Articles",
      href: "/admin/articles",
      icon: FileText,
      roles: ["ADMIN", "EDITOR", "AUTHOR"],
    },
    {
      label: "New Article",
      href: "/admin/articles/new",
      icon: PlusCircle,
      roles: ["ADMIN", "EDITOR", "AUTHOR"],
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: FolderTree,
      roles: ["ADMIN", "EDITOR", "AUTHOR"],
    },
    {
      label: "Tags",
      href: "/admin/tags",
      icon: Tags,
      roles: ["ADMIN", "EDITOR", "AUTHOR"],
    },
    {
      label: "Users & Roles",
      href: "/admin/users",
      icon: Users,
      roles: ["ADMIN"],
    },
    {
      label: "Site & AdSense Settings",
      href: "/admin/settings",
      icon: Settings,
      roles: ["ADMIN"],
    },
  ];

  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider bg-blue-700 text-white px-2.5 py-1 rounded mr-2">
            Editorial CMS
          </span>
          {navItems
            .filter((item) => item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-4 text-xs border-t lg:border-t-0 border-slate-800 pt-2 lg:pt-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Signed in as:</span>
            <strong className="text-white">{user.name}</strong>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-400 font-semibold">
              {user.role}
            </span>
          </div>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
          >
            <span>View Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-200 font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
