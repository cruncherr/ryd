import type { Access, FieldAccess } from 'payload'

/** Każdy zalogowany użytkownik panelu jest administratorem sklepu. */
export const isAdmin: Access = ({ req }) => Boolean(req.user)

export const isAdminField: FieldAccess = ({ req }) => Boolean(req.user)

export const anyone: Access = () => true

export const nobody: Access = () => false

export const nobodyField: FieldAccess = () => false

/** Klienci widzą tylko opublikowane wpisy; administrator widzi także szkice. */
export const publishedOrAdmin: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

/** Klienci widzą tylko aktywne pozycje (np. metody dostawy). */
export const activeOrAdmin: Access = ({ req }) => {
  if (req.user) return true
  return { active: { equals: true } }
}
