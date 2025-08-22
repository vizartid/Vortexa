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
      // In development, for chat use Netlify Functions, others use Express
      if (url.startsWith('/api/chat')) {
        fullUrl = `${window.location.origin}/.netlify/functions/chat`;
      } else {
        fullUrl = `http://localhost:5000${url}`;
      }
    } else {
      // In production, use Netlify Functions
      if (url.startsWith('/api/chat')) {
        fullUrl = `${window.location.origin}/.netlify/functions/chat`;
      } else {
        // For other API calls that don't exist in Netlify Functions, return mock response
        console.log('API call not supported in serverless mode:', url);
        return new Response(JSON.stringify({ conversations: [], messages: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    console.log('Making API request to:', fullUrl, 'with method:', method);

    const res = await fetch(fullUrl, {
      method,
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log('API Response received:', res.status, res.statusText);

    // Check if response is actually JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await res.text();
      console.error('Non-JSON response received:', textResponse.substring(0, 200));
      throw new Error(`Server returned non-JSON response. Content-Type: ${contentType}`);
    }

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