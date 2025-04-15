/**
 * Declaration file for mitt to bypass TypeScript import errors.
 * Based on the official mitt typings.
 */

declare module 'mitt' {
  export type EventType = string | symbol;
  
  // The handler function type
  export type Handler<T = any> = (event: T) => void;
  
  // The map of event types to handlers
  export type EventHandlerMap<Events extends Record<EventType, unknown>> = Map<
    keyof Events | '*',
    Array<Handler<Events[keyof Events]>>
  >;
  
  // The emitter interface
  export interface Emitter<Events extends Record<EventType, unknown>> {
    all: EventHandlerMap<Events>;
    on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;
    on(type: '*', handler: Handler): void;
    off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): void;
    off(type: '*', handler: Handler): void;
    emit<Key extends keyof Events>(type: Key, event: Events[Key]): void;
    emit(type: symbol, event?: unknown): void;
  }
  
  // The default export
  export default function mitt<Events extends Record<EventType, unknown>>(
    all?: EventHandlerMap<Events>
  ): Emitter<Events>;
} 