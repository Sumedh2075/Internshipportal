import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Redirect to appropriate dashboard based on role
  switch (user.role) {
    case "admin":
      return <Redirect to="/admin" />;
    case "company":
      return <Redirect to="/company" />;
    case "student":
      return <Redirect to="/student" />;
    default:
      return <Redirect to="/auth" />;
  }
}
