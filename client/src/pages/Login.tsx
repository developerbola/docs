import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 neo-blur overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-white p-10 rounded-3xl w-full max-w-md shadow-2xl relative z-10 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
            <div className="bg-primary/20 p-4 rounded-2xl mb-4 float-animation">
                <FileText className="w-10 h-10 text-primary" />
            </div>
          <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
          <p className="text-gray-500 mt-2 font-medium">Sign in to your workspace</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors z-10" />
              <Input
                type="email"
                required
                className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-200"
                placeholder="john@example.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors z-10" />
              <Input
                type="password"
                required
                className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-200"
                placeholder="••••••••"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl font-semibold shadow-lg shadow-primary/25 gap-2 group"
          >
            {loading ? 'Signing in...' : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-gray-500 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-bold">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
