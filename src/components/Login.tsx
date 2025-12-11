
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Radar } from 'lucide-react';
import { Button } from './Button';

interface LoginProps {
  onLogin: (role: 'INTEGRATOR' | 'END_USER' | 'SUPER_ADMIN') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Mock login handling
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        // Mock role determination based on email
        let role: 'INTEGRATOR' | 'END_USER' | 'SUPER_ADMIN' = 'INTEGRATOR';
        
        if (email.toLowerCase().includes('admin')) {
            role = 'SUPER_ADMIN';
        } else if (email.toLowerCase().includes('client')) {
            role = 'END_USER';
        }
        
        onLogin(role);
        setLoading(false);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gray-50">
      
      {/* Background Layer - Simple Geometric Pattern to replace heavy components */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-50 to-gray-100"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"></div>
          
          {/* Abstract Dashboard shapes */}
          <div className="absolute top-[15%] left-[10%] w-[200px] h-[120px] bg-white rounded-xl shadow-lg transform -rotate-12 opacity-40 border border-gray-100"></div>
          <div className="absolute bottom-[20%] right-[15%] w-[300px] h-[200px] bg-white rounded-xl shadow-lg transform rotate-6 opacity-40 border border-gray-100"></div>
      </div>
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[450px] bg-white/90 backdrop-blur-md border border-white/50 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
           <div className="flex justify-center mb-6 text-primary">
             <Radar size={64} strokeWidth={1.5} />
           </div>
           <h1 className="text-3xl font-bold text-darkGray mb-2">Welcome back</h1>
           <p className="text-mediumGray">Sign in to manage your licenses</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-darkGray">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white/80"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-sm font-medium text-darkGray">Password</label>
                <a href="#" className="text-sm text-primary hover:underline font-medium">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white/80"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-darkGray"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input id="remember" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
            <label htmlFor="remember" className="ml-2 block text-sm text-mediumGray">Remember me</label>
          </div>

          <Button type="submit" isLoading={loading} className="w-full h-12 text-base shadow-lg shadow-primary/20">
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-mediumGray">
          Don't have an account? <a href="#" className="text-primary font-semibold hover:underline">Sign up</a>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50/80 rounded-lg text-xs text-center text-gray-500 border border-gray-100">
           Tip: Use "admin" in email for Super Admin view.<br/>
           Use "client" in email for End User view.<br/>
           Default is IT Integrator.
        </div>
      </div>
    </div>
  );
};
