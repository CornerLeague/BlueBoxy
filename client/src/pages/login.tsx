import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to login");

      const user = data.user;
      // Persist simple session in localStorage
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userId", String(user.id));
      localStorage.setItem("userData", JSON.stringify(user));

      // If guest assessment exists, move it under the account
      const guest = localStorage.getItem("guestAssessmentResults");
      if (guest) {
        try {
          const guestObj = JSON.parse(guest);
          await fetch("/api/assessment/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              responses: guestObj.responses,
              personalityType: guestObj.personalityType
            })
          });
        } catch {}
        localStorage.removeItem("guestAssessmentResults");
      }

      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Log in</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border bg-transparent p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border bg-transparent p-2"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </Button>
          <div className="text-center mt-2 text-sm">
            Don"t have an account? <button type="button" className="text-primary underline" onClick={() => setLocation("/onboarding")}>Create one</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
