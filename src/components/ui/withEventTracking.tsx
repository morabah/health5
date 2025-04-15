import React from 'react';
import { trackButtonClick, trackInteraction } from '@/lib/eventTracker';

export interface WithEventTrackingProps {
  eventLabel?: string;
  pageName?: string;
  eventType?: 'button' | 'interaction';
  interactionType?: string;
  additionalLogData?: Record<string, any>;
  children?: React.ReactNode;
  className?: string;
}

type ComponentOrTag<P = any> = React.ComponentType<P> | keyof JSX.IntrinsicElements;

/**
 * Higher-order component (HOC) that adds event tracking to any component or HTML element.
 * 
 * @param WrappedComponent - The component or HTML element tag to wrap with event tracking
 * @param defaultPageName - Default page name to use if not provided in props
 * @param defaultEventType - Default event type (button or interaction)
 * @returns A new component with event tracking functionality
 */
export function withEventTracking<P extends object>(
  WrappedComponent: ComponentOrTag<P>,
  defaultPageName: string = 'Unknown',
  defaultEventType: 'button' | 'interaction' = 'interaction'
) {
  // Return a function component with the same props as the wrapped component
  return function WithEventTracking(props: P & WithEventTrackingProps) {
    const {
      eventLabel,
      pageName = defaultPageName,
      eventType = defaultEventType,
      interactionType = 'click',
      additionalLogData,
      ...componentProps
    } = props;
    
    const handleClick = (e: React.MouseEvent) => {
      // Log the event based on event type even if no label provided
      if (eventLabel) {
        console.log(`[EVENT TRACKING] ${eventType} event: ${eventLabel} on ${pageName}`);
        
        if (eventType === 'button') {
          trackButtonClick(eventLabel, pageName, additionalLogData);
        } else {
          trackInteraction(interactionType, eventLabel, pageName, additionalLogData);
        }
      }
      
      // Call the original onClick handler if it exists
      if ('onClick' in componentProps && typeof componentProps.onClick === 'function') {
        (componentProps.onClick as Function)(e);
      }
    };
    
    const handleMouseEnter = (e: React.MouseEvent) => {
      // For hover interactions (when interactionType is 'hover')
      if (interactionType === 'hover' && eventLabel) {
        console.log(`[EVENT TRACKING] Hover event: ${eventLabel} on ${pageName}`);
        trackInteraction('hover', eventLabel, pageName, additionalLogData);
      }
      
      // Call the original onMouseEnter handler if it exists
      if ('onMouseEnter' in componentProps && typeof componentProps.onMouseEnter === 'function') {
        (componentProps.onMouseEnter as Function)(e);
      }
    };
    
    // Inject the event handlers into the wrapped component
    return (
      <WrappedComponent
        {...componentProps as any}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
      />
    );
  };
}

export default withEventTracking; 