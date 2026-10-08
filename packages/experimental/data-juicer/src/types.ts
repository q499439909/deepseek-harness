/** Read-only Data-Juicer discovery and connection observations. @module */

/** Connection readiness after a real recipe-flow handshake and discovery checks. */
export interface DataJuicerStatus {
  readonly phase: 'connecting' | 'ready' | 'unavailable' | 'closed'
  readonly endpoint: string
  readonly message?: string
}

/** Metadata operation; no operation in this vocabulary runs data processing. */
export type DiscoveryOperation = 'configuration' | 'loading' | 'operators'
