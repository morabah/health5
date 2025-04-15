import { useCallback } from 'react';
import { trackButtonClick, trackInteraction, trackNavigation, trackFormSubmission } from '@/lib/eventTracker';

interface UseEventTrackingOptions {
  pageName: string;
}

/**
 * React hook that provides event tracking methods for functional components.
 * 
 * @param options - Configuration options for the hook
 * @returns Object containing event tracking methods
 */
export function useEventTracking({ pageName }: UseEventTrackingOptions) {
  /**
   * Track a button click event
   */
  const trackButton = useCallback((
    buttonLabel: string,
    additionalData?: Record<string, any>
  ) => {
    trackButtonClick(buttonLabel, pageName, additionalData);
  }, [pageName]);

  /**
   * Track a user interaction event
   */
  const trackEvent = useCallback((
    eventType: string,
    elementName: string,
    additionalData?: Record<string, any>
  ) => {
    trackInteraction(eventType, elementName, pageName, additionalData);
  }, [pageName]);

  /**
   * Track a navigation event
   */
  const trackNav = useCallback((
    destinationName: string,
    path: string
  ) => {
    trackNavigation(destinationName, path, pageName);
  }, [pageName]);

  /**
   * Track a form submission event
   */
  const trackForm = useCallback((
    formName: string,
    success: boolean,
    data?: Record<string, any>
  ) => {
    trackFormSubmission(formName, pageName, success, data);
  }, [pageName]);

  /**
   * Create an onClick handler that tracks button clicks
   */
  const createClickHandler = useCallback((
    buttonLabel: string,
    additionalData?: Record<string, any>,
    originalHandler?: (e: React.MouseEvent) => void
  ) => {
    return (e: React.MouseEvent) => {
      trackButtonClick(buttonLabel, pageName, additionalData);
      if (originalHandler) {
        originalHandler(e);
      }
    };
  }, [pageName]);

  return {
    trackButton,
    trackEvent,
    trackNav,
    trackForm,
    createClickHandler
  };
}

export default useEventTracking; 