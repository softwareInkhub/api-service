export const makeApiCall = async (method: NamespaceMethod, requestData: any) => {
  try {
    let url = method['namespace-account-method-url-override'];
    
    // For GET requests, append data as query parameters
    if (method['namespace-account-method-type'] === 'GET' && requestData) {
      const params = new URLSearchParams();
      Object.entries(requestData).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      url = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
    }

    const options: RequestInit = {
      method: method['namespace-account-method-type'],
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Add body only for non-GET requests
    if (method['namespace-account-method-type'] !== 'GET' && requestData) {
      options.body = JSON.stringify(requestData);
    }

    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}; 