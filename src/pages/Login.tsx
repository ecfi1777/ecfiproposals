import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const { toast } = useToast();

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSubmitting(true);
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetSent(true);
    setResetSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-mono px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block bg-black text-white font-extrabold text-lg px-4 py-2 tracking-widest">ECFI</div>
          <p className="text-xs text-foreground tracking-widest uppercase">
            {forgotMode ? "Reset Password" : "Proposal Builder"}
          </p>
        </div>

        {forgotMode ? (
          resetSent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-foreground">
                If an account exists with that email, you'll receive a password reset link.
              </p>
              <Button
                variant="outline"
                className="w-full font-mono font-bold tracking-widest uppercase border-foreground text-foreground"
                onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail(""); }}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-foreground">Email</label>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="mt-1 font-mono"
                  placeholder="you@ecfi.com"
                />
              </div>
              <Button type="submit" disabled={resetSubmitting} className="w-full font-mono font-bold tracking-widest uppercase bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-hover)] text-white">
                {resetSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-xs text-foreground hover:underline"
              >
                Back to Sign In
              </button>
            </form>
          )
        ) : (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 font-mono"
                  placeholder="you@ecfi.com"
                />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-foreground">Password</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="font-mono pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-xs text-foreground hover:underline font-bold mt-1"
                >
                  Forgot password?
                </button>
              </div>
              <Button type="submit" disabled={submitting} className="w-full font-mono font-bold tracking-widest uppercase bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-hover)] text-white">
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-xs text-foreground">
              No account?{" "}
              <Link to="/signup" className="text-foreground hover:underline font-bold">
                Sign Up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
