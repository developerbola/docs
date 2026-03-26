import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/register", {
        email,
        username,
        password,
      });
      login(response.data.user, response.data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative">
      <div className="bg-white p-10 rounded-3xl w-full max-w-md shadow-2xl relative z-10 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">Join Us</h2>
          <p className="text-gray-500 mt-2 font-medium">
            Create your workspace today
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 ml-1">
              Full Name
            </label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors z-10" />
              <Input
                type="text"
                required
                className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-200"
                placeholder="John Doe"
                value={username}
                onChange={(e: any) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 ml-1">
              Email Address
            </label>
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
            <label className="text-sm font-semibold text-gray-600 ml-1">
              Password
            </label>
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
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-8 text-center text-gray-500 font-medium">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-bold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
