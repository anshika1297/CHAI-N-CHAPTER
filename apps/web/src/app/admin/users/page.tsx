'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, type AdminUserDto } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

const DUMMY_USERS: AdminUserDto[] = [
  {
    id: 'dummy-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'Super Admin',
    createdAt: '2024-01-15',
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDto[]>(DUMMY_USERS);
  const [loading, setLoading] = useState(true);
  const [useBackend, setUseBackend] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
  });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { users: list } = await getUsers();
      setUsers(list.length ? list : DUMMY_USERS);
      setUseBackend(true);
    } catch {
      setUsers(DUMMY_USERS);
      setUseBackend(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (editingUser) {
        if (editingUser.id.startsWith('dummy-')) {
          setMessage({
            type: 'error',
            text: "Can't edit placeholder. Add a new user to create one on the backend.",
          });
          setSaving(false);
          return;
        }
        if (useBackend) {
          await updateUser(editingUser.id, {
            name: formData.name,
            role: formData.role,
            ...(formData.password ? { password: formData.password } : {}),
          });
          setMessage({ type: 'success', text: 'User updated.' });
        } else {
          setMessage({ type: 'error', text: 'Backend not connected. Sign in and ensure the API is running.' });
          setSaving(false);
          return;
        }
      } else if (useBackend) {
        await createUser({
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
          role: formData.role || 'Admin',
        });
        setMessage({ type: 'success', text: 'User created.' });
      } else {
        setMessage({
          type: 'error',
          text: 'Backend not connected. Start the API and sign in to add users.',
        });
        setSaving(false);
        return;
      }
      setFormData({ name: '', email: '', password: '', role: 'Admin' });
      setShowForm(false);
      setEditingUser(null);
      await loadUsers();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Request failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: AdminUserDto) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role || 'Admin',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin user?')) return;
    if (id.startsWith('dummy-')) {
      setUsers(users.filter((u) => u.id !== id));
      return;
    }
    if (!useBackend) {
      setMessage({ type: 'error', text: 'Backend not connected. Sign in and ensure the API is running.' });
      return;
    }
    setMessage(null);
    try {
      await deleteUser(id);
      setMessage({ type: 'success', text: 'User deleted.' });
      await loadUsers();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Delete failed' });
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  if (loading) {
    return <PageLoading message="Loading users…" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Admin Users
          </h1>
          <p className="font-body text-chai-brown-light">
            Manage admin accounts and permissions
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'Admin' });
          }}
          className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
        >
          <Plus size={20} />
          Add Admin User
        </button>
      </div>

      {!useBackend && (
        <div className="mb-6 px-4 py-3 rounded-lg font-body text-sm bg-amber-50 text-amber-800 border border-amber-200">
          Showing placeholder data. Sign in and ensure the API is running to load and save users from the backend.
        </div>
      )}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg font-body text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="font-serif text-2xl text-chai-brown mb-4">
              {editingUser ? 'Edit Admin User' : 'Add Admin User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body disabled:opacity-60"
                />
                {editingUser && (
                  <p className="text-xs text-chai-brown-light mt-1">Email cannot be changed.</p>
                )}
              </div>
              {!editingUser && (
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
              )}
              {editingUser && (
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    New password (leave blank to keep)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
              )}
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                >
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingUser ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 bg-gray-200 text-chai-brown py-2 rounded-lg hover:bg-gray-300 transition-colors font-body"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Created
                </th>
                <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chai-brown/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3 font-body text-chai-brown">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 font-body text-chai-brown-light">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 font-body text-chai-brown-light">
                    {user.role}
                  </td>
                  <td className="px-4 py-3 font-body text-chai-brown-light text-sm">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-terracotta hover:bg-terracotta/10 rounded transition-colors"
                        aria-label="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="px-4 py-12 text-center font-body text-chai-brown-light">
            No users yet. Click “Add Admin User” to create one.
          </div>
        )}
      </div>
    </div>
  );
}
