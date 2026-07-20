import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { apiErrorMessage } from "../api/client.ts";
import { Button, Card, ErrorText, Field, Input } from "../components/ui.tsx";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-xl font-semibold">
          <Wallet className="size-6 text-[#2a78d6]" aria-hidden />
          Presupuestador
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Correo">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[--ink-secondary]">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="font-medium text-[#1c5cab] hover:underline">
            Regístrate
          </Link>
        </p>
      </Card>
    </div>
  );
}
