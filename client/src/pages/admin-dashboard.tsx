import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInternshipSchema } from "@shared/schema";
import { Loader2, Users, Download, Trash, Building2, GraduationCap, Briefcase } from "lucide-react";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Internship {
  id: number;
  title: string;
  description: string;
  location: string;
  requirements: string;
  startDate: string;
  endDate: string;
}

interface Application {
  id: number;
  studentId: string;
  status: string;
  resumeUrl: string;
}

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedInternshipId, setSelectedInternshipId] = useState<number | null>(null);

  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: internships = [], isLoading: loadingInternships } = useQuery<Internship[]>({
    queryKey: ["/api/internships"],
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: [`/api/applications/internship/${selectedInternshipId}`],
    enabled: !!selectedInternshipId,
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
  });

  const deleteInternshipMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/internships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships"] });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/applications/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/internship/${selectedInternshipId}`] });
    },
  });

  const exportApplications = async () => {
    const response = await fetch("/api/admin/applications/export");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications.xlsx";
    a.click();
  };

  if (!user || user.role !== "admin") {
    return <Redirect to="/auth" />;
  }

  const studentUsers = users.filter(u => u.role === "student");
  const companyUsers = users.filter(u => u.role === "company");
  const adminUsers = users.filter(u => u.role === "admin");

  const userColumns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "username", header: "Username" },
    { accessorKey: "email", header: "Email" },
    {
      id: "actions",
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="icon"
            onClick={() => deleteUserMutation.mutate(row.original.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={exportApplications}>
              <Download className="h-4 w-4 mr-2" />
              Export Applications
            </Button>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{studentUsers.length}</p>
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
              <p className="text-3xl font-bold">{companyUsers.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Internships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{internships.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="internships">Internships</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable columns={userColumns} data={studentUsers} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Company Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable columns={userColumns} data={companyUsers} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Admin Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable columns={userColumns} data={adminUsers} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internships">
            <Card>
              <CardHeader>
                <CardTitle>All Internships</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInternships ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {internships.map((internship) => (
                      <Card key={internship.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-semibold">{internship.title}</h3>
                              <p className="text-sm text-muted-foreground mt-2">
                                {internship.description}
                              </p>
                              <div className="mt-2 space-y-1 text-sm">
                                <p>Location: {internship.location}</p>
                                <p>Start: {new Date(internship.startDate).toLocaleDateString()}</p>
                                <p>End: {new Date(internship.endDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => deleteInternshipMutation.mutate(internship.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <select
                    className="w-full p-2 border rounded"
                    onChange={(e) => setSelectedInternshipId(Number(e.target.value))}
                    value={selectedInternshipId || ''}
                  >
                    <option value="">Select an internship to view applications</option>
                    {internships.map((internship) => (
                      <option key={internship.id} value={internship.id}>
                        {internship.title}
                      </option>
                    ))}
                  </select>
                </div>
                {applications.map((application) => (
                  <Card key={application.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-semibold">Student ID: {application.studentId}</h3>
                        <p className="text-sm text-muted-foreground">
                          Resume: <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Resume</a>
                        </p>
                        <p className="text-sm text-muted-foreground">Status: {application.status}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplicationMutation.mutate({ id: application.id, status: "accepted" })}
                          disabled={application.status !== "pending"}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplicationMutation.mutate({ id: application.id, status: "rejected" })}
                          disabled={application.status !== "pending"}
                        >
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}