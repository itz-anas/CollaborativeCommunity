import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { queryClient } from "./queryClient";
import { UserWithoutPassword } from "@shared/schema";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  // Get user data directly from query client to avoid circular dependencies
  const user = queryClient.getQueryData<UserWithoutPassword | null>(["/api/user"]);
  const userQueryState = queryClient.getQueryState(["/api/user"]);
  const isLoading = userQueryState?.status === "pending";

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
