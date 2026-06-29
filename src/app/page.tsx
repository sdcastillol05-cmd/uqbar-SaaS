"use client";

import { useAuth } from "@/hooks/use-auth";
import { LoginScreen } from "@/components/auth/login-screen";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return user ? <DashboardScreen /> : <LoginScreen />;
}
