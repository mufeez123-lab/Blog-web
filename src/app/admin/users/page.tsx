"use client";

import React, { useEffect, useState } from "react";
import { Users, UserPlus } from "lucide-react";
import type { UserRole } from "@/types";

interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("AUTHOR");
  const [title, setTitle] = useState("Staff Writer");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, title, bio }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to create user.");
      return;
    }
    setMessage(`Created staff account for ${email} (${role}).`);
    setName("");
    setEmail("");
    setPassword("");
    setBio("");
    loadUsers();
  };

  const handleRoleChange = async (userId: string, nextRole: UserRole) => {
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: nextRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update user role.");
      return;
    }
    loadUsers();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-[#da3036]" />
          Editorial Staff &amp; Role Management
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Restricted to Administrators. Manage ADMIN, EDITOR, and AUTHOR
          accounts. Password hashes are never exposed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Add Editorial User
          </h2>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded">
              {message}
            </div>
          )}
          <form onSubmit={handleCreateUser} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Strong Password (min 10 chars, upper/lower/number) *
              </label>
              <input
                type="password"
                required
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="AUTHOR">
                  AUTHOR (Draft &amp; Submit for Review only)
                </option>
                <option value="EDITOR">
                  EDITOR (Approve, Publish &amp; Manage Taxonomy)
                </option>
                <option value="ADMIN">
                  ADMIN (Full Platform &amp; Settings Control)
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Job Title / Desk
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Author Bio
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md inline-flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Staff Account</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 font-serif font-bold text-slate-900">
            Registered Staff Accounts ({users.length})
          </div>
          <div className="divide-y divide-slate-200">
            {users.map((u) => (
              <div
                key={u._id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-slate-900">{u.name}</div>
                  <div className="text-xs text-slate-500">
                    {u.email} &bull; {u.title || "Editorial Staff"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      handleRoleChange(u._id, e.target.value as UserRole)
                    }
                    className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white"
                  >
                    <option value="AUTHOR">AUTHOR</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
