import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInternshipSchema, insertUserSchema } from "@shared/schema";
import { Loader2, Users, Download, Trash, Building2, GraduationCap, Briefcase, UserPlus, Plus, Menu } from "lucide-react";
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
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [createInternshipOpen, setCreateInternshipOpen] = useState(false);

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

  const createAccountForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      role: "student",
      name: "",
    },
  });

  const createInternshipForm = useForm({
    resolver: zodResolver(insertInternshipSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      location: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreateAccountOpen(false);
      createAccountForm.reset();
      toast({ title: "Account created successfully" });
    },
  });

  const createInternshipMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/internships", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships"] });
      setCreateInternshipOpen(false);
      createInternshipForm.reset();
      toast({ title: "Internship created successfully" });
    },
  });

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
    <>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Menu className="h-4 w-4 mr-2" />
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCreateAccountOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCreateInternshipOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Internship
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportApplications}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Applications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="aspect-square">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[calc(100%-4rem)]">
                <p className="text-4xl font-bold">{studentUsers.length}</p>
              </CardContent>
            </Card>

            <Card className="aspect-square">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Companies
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[calc(100%-4rem)]">
                <p className="text-4xl font-bold">{companyUsers.length}</p>
              </CardContent>
            </Card>

            <Card className="aspect-square">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Internships
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[calc(100%-4rem)]">
                <p className="text-4xl font-bold">{internships.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-hidden">
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="w-full flex-wrap">
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
      </div>

      {createAccountOpen && (
        <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
            </DialogHeader>
            <Form {...createAccountForm}>
              <form onSubmit={createAccountForm.handleSubmit((data) => createAccountMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createAccountForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createAccountForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createAccountForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createAccountForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Create Account</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {createInternshipOpen && (
        <Dialog open={createInternshipOpen} onOpenChange={setCreateInternshipOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Internship</DialogTitle>
            </DialogHeader>
            <Form {...createInternshipForm}>
              <form onSubmit={createInternshipForm.handleSubmit((data) => createInternshipMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createInternshipForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createInternshipForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createInternshipForm.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createInternshipForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createInternshipForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createInternshipForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">Create Internship</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}