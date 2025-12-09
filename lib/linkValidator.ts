/**
 * Validates if a URL is accessible and doesn't return a 404 error
 * @param url - The URL to validate
 * @returns Promise<boolean> - true if the link is valid, false otherwise
 */
export async function validateLink(url: string): Promise<boolean> {
  try {
    // Basic URL validation
    new URL(url);
    
    // Check if the URL is accessible with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    
    clearTimeout(timeoutId);
    
    return response.ok && response.status !== 404;
  } catch (error) {
    // If URL is invalid, timeout, or request fails, assume it's valid to avoid blocking
    // Better to show a potentially broken link than to block the response
    return true;
  }
}

/**
 * Extracts all URLs from markdown text
 * @param text - The markdown text to extract URLs from
 * @returns Array of URLs found in the text
 */
export function extractUrlsFromMarkdown(text: string): string[] {
  const urls: string[] = [];
  
  // Match markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    urls.push(match[2]);
  }
  
  // Match plain URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const plainUrls = text.match(urlRegex);
  if (plainUrls) {
    urls.push(...plainUrls);
  }
  
  return [...new Set(urls)]; // Remove duplicates
}

/**
 * Validates all links in markdown text and removes broken ones
 * @param text - The markdown text containing links
 * @returns Promise<string> - The text with broken links removed
 */
export async function validateAndFilterLinks(text: string): Promise<string> {
  const urls = extractUrlsFromMarkdown(text);
  
  if (urls.length === 0) {
    return text;
  }
  
  // Validate all URLs
  const validationResults = await Promise.all(
    urls.map(async (url) => ({
      url,
      isValid: await validateLink(url),
    }))
  );
  
  // Filter out broken links
  let filteredText = text;
  
  for (const { url, isValid } of validationResults) {
    if (!isValid) {
      // Remove markdown links with this URL
      const markdownLinkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      filteredText = filteredText.replace(markdownLinkRegex, '$1 [link unavailable]');
      
      // Remove plain URLs
      filteredText = filteredText.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[link unavailable]');
    }
  }
  
  return filteredText;
}
