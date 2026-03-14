import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });
  const [, setLocation] = useLocation();

  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side session
      const response = await fetch("/api/logout", { 
        method: "GET",
        credentials: "include"
      });
      console.log("Logout response:", response.status);
      if (!response.ok) {
        console.error("Logout failed with status:", response.status);
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    
    // Clear all query cache
    queryClient.clear();
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    
    // Use full page reload to ensure session is cleared and page refreshes
    window.location.replace("/");
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}