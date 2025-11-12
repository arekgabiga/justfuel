import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError } from "./AuthError";
import { AuthSuccess } from "./AuthSuccess";
import { useForgotPasswordForm } from "@/lib/hooks/useForgotPasswordForm";

const ForgotPasswordForm: React.FC = () => {
  const {
    formState,
    formErrors,
    isSubmitting,
    isSuccess,
    touchedFields,
    handleEmailChange,
    handleFieldBlur,
    handleSubmit,
  } = useForgotPasswordForm();

  if (isSuccess) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Sprawdź swoją skrzynkę</h1>
        <AuthSuccess
          message="Jeśli konto z tym adresem e-mail istnieje, wysłaliśmy link do resetowania hasła."
          className="mb-6"
        />
        <div className="text-center">
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Wróć do logowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-2 text-foreground">Odzyskiwanie hasła</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Podaj adres e-mail powiązany z kontem, a wyślemy link do resetowania hasła
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formErrors.general && <AuthError message={formErrors.general} />}

        <div className="space-y-2">
          <Label htmlFor="email">Adres e-mail</Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={formState.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={() => handleFieldBlur("email")}
            placeholder="twoj@email.pl"
            autoComplete="email"
            aria-invalid={touchedFields.has("email") && !!formErrors.email}
            aria-describedby={touchedFields.has("email") && formErrors.email ? "email-error" : undefined}
            required
          />
          {touchedFields.has("email") && formErrors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {formErrors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>

          <div className="text-center">
            <a href="/auth/login" className="text-sm text-primary hover:underline">
              Wróć do logowania
            </a>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
