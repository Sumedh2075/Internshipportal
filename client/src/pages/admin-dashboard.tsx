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
import { Loader2, Users, Download, Trash, Building2, GraduationCap, Briefcase, UserPlus, Plus, Menu, Pencil } from "lucide-react";
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
      await apiRequest("DELETE", `/api/admin/internships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships"] });
      toast({ title: "Internship deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete internship", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
  
  const [editInternshipData, setEditInternshipData] = useState<Internship | null>(null);
  const [isEditInternshipOpen, setIsEditInternshipOpen] = useState(false);
  
  const editInternshipForm = useForm({
    resolver: zodResolver(insertInternshipSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      location: "",
      startDate: "",
      endDate: "",
    },
  });
  
  const updateInternshipMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/internships/${editInternshipData?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships"] });
      setIsEditInternshipOpen(false);
      toast({ title: "Internship updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update internship", 
        description: error.message,
        variant: "destructive" 
      });
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
      // role: "student", Removed as per intention
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your internship portal system</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 shadow-sm hover:shadow transition-all">
                  <Menu className="h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-lg border-none">
                <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setCreateAccountOpen(true)}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-2 py-1">
                    <div className="bg-primary/10 p-1 rounded-full">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <span>New Account</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setCreateInternshipOpen(true)}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-2 py-1">
                    <div className="bg-primary/10 p-1 rounded-full">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <span>New Internship</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={exportApplications}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-2 py-1">
                    <div className="bg-primary/10 p-1 rounded-full">
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                    <span>Export Applications</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  className="cursor-pointer hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <div className="flex items-center gap-2 py-1">
                    <span>Logout</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <Card className="aspect-square overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[calc(100%-5rem)]">
                <p className="text-5xl font-bold bg-gradient-to-b from-primary to-primary/80 bg-clip-text text-transparent">
                  {studentUsers.length}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Total registered students</p>
              </CardContent>
            </Card>

            <Card className="aspect-square overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  Companies
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[calc(100%-5rem)]">
                <p className="text-5xl font-bold bg-gradient-to-b from-primary to-primary/80 bg-clip-text text-transparent">
                  {companyUsers.length}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Partner companies</p>
              </CardContent>
            </Card>

            <Card className="aspect-square overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  Internships
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[calc(100%-5rem)]">
                <p className="text-5xl font-bold bg-gradient-to-b from-primary to-primary/80 bg-clip-text text-transparent">
                  {internships.length}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Available positions</p>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-hidden">
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="w-full flex-wrap bg-muted/50 p-1 rounded-lg">
                <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-200">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Students
                </TabsTrigger>
                <TabsTrigger value="companies" className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-200">
                  <Building2 className="h-4 w-4 mr-2" />
                  Companies
                </TabsTrigger>
                <TabsTrigger value="admins" className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-200">
                  <Users className="h-4 w-4 mr-2" />
                  Admins
                </TabsTrigger>
                <TabsTrigger value="internships" className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-200">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Internships
                </TabsTrigger>
                <TabsTrigger value="applications" className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-200">
                  <Download className="h-4 w-4 mr-2" />
                  Applications
                </TabsTrigger>
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {internships.map((internship) => (
                          <Card key={internship.id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                            <CardContent className="p-0">
                              <div className="flex flex-col h-full">
                                <div className="bg-primary/10 p-4 relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  <h3 className="font-semibold text-lg text-foreground relative z-10">{internship.title}</h3>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 relative z-10">
                                    <span className="bg-background rounded-full px-2 py-0.5">{internship.location}</span>
                                    <span>•</span>
                                    <span className="bg-background rounded-full px-2 py-0.5">
                                      {new Date(internship.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - {new Date(internship.endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    {internship.description}
                                  </p>
                                  
                                  <div className="mt-auto flex items-center justify-between pt-2 border-t">
                                    <div className="text-xs text-muted-foreground">
                                      ID: #{internship.id}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 rounded-full bg-primary/5 hover:bg-primary/10 border-none"
                                        onClick={() => {
                                          setEditInternshipData(internship);
                                          editInternshipForm.reset({
                                            title: internship.title,
                                            description: internship.description,
                                            requirements: internship.requirements,
                                            location: internship.location,
                                            startDate: internship.startDate,
                                            endDate: internship.endDate,
                                          });
                                          setIsEditInternshipOpen(true);
                                        }}
                                      >
                                        <Pencil className="h-3.5 w-3.5 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => deleteInternshipMutation.mutate(internship.id)}
                                      >
                                        <Trash className="h-3.5 w-3.5 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
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
                    <div className="mb-6">
                      <div className="relative bg-muted/50 rounded-md p-1">
                        <Select
                          value={selectedInternshipId?.toString() || ''}
                          onValueChange={(value) => setSelectedInternshipId(Number(value))}
                        >
                          <SelectTrigger className="w-full h-12 bg-background border-none shadow-sm">
                            <SelectValue placeholder="Select an internship to view applications" />
                          </SelectTrigger>
                          <SelectContent>
                            {internships.map((internship) => (
                              <SelectItem key={internship.id} value={internship.id.toString()}>
                                {internship.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {applications.length === 0 && selectedInternshipId && (
                      <div className="text-center py-12 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">No applications for this internship yet</p>
                      </div>
                    )}
                    
                    <div className="grid gap-4">
                      {applications.map((application) => (
                        <Card key={application.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div className="p-4 sm:p-6 flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    application.status === "pending" 
                                      ? "bg-yellow-500" 
                                      : application.status === "accepted" 
                                        ? "bg-green-500" 
                                        : "bg-red-500"
                                  }`}></div>
                                  <h3 className="font-semibold">Student ID: {application.studentId}</h3>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="bg-primary/10 rounded-full px-2 py-0.5 text-xs font-medium text-primary">
                                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                    </span>
                                    <span>•</span>
                                    <a 
                                      href={application.resumeUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                      View Resume
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                      </svg>
                                    </a>
                                  </p>
                                </div>
                              </div>
                              
                              {application.status === "pending" && (
                                <div className="bg-muted/30 p-4 sm:p-6 flex flex-row sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                                    onClick={() => updateApplicationMutation.mutate({ id: application.id, status: "accepted" })}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
                                    onClick={() => updateApplicationMutation.mutate({ id: application.id, status: "rejected" })}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {createAccountOpen && (
        <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
          <DialogContent className="sm:max-w-md border-none shadow-xl">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-bold">Create New Account</DialogTitle>
            </DialogHeader>
            <Form {...createAccountForm}>
              <form onSubmit={createAccountForm.handleSubmit((data) => createAccountMutation.mutate(data))} className="space-y-4 py-4">
                <FormField
                  control={createAccountForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Username</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors" 
                          placeholder="Enter a unique username"
                        />
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
                      <FormLabel className="text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors" 
                          placeholder="Enter a secure password"
                        />
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
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors" 
                          placeholder="Enter a valid email address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full font-medium shadow-sm hover:shadow-md transition-all"
                    disabled={createAccountMutation.isPending}
                  >
                    {createAccountMutation.isPending ? (
                      <>
                        <span className="mr-2 inline-block animate-spin">⟳</span> 
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {createInternshipOpen && (
        <Dialog open={createInternshipOpen} onOpenChange={setCreateInternshipOpen}>
          <DialogContent className="sm:max-w-lg border-none shadow-xl">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-bold">Create New Internship</DialogTitle>
            </DialogHeader>
            <Form {...createInternshipForm}>
              <form onSubmit={createInternshipForm.handleSubmit((data) => createInternshipMutation.mutate(data))} className="space-y-5 py-4">
                <FormField
                  control={createInternshipForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Internship Title</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors" 
                          placeholder="e.g. Software Engineering Intern"
                        />
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
                      <FormLabel className="text-sm font-medium">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors h-24 resize-y" 
                          placeholder="Describe the internship role, responsibilities, and expectations"
                        />
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
                      <FormLabel className="text-sm font-medium">Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors h-24 resize-y" 
                          placeholder="List qualifications, skills, and experiences required"
                        />
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
                      <FormLabel className="text-sm font-medium">Location</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors" 
                          placeholder="e.g. New York, NY or Remote"
                        />
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
                        <FormLabel className="text-sm font-medium">Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="bg-muted/30 focus:bg-white transition-colors" 
                          />
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
                        <FormLabel className="text-sm font-medium">End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="bg-muted/30 focus:bg-white transition-colors" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full font-medium shadow-sm hover:shadow-md transition-all"
                    disabled={createInternshipMutation.isPending}
                  >
                    {createInternshipMutation.isPending ? (
                      <>
                        <span className="mr-2 inline-block animate-spin">⟳</span> 
                        Creating...
                      </>
                    ) : (
                      "Create Internship"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {isEditInternshipOpen && (
        <Dialog open={isEditInternshipOpen} onOpenChange={setIsEditInternshipOpen}>
          <DialogContent className="sm:max-w-lg border-none shadow-xl">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-bold">Edit Internship</DialogTitle>
            </DialogHeader>
            <Form {...editInternshipForm}>
              <form onSubmit={editInternshipForm.handleSubmit((data) => updateInternshipMutation.mutate(data))} className="space-y-5 py-4">
                <FormField
                  control={editInternshipForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Internship Title</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editInternshipForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors h-24 resize-y" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editInternshipForm.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors h-24 resize-y" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editInternshipForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Location</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editInternshipForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="bg-muted/30 focus:bg-white transition-colors" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editInternshipForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="bg-muted/30 focus:bg-white transition-colors" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="pt-2 flex gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1 font-medium shadow-sm hover:shadow-md transition-all"
                    disabled={updateInternshipMutation.isPending}
                  >
                    {updateInternshipMutation.isPending ? (
                      <>
                        <span className="mr-2 inline-block animate-spin">⟳</span> 
                        Updating...
                      </>
                    ) : (
                      "Update Internship"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      if (editInternshipData) {
                        deleteInternshipMutation.mutate(editInternshipData.id);
                        setIsEditInternshipOpen(false);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}