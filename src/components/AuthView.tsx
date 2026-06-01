/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  Sparkles,
  ShieldAlert,
  UserCheck,
  X,
  Plus
} from 'lucide-react';
import { User, SalonSettings } from '../types';
import { PRIMARY_LOGO_SVG } from './BrandLogos';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
  settings: SalonSettings;
}

interface SavedOperator {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Receptionist' | 'Manager' | 'Admin' | 'Cashier';
}

export default function AuthView({ onLoginSuccess, settings }: AuthViewProps) {
  const [step, setStep] = useState<'Login' | 'ForgotPassword' | 'SignUp'>('Login');
  
  // Login Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Register Form inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'Receptionist' | 'Manager' | 'Admin' | 'Cashier'>('Admin');

  // Recover form inputs
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  // Success messages
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    let targetEmail = email.trim().toLowerCase();
    // Support short-hands
    if (targetEmail === 'admin') {
      targetEmail = 'admin@belamour.com';
    } else if (targetEmail === 'cashier') {
      targetEmail = 'cashier@belamour.com';
    }

    const targetPassword = password;

    try {
      let authResult;
      try {
        // Attempt normal Firebase Auth Login
        authResult = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
      } catch (signInErr: any) {
        // Support default demo accounts and automatically seed them in Firebase Auth
        if (
          (targetEmail === 'admin@belamour.com' && targetPassword === 'admin') ||
          (targetEmail === 'cashier@belamour.com' && targetPassword === 'cashier')
        ) {
          try {
            authResult = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
            const isDefaultAdmin = targetEmail === 'admin@belamour.com';
            const defaultProfile = {
              id: authResult.user.uid,
              name: isDefaultAdmin ? 'BelAmour Admin' : 'BelAmour Cashier',
              email: targetEmail,
              role: isDefaultAdmin ? 'Admin' : 'Cashier'
            };
            await setDoc(doc(db, 'users', authResult.user.uid), defaultProfile);
          } catch (createErr: any) {
            console.error("Failed to auto-seed default account in Firebase Auth:", createErr);
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      }

      if (authResult?.user) {
        // Retrieve the user document from Firestore's "users" collection
        const userDocRef = doc(db, 'users', authResult.user.uid);
        const userDoc = await getDoc(userDocRef);
        let resolvedUser: User;

        if (userDoc.exists()) {
          const userData = userDoc.data();
          resolvedUser = {
            id: authResult.user.uid,
            name: userData.name || authResult.user.displayName || targetEmail.split('@')[0],
            email: targetEmail,
            role: userData.role || 'Admin'
          };
        } else {
          // Create user profile on the fly if it is missing
          const isDefaultAdmin = targetEmail === 'admin@belamour.com';
          const defaultProfile = {
            id: authResult.user.uid,
            name: isDefaultAdmin ? 'BelAmour Admin' : 'BelAmour Cashier',
            email: targetEmail,
            role: isDefaultAdmin ? 'Admin' : 'Cashier'
          };
          await setDoc(userDocRef, defaultProfile);
          resolvedUser = {
            id: authResult.user.uid,
            name: defaultProfile.name,
            email: targetEmail,
            role: defaultProfile.role as any
          };
        }

        onLoginSuccess(resolvedUser);
      }
    } catch (err: any) {
      console.error("Firebase Login Error:", err);
      let msg = "Incorrect credentials. Please verify your username/email and password.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
        msg = "Incorrect password token or email. Please re-enter.";
      } else if (err.code === 'auth/user-not-found') {
        msg = "Operator account not found.";
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('All registration blanks are mandatory');
      return;
    }

    const targetEmail = regEmail.trim().toLowerCase();

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      // 1. Create the user in Firebase environment
      const authResult = await createUserWithEmailAndPassword(auth, targetEmail, regPassword);

      // 2. Persist profile document in Firestore "users" collection
      const newProfile = {
        id: authResult.user.uid,
        name: regName.trim(),
        email: targetEmail,
        role: regRole
      };

      await setDoc(doc(db, 'users', authResult.user.uid), newProfile);

      setSuccessMsg(`Operator profile created for ${newProfile.name}! Directing you to console...`);
      setTimeout(() => {
        onLoginSuccess({
          id: newProfile.id,
          name: newProfile.name,
          email: newProfile.email,
          role: newProfile.role
        });
      }, 1200);

    } catch (err: any) {
      console.error("Firebase Registration Error:", err);
      let msg = "Registration failed. Please attempt again.";
      if (err.code === 'auth/email-already-in-use') {
        msg = "An operator profile already exists with this email.";
      } else if (err.code === 'auth/weak-password') {
        msg = "Password is too weak. Needs at least 6 characters.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Signed email address has an invalid format.";
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverEmail.trim()) return;
    try {
      await sendPasswordResetEmail(auth, recoverEmail.trim());
      setRecoverySent(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setErrorMsg(err.message || "Failed to send reset email. Verify your connection.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF8E3] bg-gradient-to-tr from-[#FAF5DF] via-[#FCF8E3] to-[#FFFDF4] flex items-center justify-center p-4 selection:bg-[#3D3120] selection:text-[#FCF8E3] font-sans relative overflow-hidden">
      
      {/* Exquisite ambient bokehs in outer layout */}
      <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-[#D4AF37]/8 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-[#3D3120]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[60%] left-[5%] w-60 h-60 bg-amber-500/5 rounded-full filter blur-[90px] pointer-events-none" />

      {/* Curved Split Container Card - Replicating Reference Image layout exactly */}
      <div className="w-full max-w-[880px] min-h-[550px] bg-[#3D3120] border border-[#544431]/40 rounded-[36px] shadow-[0_30px_60px_-15px_rgba(61,49,32,0.45)] overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-in fade-in zoom-in-95 duration-500 relative z-10">
        
        {/* Left Side: Crisp Cream Curved Section with full-scale Monogram brand logo */}
        <div className="md:col-span-6 bg-[#FCF8E3] p-8 pb-10 flex flex-col justify-between items-center text-center relative overflow-hidden rounded-t-[36px] md:rounded-t-none md:rounded-l-[36px] z-10">
          
          {/* Wave Curve Decorative Overlay creating the curved division on right edge as seen in Reference Image */}
          <div className="absolute top-0 bottom-0 -right-1 w-[110px] pointer-events-none hidden md:block z-20">
            <svg viewBox="0 0 100 600" className="h-full w-full text-[#FCF8E3]" fill="currentColor" preserveAspectRatio="none">
              <path d="M0 0 H50 C110 150, 0 380, 100 600 H0 Z" />
            </svg>
          </div>

          {/* Luxury Beauty branding (Top Left aligned look) */}
          <div className="w-full flex items-center gap-3 mt-2 pl-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#FCF8E3]/60 p-0.5 border border-[#3D3120]/10"
              dangerouslySetInnerHTML={{ 
                __html: PRIMARY_LOGO_SVG
                  .replace('width="70"', 'width="34"')
                  .replace('height="70"', 'height="34"')
                  .replaceAll('#2c1e13', '#3D3120')
                  .replaceAll('#c5a059', '#B48A30')
              }}
            />
            <div className="text-left">
              <h4 className="text-[12px] font-display font-bold tracking-tight uppercase text-[#3D3120] leading-none mb-1">
                Bél'Amour
              </h4>
              <span className="text-[7.5px] font-mono tracking-widest text-[#856D4D] uppercase block font-bold leading-none">
                Wellness Suite & Spa
              </span>
            </div>
          </div>

          {/* Center: Monogram Brand Logo styled accurately to match the uploaded logo’s vibe, colors, and layout */}
          <div className="relative w-64 h-64 bg-gradient-to-b from-[#FFFDF9] to-[#F5F2DF] rounded-[48px] flex items-center justify-center p-4 shadow-md overflow-hidden border border-[#EDEAD6]/60 mt-4 mb-2 select-none">
            
            {/* Soft cream floating ambient spots */}
            <div className="absolute top-10 left-10 w-12 h-12 bg-white/40 rounded-full blur-xl" />
            <div className="absolute bottom-12 right-12 w-16 h-16 bg-[#FFF]/30 rounded-full blur-lg" />

            {/* The Monogram logo of BEL, AMOUR SPA & SALON */}
            <div 
              className="relative w-52 h-52 flex items-center justify-center select-none"
              dangerouslySetInnerHTML={{
                __html: PRIMARY_LOGO_SVG
                  .replace('width="70"', 'width="155"')
                  .replace('height="70"', 'height="155"')
                  .replaceAll('#2c1e13', '#3D3120')
                  .replaceAll('#c5a059', '#B48A30')
              }}
            />
            
          </div>

          {/* Project branding tag below the logo */}
          <div className="mb-4">
            <span className="text-[10px] tracking-[0.2em] font-bold text-[#8F7657] font-mono uppercase">
              A project by RJ GROUP
            </span>
          </div>

          {/* Aesthetic footer signature block matching image style */}
          <div className="w-full text-left pl-2 select-none">
            <p className="text-[10px] text-[#3D3120]/75 font-sans tracking-tight font-medium">
              © 2026 Bél'Amour Professional Salon
            </p>
            <span className="text-[8px] text-[#3D3120]/60 font-mono block">
              Powered by Zentro
            </span>
          </div>

        </div>

        {/* Right Side: Luxury Espresso Brown Panel with matching brand gold inputs */}
        <div className="md:col-span-6 bg-[#3D3120] p-8 md:p-10 flex flex-col justify-center text-[#FCF8E3] relative">
          
          {/* Status messaging banner */}
          {(errorMsg || successMsg) && (
            <div className={`p-3.5 rounded-2xl text-[11px] flex items-center gap-2 mb-4 animate-in fade-in duration-200 ${
              errorMsg ? 'bg-rose-950/40 border border-rose-500/25 text-rose-300' : 'bg-[#241C12]/80 border border-[#B48A30]/30 text-amber-200'
            }`}>
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{errorMsg || successMsg}</span>
            </div>
          )}

          {/* MODE 1: SECURE VERIFIED LOGIN */}
          {step === 'Login' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-display font-medium text-white tracking-tight">
                  Login
                </h1>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-deck-form">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold tracking-wider text-[#C5B496] block uppercase">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#241C12]/80 border border-[#544431] text-xs py-3 px-5 rounded-full outline-none text-[#FCF8E3] placeholder-[#7A6953] focus:border-[#B48A30] transition-all font-medium"
                    id="login-deck-email"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold tracking-wider text-[#C5B496] block uppercase">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#241C12]/80 border border-[#544431] text-xs py-3 px-5 rounded-full outline-none text-[#FCF8E3] placeholder-[#7A6953] focus:border-[#B48A30] transition-all font-medium"
                    id="login-deck-password"
                  />
                  
                  {/* Forgot passcode hyperlink aligned left/right block under password */}
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => { setStep('ForgotPassword'); setRecoverySent(false); }}
                      className="text-[11px] text-[#C5B496] hover:text-[#FCF8E3] transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#B48A30] hover:bg-[#997424] text-white font-bold py-3.5 rounded-full text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer active:scale-98 mt-2"
                  id="submit-auth-btn"
                >
                  Confirm & Login
                </button>
              </form>

              {/* SignUp navigation option */}
              <div className="text-center pt-2">
                <span className="text-xs text-[#C5B496]">Don't have an account? </span>
                <button 
                  onClick={() => {
                    setErrorMsg('');
                    setStep('SignUp');
                  }}
                  className="text-xs font-bold text-[#D4AF37] hover:text-white hover:underline transition-all"
                >
                  Register Now
                </button>
              </div>

            </div>
          )}

          {/* MODE 2: RECEPTIONIST & MANAGER DIRECT NEW REGISTRATION */}
          {step === 'SignUp' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h1 className="text-2xl font-display font-medium text-white tracking-tight">
                  Register Account
                </h1>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5" id="signup-operators-form">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold tracking-wider text-[#C5B496] block uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={32}
                    placeholder="e.g. RJ Vance"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-[#241C12]/80 border border-[#544431] text-xs py-2.5 px-5 rounded-full outline-none text-white placeholder-[#7A6953] focus:border-[#B48A30] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold tracking-wider text-[#C5B496] block uppercase">
                    Email / Username identifier
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. manager@belamour.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-[#241C12]/80 border border-[#544431] text-xs py-2.5 px-5 rounded-full outline-none text-white placeholder-[#7A6953] focus:border-[#B48A30] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold tracking-wider text-[#C5B496] block uppercase">
                    Operator Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full bg-[#241C12]/80 border border-[#544431] text-xs py-2.5 px-5 rounded-full outline-none text-[#FCF8E3] focus:border-[#B48A30] transition-all cursor-pointer font-medium"
                  >
                    <option value="Admin" className="bg-[#3D3120]">Admin Account (Full Control)</option>
                    <option value="Cashier" className="bg-[#3D3120]">Cashier Account (Transactions only)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold tracking-wider text-[#C5B496] block uppercase">
                    Security Passcode
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. secure123"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-[#241C12]/80 border border-[#544431] text-xs py-2.5 px-5 rounded-full outline-none text-white placeholder-[#7A6953] focus:border-[#B48A30] transition-all"
                  />
                  <p className="text-[10px] text-[#C5B496] font-mono pt-1">
                    Note: Newly created profiles carry permissions keyed strictly to the selected role.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#B48A30] hover:bg-[#997424] text-white font-bold py-3 rounded-full text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer mt-4"
                >
                  Register & Sign In
                </button>
              </form>

              <div className="text-center">
                <span className="text-xs text-[#C5B496]">Have an operational account? </span>
                <button 
                  onClick={() => {
                    setErrorMsg('');
                    setStep('Login');
                  }}
                  className="text-xs font-bold text-[#D4AF37] hover:text-white hover:underline transition-all"
                >
                  Sign In here
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: PASSWORD RECOVERY */}
          {step === 'ForgotPassword' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-medium text-white tracking-tight">
                  Reset Password
                </h1>
              </div>

              {recoverySent ? (
                <div className="space-y-4 text-center py-4 bg-[#241C12]/80 p-6 rounded-3xl border border-[#544431]/40">
                  <div className="w-12 h-12 rounded-full bg-amber-950/40 text-[#D4AF37] flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-display">Instruction Transmitted</h3>
                    <p className="text-xs text-[#C5B496] mt-1.5 leading-relaxed">
                      We've dispatched recovery protocols to <strong className="font-mono text-white">{recoverEmail}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => { setStep('Login'); setRecoverySent(false); }}
                    className="text-xs font-semibold text-[#D4AF37] hover:underline pt-3 block mx-auto transition-all"
                  >
                    Return to Login Section
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecoverSubmit} className="space-y-4" id="forgot-pass-form">
                  <p className="text-xs text-[#C5B496] leading-relaxed">
                    Kindly type the email address associated with your operator account. We will transmit an automatic passkey authorization reset token.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold tracking-wider text-[#C5B496] block uppercase">
                      Operator email address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rj@belamour.com"
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      className="w-full bg-[#241C12]/80 border border-[#544431] text-xs py-3 px-5 rounded-full outline-none text-white focus:border-[#B48A30] transition-all"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('Login')}
                      className="flex-grow bg-[#241C12] hover:bg-black/40 text-[#C5B496] hover:text-white text-xs font-semibold py-3 rounded-full transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-grow bg-[#B48A30] hover:bg-[#997424] text-white font-bold text-xs py-3 rounded-full transition-all shadow-md"
                    >
                      Transmit Token
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Muted bottom terms aligned as in Reference Image */}
          <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between pointer-events-auto text-[9.5px] text-[#866F50] hover:text-[#C5B496] select-none">
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:underline hover:text-stone-300">
              Terms and Services
            </a>
            <span className="text-right">
              Have a problem? Contact us at <a href="mailto:support@belamour.com" className="underline hover:text-white">support@belamour.com</a>
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
