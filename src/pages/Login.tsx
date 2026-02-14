import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-mono px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block bg-ecfi-gold text-primary-foreground font-extrabold text-lg px-4 py-2 tracking-widest">ECFI</div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Proposal Builder</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Email</label>
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
            <label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 font-mono"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full font-mono font-bold tracking-widest uppercase">
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          No account?{" "}
          <Link to="/signup" className="text-ecfi-gold-text hover:underline font-bold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
