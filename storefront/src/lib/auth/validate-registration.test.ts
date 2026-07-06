import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { validateRegistration } from "./validate-registration.ts"

describe("Registrierungs-Validierung", () => {
  it("verlangt Vor- und Nachname bei Privatkunden", () => {
    const errors = validateRegistration({
      customerKind: "private",
      email: "jane@example.de",
      password: "sicheres-passwort",
      firstName: "",
      lastName: "",
    })
    assert.equal(errors.some((e) => e.field === "firstName"), true)
    assert.equal(errors.some((e) => e.field === "lastName"), true)
  })

  it("verlangt den Firmennamen bei Gewerbekunden, aber keinen Vor-/Nachnamen", () => {
    const errors = validateRegistration({
      customerKind: "business",
      email: "info@baufirma.de",
      password: "sicheres-passwort",
      companyName: "",
    })
    assert.equal(errors.some((e) => e.field === "companyName"), true)
    assert.equal(errors.some((e) => e.field === "firstName"), false)
  })

  it("akzeptiert eine vollständige Privatkunden-Registrierung ohne Fehler", () => {
    const errors = validateRegistration({
      customerKind: "private",
      email: "joerg.weissgerber@example.de",
      password: "sicheres-passwort",
      firstName: "Jörg",
      lastName: "Weißgerber",
    })
    assert.deepEqual(errors, [])
  })

  it("lehnt eine ungültige E-Mail-Adresse ab", () => {
    const errors = validateRegistration({
      customerKind: "private",
      email: "keine-email",
      password: "sicheres-passwort",
      firstName: "Jörg",
      lastName: "Weißgerber",
    })
    assert.equal(errors.some((e) => e.field === "email"), true)
  })

  it("lehnt ein zu kurzes Passwort ab", () => {
    const errors = validateRegistration({
      customerKind: "private",
      email: "jane@example.de",
      password: "kurz",
      firstName: "Jane",
      lastName: "Doe",
    })
    assert.equal(errors.some((e) => e.field === "password"), true)
  })

  it("verlangt eine Auswahl zwischen privat und gewerblich", () => {
    const errors = validateRegistration({
      customerKind: "",
      email: "jane@example.de",
      password: "sicheres-passwort",
    })
    assert.equal(errors.some((e) => e.field === "customerKind"), true)
  })
})
