import 'server-only'

/*
 * Server-only re-export of the PKI implementation. App/runtime code imports
 * from here so the 'server-only' guard prevents the signing key path from ever
 * being bundled into a client component. CLI scripts import ./ed25519 directly
 * (the guard would otherwise throw outside Next's server runtime).
 */
export * from './ed25519'
