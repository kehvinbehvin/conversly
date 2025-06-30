import TagManager from 'react-gtm-module';

// Environment detection utility
function getEnvironment(): 'development' | 'production' {
  return import.meta.env.PROD ? 'production' : 'development';
}

function getGTMContainerId(): string {
  return getEnvironment() === 'production' ? 'GTM-PPWXFQR6' : 'GTM-NCK6KLG8';
}

// Export environment utilities for external use
export { getEnvironment, getGTMContainerId };

// GTM Event Types
export interface GTMEvent {
  event: string;
  [key: string]: any;
}

// Common GTM Events
export const GTMEvents = {
  // Conversation Events
  CONVERSATION_STARTED: 'conversation_started',
  CONVERSATION_ENDED: 'conversation_ended',
  CONVERSATION_COMPLETED: 'conversation_completed',
  
  // Avatar Selection Events
  AVATAR_SELECTED: 'avatar_selected',
  
  // Review Events
  REVIEW_VIEWED: 'review_viewed',
  REVIEW_SCORED: 'review_scored',
  
  // Navigation Events
  PAGE_VIEW: 'page_view',
  SECTION_VIEW: 'section_view',
  
  // User Actions
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  
  // Feedback Events
  FEEDBACK_MODAL_OPENED: 'feedback_modal_opened',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  
  // Engagement Events
  SCROLL_DEPTH: 'scroll_depth',
  TIME_ON_PAGE: 'time_on_page',
} as const;

/**
 * Push a custom event to Google Tag Manager
 * @param eventData - The event data to send to GTM
 */
export const pushGTMEvent = (eventData: GTMEvent): void => {
  try {
    const enrichedEvent = {
      ...eventData,
      environment: getEnvironment(),
      gtm_container_id: getGTMContainerId(),
      timestamp: eventData.timestamp || new Date().toISOString(),
    };

    TagManager.dataLayer({
      dataLayer: enrichedEvent,
    });


  } catch (error) {
    console.error('Failed to push GTM event:', error);
  }
};

/**
 * Track page view with additional context
 * @param pageName - Name of the page
 * @param pageCategory - Category of the page (optional)
 * @param additionalData - Additional data to include (optional)
 */
export const trackPageView = (
  pageName: string,
  pageCategory?: string,
  additionalData?: Record<string, any>
): void => {
  pushGTMEvent({
    event: GTMEvents.PAGE_VIEW,
    page_name: pageName,
    page_category: pageCategory,
    page_url: window.location.href,
    page_path: window.location.pathname,
    ...additionalData,
  });
};

/**
 * Track conversation events
 */
export const trackConversationEvent = (
  action: 'started' | 'ended' | 'completed',
  avatarId?: string,
  duration?: number,
  additionalData?: Record<string, any>
): void => {
  const eventMap = {
    started: GTMEvents.CONVERSATION_STARTED,
    ended: GTMEvents.CONVERSATION_ENDED,
    completed: GTMEvents.CONVERSATION_COMPLETED,
  };

  pushGTMEvent({
    event: eventMap[action],
    avatar_id: avatarId,
    conversation_duration: duration,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

/**
 * Track avatar selection
 */
export const trackAvatarSelection = (
  avatarId: string,
  avatarName: string,
  additionalData?: Record<string, any>
): void => {
  pushGTMEvent({
    event: GTMEvents.AVATAR_SELECTED,
    avatar_id: avatarId,
    avatar_name: avatarName,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

/**
 * Track review events
 */
export const trackReviewEvent = (
  action: 'viewed' | 'scored',
  score?: number,
  conversationId?: string,
  additionalData?: Record<string, any>
): void => {
  const eventMap = {
    viewed: GTMEvents.REVIEW_VIEWED,
    scored: GTMEvents.REVIEW_SCORED,
  };

  pushGTMEvent({
    event: eventMap[action],
    review_score: score,
    conversation_id: conversationId,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

/**
 * Track button clicks with context
 */
export const trackButtonClick = (
  buttonName: string,
  buttonCategory?: string,
  additionalData?: Record<string, any>
): void => {
  pushGTMEvent({
    event: GTMEvents.BUTTON_CLICK,
    button_name: buttonName,
    button_category: buttonCategory,
    page_url: window.location.href,
    page_path: window.location.pathname,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

/**
 * Track section views (for scroll tracking)
 */
export const trackSectionView = (
  sectionName: string,
  additionalData?: Record<string, any>
): void => {
  pushGTMEvent({
    event: GTMEvents.SECTION_VIEW,
    section_name: sectionName,
    page_url: window.location.href,
    page_path: window.location.pathname,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

/**
 * Track feedback modal events
 */
export const trackFeedbackModalOpened = (
  source?: string,
  additionalData?: Record<string, any>
): void => {
  pushGTMEvent({
    event: GTMEvents.FEEDBACK_MODAL_OPENED,
    modal_source: source || 'unknown',
    page_url: window.location.href,
    page_path: window.location.pathname,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

export const trackFeedbackSubmitted = (
  hasName: boolean,
  hasEmail: boolean,
  feedbackLength: number,
  conversationId?: number,
  additionalData?: Record<string, any>
): void => {
  pushGTMEvent({
    event: GTMEvents.FEEDBACK_SUBMITTED,
    has_name: hasName,
    has_email: hasEmail,
    feedback_length: feedbackLength,
    conversation_id: conversationId,
    page_url: window.location.href,
    page_path: window.location.pathname,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};