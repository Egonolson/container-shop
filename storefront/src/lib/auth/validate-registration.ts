export type CustomerKind = "private" | "business"

export type RegistrationInput = {
  customerKind: CustomerKind | ""
  email: string
  password: string
  firstName?: string
  lastName?: string
  companyName?: string
  vatId?: string
  phone?: string
}

export type ValidationError = { field: string; message: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegistration(input: RegistrationInput): ValidationError[] {
  const errors: ValidationError[] = []

  if (!input.email || !EMAIL_PATTERN.test(input.email)) {
    errors.push({ field: "email", message: "Bitte eine gültige E-Mail-Adresse angeben." })
  }

  if (!input.password || input.password.length < 8) {
    errors.push({ field: "password", message: "Das Passwort muss mindestens 8 Zeichen lang sein." })
  }

  if (input.customerKind === "private") {
    if (!input.firstName?.trim()) {
      errors.push({ field: "firstName", message: "Bitte Vornamen angeben." })
    }
    if (!input.lastName?.trim()) {
      errors.push({ field: "lastName", message: "Bitte Nachnamen angeben." })
    }
  } else if (input.customerKind === "business") {
    if (!input.companyName?.trim()) {
      errors.push({ field: "companyName", message: "Bitte Firmennamen angeben." })
    }
  } else {
    errors.push({ field: "customerKind", message: "Bitte wählen, ob Sie privat oder gewerblich bestellen." })
  }

  return errors
}
