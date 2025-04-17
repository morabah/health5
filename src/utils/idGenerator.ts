/**
 * ID Generator Utility
 * 
 * This utility provides functions for generating consistent, structured IDs 
 * for different entity types in the application.
 */
import { v4 as uuidv4 } from 'uuid';

export type EntityType = 'user' | 'doctor' | 'patient' | 'appointment' | 'notification' | 'document' | 'form';
export type UserType = 'doctor' | 'patient' | 'admin';

/**
 * Generates a prefixed, sequential ID for the specified entity and user type
 * 
 * @param entityType - The type of entity (user, doctor, patient, etc.)
 * @param userType - Optional user type for user entities (doctor, patient, admin)
 * @param sequenceNumber - Optional sequence number (default is to generate a random one)
 * @returns A formatted ID string
 */
export function generateId(entityType: EntityType, userType?: UserType, sequenceNumber?: number): string {
  const sequence = sequenceNumber || Math.floor(Math.random() * 999) + 1;
  const paddedSequence = sequence.toString().padStart(3, '0');
  
  if (entityType === 'user' && userType) {
    return `user_${userType}_${paddedSequence}`;
  }
  
  return `${entityType}_${paddedSequence}`;
}

/**
 * Generates a UUID v4 for entities that need globally unique IDs
 * 
 * @param prefix - Optional prefix to add to the UUID
 * @returns A UUID string with optional prefix
 */
export function generateUuid(prefix?: string): string {
  const uuid = uuidv4();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Extracts the entity type and sequence number from an ID
 * 
 * @param id - The ID to parse
 * @returns An object with the entity type, user type (if applicable), and sequence number
 */
export function parseId(id: string): { 
  entityType: string; 
  userType?: string; 
  sequenceNumber: number;
} {
  const parts = id.split('_');
  
  if (parts.length === 3 && parts[0] === 'user') {
    return {
      entityType: parts[0],
      userType: parts[1],
      sequenceNumber: parseInt(parts[2], 10)
    };
  }
  
  return {
    entityType: parts[0],
    sequenceNumber: parseInt(parts[1], 10)
  };
} 