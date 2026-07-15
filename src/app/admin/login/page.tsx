import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Вхід · Dry Leaf Admin" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="text-[10px] tracking-[.45em] uppercase text-sage mb-3">Admin</p>
          <h1 className="font-serif text-4xl font-light text-cream">Dry Leaf</h1>
          <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-sage to-transparent" />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
