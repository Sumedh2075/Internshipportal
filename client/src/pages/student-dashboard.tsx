import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Redirect } from "wouter";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function StudentDashboard() {
  const { user, logoutMutation } = useAuth();
  const [search, setSearch] = useState("");

  const { data: internships, isLoading: loadingInternships } = useQuery({
    queryKey: ["/api/internships"],
  });

  const { data: applications, isLoading: loadingApplications } = useQuery({
    queryKey: ["/api/applications/student"],
  });

  const applyMutation = useMutation({
    mutationFn: async (internshipId: number) => {
      const res = await apiRequest("POST", "/api/applications", { internshipId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/student"] });
    },
  });

  if (!user || user.role !== "student") {
    return <Redirect to="/auth" />;
  }

  const filteredInternships = internships?.filter((internship: any) =>
    internship.title.toLowerCase().includes(search.toLowerCase()) ||
    internship.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Internships</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search internships..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingInternships ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInternships?.map((internship: any) => (
                    <Card key={internship.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{internship.title}</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                              {internship.description}
                            </p>
                            <p className="text-sm mt-2">
                              Location: {internship.location}
                            </p>
                            <p className="text-sm">
                              Deadline:{" "}
                              {new Date(internship.deadline).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            disabled={
                              applyMutation.isPending ||
                              applications?.some(
                                (app: any) =>
                                  app.internshipId === internship.id
                              )
                            }
                            onClick={() => applyMutation.mutate(internship.id)}
                          >
                            {applications?.some(
                              (app: any) => app.internshipId === internship.id
                            )
                              ? "Applied"
                              : "Apply"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingApplications ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {applications?.map((application: any) => (
                    <Card key={application.id}>
                      <CardContent className="pt-6">
                        <h3 className="font-semibold">
                          Application #{application.id}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Status: {application.status}
                        </p>
                        <p className="text-sm">
                          Applied:{" "}
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
