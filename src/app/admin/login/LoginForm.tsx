"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Невірний email або пароль");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[10px] tracking-widest uppercase text-muted/55">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@dryleaf.local"
          required
          className="w-full rounded-xl bg-surface border border-line px-4 py-3 text-sm text-cream placeholder:text-muted/40 outline-none focus:border-sage/40 transition-colors"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] tracking-widest uppercase text-muted/55">
          Пароль
        </label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-xl bg-surface border border-line px-4 py-3 pr-11 text-sm text-cream placeholder:text-muted/40 outline-none focus:border-sage/40 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPw((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger text-center">
          {error}
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-sage py-3.5 text-sm font-medium text-base transition-opacity disabled:opacity-60 mt-2"
      >
        {loading ? "Входимо..." : "Увійти"}
      </motion.button>
    </form>
  );
}
