/**
 * Event tracking utility for consistent event logging across the application.
 * Leverages the existing logger system to log user interactions in the CMS.
 */
import { logInfo } from './logger';
import { appEventBus, LogPayload } from './eventBus';

/**
 * Helper function that ensures events are properly logged to the CMS using all available methods
 * This approach aims to guarantee that events appear in the CMS by using multiple channels
 */
function ensureEventLogged(payload: LogPayload): void {
  // 1. Direct event bus emission (most reliable within same tab)
  console.log(`[TRACKER] Emitting event via event bus: ${payload.message}`);
  appEventBus.emit('log_event', payload);
  
  // 2. Store in localStorage for cross-tab communication
  try {
    const jsonData = JSON.stringify(payload);
    const randomId = Math.random().toString().substring(2);
    const storageValue = `${jsonData}:${randomId}`;
    localStorage.setItem('cms_log_event', storageValue);
  } catch (e) {
    console.error('[TRACKER] Error setting localStorage:', e);
  }
  
  // 3. Use the logger as a fallback
  if (payload.level === 'INFO') {
    logInfo(payload.message, payload.data);
  }
}

/**
 * Track a button click event with standardized formatting.
 * 
 * @param buttonLabel - The label or identifier of the button
 * @param pageName - The name of the page where the click occurred
 * @param additionalData - Optional additional data to include in the log
 */
export function trackButtonClick(buttonLabel: string, pageName: string, additionalData?: Record<string, any>) {
  const message = `Button Click: "${buttonLabel}" on ${pageName} page`;
  const timestamp = new Date().toISOString();
  
  // Create a properly formatted payload
  const payload: LogPayload = {
    level: 'INFO',
    message,
    timestamp,
    data: { ...additionalData, buttonLabel, pageName, type: 'button_click' }
  };
  
  // Ensure the event is logged using all available methods
  ensureEventLogged(payload);
}

/**
 * Track a navigation event with standardized formatting.
 * 
 * @param destinationName - The name of the destination 
 * @param path - The path being navigated to
 * @param fromPage - The name of the page where navigation started
 */
export function trackNavigation(destinationName: string, path: string, fromPage: string) {
  const message = `Navigation: From ${fromPage} to "${destinationName}" (${path})`;
  const timestamp = new Date().toISOString();
  
  // Create a properly formatted payload
  const payload: LogPayload = {
    level: 'INFO',
    message,
    timestamp,
    data: { type: 'navigation', from: fromPage, to: destinationName, path }
  };
  
  // Ensure the event is logged using all available methods
  ensureEventLogged(payload);
}

/**
 * Track form submission events.
 * 
 * @param formName - The name/id of the form
 * @param pageName - The page where the form exists
 * @param success - Whether submission was successful
 * @param data - Optional form data summary (be careful with sensitive data)
 */
export function trackFormSubmission(formName: string, pageName: string, success: boolean, data?: Record<string, any>) {
  const message = `Form Submission: "${formName}" on ${pageName} page - ${success ? 'Success' : 'Failed'}`;
  const timestamp = new Date().toISOString();
  
  // Create a properly formatted payload
  const payload: LogPayload = {
    level: success ? 'INFO' : 'WARN',
    message,
    timestamp,
    data: { ...data, formName, pageName, success, type: 'form_submission' }
  };
  
  // Ensure the event is logged using all available methods
  ensureEventLogged(payload);
}

/**
 * Track user interaction events that aren't buttons/forms/navigation.
 * 
 * @param eventType - Type of interaction (e.g., 'dropdown-select', 'accordion-toggle')
 * @param elementName - Name of the interacted element
 * @param pageName - The page where the interaction occurred
 * @param additionalData - Optional additional data to include
 */
export function trackInteraction(eventType: string, elementName: string, pageName: string, additionalData?: Record<string, any>) {
  const message = `Interaction: ${eventType} "${elementName}" on ${pageName} page`;
  const timestamp = new Date().toISOString();
  
  // Create a properly formatted payload
  const payload: LogPayload = {
    level: 'INFO',
    message,
    timestamp,
    data: { ...additionalData, eventType, elementName, pageName, type: 'interaction' }
  };
  
  // Ensure the event is logged using all available methods
  ensureEventLogged(payload);
} 