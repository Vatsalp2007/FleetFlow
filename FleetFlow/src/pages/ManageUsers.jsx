import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp, onSnapshot, collection, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import MainLayout from '../components/MainLayout';

// Firebase configuration for secondary instance
const firebaseConfig = {
  apiKey: "AIzaSyAiGhZX3DW_ajNHhEl6vuKr-rrYppYKHSM",
  authDomain: "fleet-flow-868a4.firebaseapp.com",
  projectId: "fleet-flow-868a4",
  storageBucket: "fleet-flow-868a4.firebasestorage.app",
  messagingSenderId: "947727527739",
  appId: "1:947727527739:web:eef56a1e4d0cb0d4e4911e"
};

const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

const ManageUsers = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const metrics = {
    total: users.length,
    managers: users.filter(u => u.role === 'manager').length,
    dispatchers: users.filter(u => u.role === 'dispatcher').length
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUser = userCredential.user;

      await setDoc(doc(db, "users", newUser.uid), {
        email: email,
        role: "dispatcher",
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });

      await secondarySignOut(secondaryAuth);

      setMessage({ type: 'success', text: `Dispatcher created successfully!` });
      setEmail("");
      setPassword("");
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error("Error creating user:", error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.email}? This action only removes their access in our records.`)) {
      try {
        await deleteDoc(doc(db, "users", user.id));
        setMessage({ type: 'success', text: `User removed successfully.` });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error("Error deleting user:", error);
        setMessage({ type: 'error', text: "Failed to delete user." });
      }
    }
  };

  return (
    <MainLayout title="User Management" breadcrumb="System / Access">
      <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-20">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-[#2B3674]">User Management</h1>
          <p className="text-sm font-bold text-slate-400">Manage access and roles for your team</p>
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Users</p>
              <h3 className="text-2xl font-black text-[#2B3674]">{metrics.total}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Managers</p>
              <h3 className="text-2xl font-black text-[#2B3674]">{metrics.managers}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Dispatchers</p>
              <h3 className="text-2xl font-black text-[#2B3674]">{metrics.dispatchers}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="xl:col-span-1">
            <div className="glass-card p-8 shadow-xl">
              <h2 className="text-lg font-black text-[#2B3674] mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_add</span>
                Add Dispatcher
              </h2>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-[#2B3674] ml-1">Account Email</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@fleetflow.com"
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-[#2B3674] ml-1">Initial Password</label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>

                {message.text && (
                  <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    message.type === 'error' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-primary/5 text-primary border-primary/10'
                  }`}>
                    {message.text}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : "Create Dispatcher Account"}
                </button>
              </form>
            </div>
          </div>

          {/* Users Table */}
          <div className="xl:col-span-2">
            <div className="glass-card shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center text-lg font-black text-[#2B3674]">
                Team Directory
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#F4F7FE] px-3 py-1 rounded-full">{users.length} Active</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#F4F7FE]">
                    <tr>
                      <th className="px-6 py-4">Account Holder</th>
                      <th className="px-6 py-4">Permission Level</th>
                      <th className="px-6 py-4">Onboarding Date</th>
                      <th className="px-6 py-4 text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#2B3674]">{user.email}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">UID: {user.id.substring(0, 10)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            user.role === 'manager' 
                              ? 'bg-blue-50 text-blue-600 border-blue-100' 
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-500">
                            {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'System'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {user.role === 'dispatcher' && user.id !== currentUser.uid && (
                            <button 
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                              title="Revoke Access"
                            >
                              <span className="material-symbols-outlined !text-lg">delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ManageUsers;
