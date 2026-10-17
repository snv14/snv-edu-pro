import React from 'react';
import { useAuth } from './Auth';
import { LogIn, LogOut, User } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, signIn, logOut, loading } = useAuth();

  if (loading) {
    return <div className="text-[12px] text-gray-500 font-bold px-3 py-1.5 animate-pulse">جاري التحميل...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex flex-col text-left mr-2">
          <span className="text-[11px] font-black text-gray-900 leading-tight">{user.displayName}</span>
          <span className="text-[10px] text-gray-500 leading-tight truncate max-w-[120px]">{user.email}</span>
        </div>
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-7 h-7 rounded-full border border-gray-200" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <button
          onClick={logOut}
          title="تسجيل الخروج"
          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[12px] font-black hover:bg-blue-700 shadow-xs transition cursor-pointer"
    >
      <LogIn className="w-4 h-4" />
      <span>تسجيل الدخول بالمزامنة السحابية</span>
    </button>
  );
};
