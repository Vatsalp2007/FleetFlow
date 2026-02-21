import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Double check Firestore document exists for the redirected user
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          navigate("/dashboard");
        } else {
          setError("Access not authorized.");
          await signOut(auth);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (!userDoc.exists()) {
        await signOut(auth);
        setError("Access not authorized.");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid credentials or unauthorized access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <div className="relative flex h-full min-h-screen w-full flex-col items-center justify-center p-4">
        {/* Main Container */}
        <div className="w-full max-w-[440px] flex flex-col items-stretch">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-8"> 
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">FleetFlow</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to your enterprise account</p>
          </div>

          {/* Login Form */}
          <div className="bg-white dark:bg-slate-900/50 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <form className="flex flex-col gap-5" onSubmit={handleAuth}>
              
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                <div className="relative group">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400" 
                    placeholder="name@company.com" 
                    required 
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                </div>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 flex items-center gap-2">
                  <span className="material-symbols-outlined !text-lg">error</span>
                  {error}
                </div>
              )}

              {/* Primary Action */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed" 
              >
                <span>{loading ? "Authenticating..." : "Sign In"}</span>
                {!loading && <span className="material-symbols-outlined !text-[20px]">arrow_forward</span>}
              </button>
            </form>

            {/* Support Link */}
            <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-800">
               <p className="text-sm text-slate-500">Contact your administrator for account access.</p>
            </div>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
