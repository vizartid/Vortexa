import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText = res.statusText;
    try {
      const text = await res.text();
      errorText = text || res.statusText;
    } catch (error) {
      console.warn('Failed to read response text:', error);
    }
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Check if we're in development (localhost) or production
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let fullUrl;
    if (isLocalhost) {
      // In development, use the local Express server
      const baseUrl = 'http://localhost:5000';
      fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
    } else {
      // In production, map /api/chat to /.netlify/functions/chat
      if (url === '/api/chat') {
        fullUrl = '/.netlify/functions/chat';
      } else if (url.startsWith('/api/')) {
        // For other API endpoints, use the api function
        fullUrl = '/.netlify/functions/api';
      } else if (url.startsWith('/')) {
        fullUrl = `/.netlify/functions${url}`;
      } else {
        fullUrl = url;
      }
    }
    
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('API Request failed:', { method, url, error });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
