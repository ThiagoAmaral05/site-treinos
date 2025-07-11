"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Senha inválida. Tente novamente.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Não foi possível fazer login, gostaria de se registrar?"
                  : "Não foi possível registrar-se, gostaria de fazer login?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />

        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />

        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Entrar" : "Registrar"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Não tem conta? "
              : "Já tem uma conta? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Registrar" : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
