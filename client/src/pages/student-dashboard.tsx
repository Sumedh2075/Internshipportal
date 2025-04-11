import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Redirect } from "wouter";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Dialog, DialogTrigger, DialogHeader, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Internship {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  companyId: number;
  companyName?: string;
}

interface Application {
  id: number;
  internshipId: number;
  status: string;
  appliedAt: string;
  resumeUrl: string;
  internshipTitle?: string;
}

export default function StudentDashboard() {
  const { user, logoutMutation } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedInternship, setSelectedInternship] = useState<number | null>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const { toast } = useToast();

  const { data: internships = [], isLoading: loadingInternships } = useQuery<Internship[]>({
    queryKey: ["/api/internships"],
  });

  const { data: applications = [], isLoading: loadingApplications } = useQuery<Application[]>({
    queryKey: ["/api/applications/student"],
  });

  const applyMutation = useMutation({
    mutationFn: async (data: { internshipId: number; resumeUrl: string }) => {
      const res = await apiRequest("POST", "/api/applications", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/student"] });
    },
  });

  if (!user || user.role !== "student") {
    return <Redirect to="/auth" />;
  }

  const handleApply = (internshipId: number) => {
    if (!resumeUrl) {
      toast({
        title: "Resume required",
        description: "Please upload your resume before applying",
        variant: "destructive",
      });
      return;
    }
    applyMutation.mutate({ internshipId, resumeUrl });
    setSelectedInternship(null);
    setResumeUrl("");
  };

  const filteredInternships = internships.filter((internship) =>
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
                  {filteredInternships.map((internship) => (
                    <Card key={internship.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{internship.title}</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                              {internship.description}
                            </p>
                            <div className="mt-2 space-y-1 text-sm">
                              <p>Company: {internship.companyName || "Unknown Company"}</p>
                              <p>Location: {internship.location}</p>
                              <p>Start: {new Date(internship.startDate).toLocaleDateString()}</p>
                              <p>End: {new Date(internship.endDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Dialog open={selectedInternship === internship.id} onOpenChange={(open) => setSelectedInternship(open ? internship.id : null)}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                disabled={
                                  applyMutation.isPending ||
                                  applications.some(
                                    (app) => app.internshipId === internship.id
                                  )
                                }
                              >
                                {applications.some(
                                  (app) => app.internshipId === internship.id
                                )
                                  ? "Applied"
                                  : "Apply"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Apply for {internship.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Resume Link</Label>
                                  <Input
                                    type="url"
                                    placeholder="Enter your resume URL"
                                    value={resumeUrl}
                                    onChange={(e) => setResumeUrl(e.target.value)}
                                  />
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Please provide a link to your resume (e.g., Google Drive, Dropbox)
                                  </p>
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => handleApply(internship.id)}
                                  disabled={!resumeUrl || applyMutation.isPending}
                                >
                                  {applyMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Submit Application"
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
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
                  {applications.map((application) => {
                    // Find the associated internship
                    const internship = internships.find(i => i.id === application.internshipId);
                    
                    return (
                      <Card key={application.id}>
                        <CardContent className="pt-6">
                          <h3 className="font-semibold">
                            {application.internshipTitle || internship?.title || `Application #${application.id}`}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            <Badge className={
                              application.status === 'pending' ? 'bg-yellow-500' : 
                              application.status === 'accepted' ? 'bg-green-500' : 
                              'bg-red-500'
                            }>
                              {application.status}
                            </Badge>
                          </p>
                          {internship && (
                            <p className="text-sm mt-1">
                              Company: {internship.companyName || "Unknown"}
                            </p>
                          )}
                          <p className="text-sm">
                            Applied: {new Date(application.appliedAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm">
                            <a
                              href={application.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View Resume
                            </a>
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}