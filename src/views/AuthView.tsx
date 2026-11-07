import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Store,
  Phone,
  ArrowRight,
  CheckCircle2,
  Languages,
  Loader2,
  AlertCircle,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const AuthView: React.FC = () => {
  const { login, register } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form fields
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form fields
  const [regShopName, setRegShopName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Clean phone number helper
  const handleMobileChange = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setter(digits);
  };



  // Login handler (Mobile Number and Password only - No OTP)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginMobile || loginMobile.length !== 10) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid 10-digit mobile number'
          : 'অনুগ্রহ করে সঠিক ১০ সংখ্যার মোবাইল নম্বর দিন'
      );
      return;
    }

    if (!loginPassword) {
      setErrorMsg(
        language === 'en' ? 'Please enter your password' : 'অনুগ্রহ করে আপনার পাসওয়ার্ড দিন'
      );
      return;
    }

    setLoading(true);
    const res = await login(loginMobile, loginPassword);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(
        res.error ||
          (language === 'en'
            ? 'Invalid mobile number or password. Please verify and try again.'
            : 'ভুল মোবাইল নম্বর অথবা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।')
      );
    }
  };

  // Registration handler (Shop Name, Mobile, Password, Confirm Password - No OTP)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedShopName = regShopName.trim();

    if (!trimmedShopName || trimmedShopName.length < 2) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter your Shop Name (e.g. Radhamadhab Online Center)'
          : 'অনুগ্রহ করে আপনার দোকানের নাম লিখুন'
      );
      return;
    }

    if (!regMobile || regMobile.length !== 10) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid 10-digit mobile number'
          : 'অনুগ্রহ করে সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন'
      );
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setErrorMsg(
        language === 'en'
          ? 'Password must be at least 4 characters long'
          : 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg(
        language === 'en'
          ? 'Passwords do not match! Please check Confirm Password.'
          : 'পাসওয়ার্ড দুটি মিলছে না! অনুগ্রহ করে পুনরায় চেক করুন।'
      );
      return;
    }

    setLoading(true);
    const res = await register(trimmedShopName, regMobile, regPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(
        language === 'en'
          ? `Welcome "${trimmedShopName}"! Account created successfully. Redirecting to Dashboard...`
          : `স্বাগতম "${trimmedShopName}"! অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে। ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...`
      );
    } else {
      setErrorMsg(res.error || 'Failed to create shop account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100 selection:bg-amber-500 selection:text-slate-950 relative">
      {/* Language Switch Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleLanguage}
          type="button"
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
        </button>
      </div>

      <div className="w-full max-w-md space-y-5 my-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 mx-auto flex items-center justify-center font-bold text-3xl shadow-xl shadow-orange-500/20 text-white ring-4 ring-slate-800">
            R
          </div>
          <h1 className="text-2xl font-black tracking-tight text-amber-300">
            {t.shopTitle}
          </h1>
          <p className="text-xs text-slate-400">
            Radhamadhab Online Center • {t.shopSubtitle}
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Header Title & Subtitle */}
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {authMode === 'register' ? (
                <>
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span>
                    {language === 'en'
                      ? 'New Shopkeeper Registration'
                      : 'নতুন দোকানদার রেজিস্ট্রেশন'}
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>
                    {language === 'en' ? 'Shopkeeper Login' : 'দোকানদার লগইন (Sign In)'}
                  </span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {authMode === 'register'
                ? (language === 'en'
                    ? 'Enter your Shop Name, Mobile Number, and Password to create your private cloud account'
                    : 'দোকানের নাম, মোবাইল নম্বর এবং পাসওয়ার্ড দিয়ে নতুন অ্যাকাউন্ট খুলুন')
                : (language === 'en'
                    ? 'Login using your Mobile Number and Password on any mobile phone or desktop'
                    : 'মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে যে কোনো মোবাইল বা কম্পিউটার থেকে লগইন করুন')}
            </p>
          </div>

          {/* Mode Switch Tabs: Login vs Register */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Login' : 'লগইন'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Register Shop' : 'দোকান রেজিস্ট্রেশন'}</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 1. REGISTRATION FORM (No OTP Required)                    */}
          {/* -------------------------------------------------------- */}
          {authMode === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Field 1: Shop Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'en' ? 'Shop Name' : 'দোকানের নাম (Shop Name)'}</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhamadhab Online Center"
                  value={regShopName}
                  onChange={e => setRegShopName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <span>✓</span>
                  <span>
                    {language === 'en'
                      ? 'Shop info, dashboard, receipts, and reports will automatically change to this Shop Name.'
                      : 'রেজিস্ট্রেশনের সাথে সাথে সমস্ত ড্যাশবোর্ড, রসিদ ও সেটিংসে এই দোকানের তথ্য সক্রিয় হবে।'}
                  </span>
                </p>
              </div>

              {/* Field 2: Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'en' ? 'Mobile Number (10 Digits)' : 'মোবাইল নম্বর (১০ সংখ্যা)'}</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold font-mono text-slate-400 pointer-events-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit number"
                    value={regMobile}
                    onChange={e => handleMobileChange(e.target.value, setRegMobile)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-3.5 py-2.5 text-sm text-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Field 3: Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'en' ? 'Password' : 'পাসওয়ার্ড (Password)'}</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Field 4: Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'en' ? 'Confirm Password' : 'পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)'}</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading || regMobile.length !== 10 || !regShopName.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'en' ? 'Creating Shop Account...' : 'অ্যাকাউন্ট তৈরি হচ্ছে...'}</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>{language === 'en' ? 'Create Shop Account' : 'দোকানের অ্যাকাউন্ট তৈরি করুন'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // --------------------------------------------------------
            // 2. LOGIN FORM (Mobile Number and Password - No OTP)
            // --------------------------------------------------------
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'en' ? 'Mobile Number' : 'মোবাইল নম্বর (Mobile Number)'}</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold font-mono text-slate-400 pointer-events-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit number"
                    value={loginMobile}
                    onChange={e => handleMobileChange(e.target.value, setLoginMobile)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-3.5 py-2.5 text-sm text-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'en' ? 'Password' : 'পাসওয়ার্ড (Password)'}</span>
                  </label>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || loginMobile.length !== 10}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Logging in...' : 'লগইন হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'en' ? 'Login to Shop' : 'দোকানে লগইন করুন'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Switcher */}
          <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
            {authMode === 'login' ? (
              <div>
                {language === 'en' ? 'Need to register a new shop?' : 'নতুন দোকান রেজিস্টার করতে চান?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-emerald-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <Store className="w-3 h-3 text-emerald-400" />
                  <span>{language === 'en' ? 'Register Here (No OTP)' : 'রেজিস্ট্রেশন করুন (ওটিপি ছাড়া)'}</span>
                </button>
              </div>
            ) : (
              <div>
                {language === 'en' ? 'Already registered your shop?' : 'ইতিমধ্যে রেজিস্টার করেছেন?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  {language === 'en' ? 'Login with Mobile & Password' : 'মোবাইল ও পাসওয়ার্ড দিয়ে লগইন'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {t.cloudSynced}
          </span>
          <span>•</span>
          <span>
            {language === 'en'
              ? 'Multi-Tenant Cloud Sync • Mobile & Desktop'
              : 'ক্লাউড সিঙ্ক • মোবাইল ও পিসি'}
          </span>
        </div>
      </div>
    </div>
  );
};
