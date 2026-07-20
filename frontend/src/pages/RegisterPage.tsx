import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { apiErrorMessage } from "../api/client.ts";
import { Button, Card, ErrorText, Field, Input } from "../components/ui.tsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      await register(name, email, password);
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
          Crear cuenta
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nombre">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Correo">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Contraseña (mínimo 8 caracteres)">
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creando cuenta…" : "Registrarme"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[--ink-secondary]">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-[#1c5cab] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
