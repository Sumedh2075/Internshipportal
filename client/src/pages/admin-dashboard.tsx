import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Loader2, Users, Building2, FileText } from "lucide-react";
import { Redirect } from "wouter";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: internships, isLoading: loadingInternships } = useQuery({
    queryKey: ["/api/internships"],
  });

  if (!user || user.role !== "admin") {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => logoutMutation.mutate()}>Logout</Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {loadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : users?.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {loadingUsers ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  users?.filter((u: any) => u.role === "company").length
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Active Internships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {loadingInternships ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  internships?.length
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add more admin functionality as needed */}
      </div>
    </div>
  );
}
