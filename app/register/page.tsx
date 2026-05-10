import { AuthCard } from "@/components/auth/auth-card";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <div className="page-shell relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-x-0 top-0 h-96" />
      <Suspense fallback={<div className="skeleton h-96 w-full max-w-md" />}>
        <AuthCard mode="register" />
      </Suspense>
    </div>
  );
}
