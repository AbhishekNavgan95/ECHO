// Local storage utilities for managing chat limit data
const CHAT_LIMIT_KEY = 'echo_chat_limit';
const DEFAULT_LIMIT = {
  used: 0,
  remaining: 30,
  total: 30,
  resetTime: null,
  resetTimestamp: null,
  lastUpdated: null
};

/**
 * Get chat limit data from local storage
 * @returns {Object} Chat limit data
 */
export const getChatLimitFromStorage = () => {
  try {
    const stored = localStorage.getItem(CHAT_LIMIT_KEY);
    if (!stored) {
      return DEFAULT_LIMIT;
    }
    
    const data = JSON.parse(stored);
    
    // Check if the limit has expired and should be reset
    if (data.resetTimestamp && Date.now() >= data.resetTimestamp) {
      const resetData = {
        ...DEFAULT_LIMIT,
        resetTime: null,
        resetTimestamp: null,
        lastUpdated: Date.now()
      };
      saveChatLimitToStorage(resetData);
      return resetData;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading chat limit from storage:', error);
    return DEFAULT_LIMIT;
  }
};

/**
 * Save chat limit data to local storage
 * @param {Object} limitData - Chat limit data to save
 */
export const saveChatLimitToStorage = (limitData) => {
  try {
    const dataToSave = {
      ...limitData,
      lastUpdated: Date.now()
    };
    localStorage.setItem(CHAT_LIMIT_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving chat limit to storage:', error);
  }
};

/**
 * Update chat limit data with new information from API response
 * @param {Object} newLimitData - New limit data from API
 */
export const updateChatLimitFromAPI = (newLimitData) => {
  const currentData = getChatLimitFromStorage();
  const updatedData = {
    ...currentData,
    ...newLimitData,
    lastUpdated: Date.now()
  };
  saveChatLimitToStorage(updatedData);
  return updatedData;
};

/**
 * Check if chat limit data is stale and needs refresh
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
 * @returns {boolean} True if data is stale
 */
export const isChatLimitStale = (maxAgeMs = 5 * 60 * 1000) => {
  const data = getChatLimitFromStorage();
  if (!data.lastUpdated) return true;
  return Date.now() - data.lastUpdated > maxAgeMs;
};

/**
 * Clear chat limit data from storage
 */
export const clearChatLimitStorage = () => {
  try {
    localStorage.removeItem(CHAT_LIMIT_KEY);
  } catch (error) {
    console.error('Error clearing chat limit storage:', error);
  }
};

/**
 * Get rate limit status based on remaining requests
 * @param {number} remaining - Number of remaining requests
 * @returns {string} Status: 'ok', 'warning', 'exceeded'
 */
export const getRateLimitStatus = (remaining) => {
  if (remaining <= 0) return 'exceeded';
  if (remaining <= 2) return 'warning';
  return 'ok';
};
