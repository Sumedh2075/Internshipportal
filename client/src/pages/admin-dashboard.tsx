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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { z } from "zod";

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
  companyId: number;
  companyName?: string;
}

interface Application {
  id: number;
  studentId: string;
  internshipId: number;
  status: string;
  resumeUrl: string;
  appliedAt?: string;
  internshipTitle?: string;
  studentName?: string;
}

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedInternshipId, setSelectedInternshipId] = useState<number | null>(null);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [createInternshipOpen, setCreateInternshipOpen] = useState(false);
  const [isEditInternshipOpen, setIsEditInternshipOpen] = useState(false);
  const [editInternshipData, setEditInternshipData] = useState<Internship | null>(null);
  const [selectedRole, setSelectedRole] = useState("student");

  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: internships = [], isLoading: loadingInternships } = useQuery<Internship[]>({
    queryKey: ["/api/internships"],
  });

  const { data: internshipApplications = [] } = useQuery<Application[]>({
    queryKey: [`/api/applications/internship/${selectedInternshipId}`],
    enabled: !!selectedInternshipId,
  });

  const { data: allApplications = [], isLoading: loadingApplications } = useQuery<Application[]>({
    queryKey: ["/api/admin/applications"],
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
  
  const createAccountForm = useForm({
    resolver: zodResolver(
      insertUserSchema.extend({
        role: z.enum(["student", "company", "admin"]).default("student"),
      })
    ),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      role: "student" as "student" | "company" | "admin",
    },
  });

  const createInternshipForm = useForm({
    resolver: zodResolver(
      insertInternshipSchema.extend({
        companyId: z.number().optional(),
      })
    ),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      requirements: "",
      startDate: "",
      endDate: "",
      companyId: undefined,
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({ title: "Application status updated" });
    },
  });
  
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/internship/${selectedInternshipId}`] });
      toast({ title: "Application deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete application", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const exportApplications = async () => {
    const response = await fetch("/api/admin/applications/export");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications.xlsx";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const createAccountMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertUserSchema>) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreateAccountOpen(false);
      createAccountForm.reset();
      toast({ title: "Account created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create account", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const createInternshipMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/internships", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships"] });
      setCreateInternshipOpen(false);
      createInternshipForm.reset();
      toast({ title: "Internship created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create internship", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const editInternshipForm = useForm({
    resolver: zodResolver(insertInternshipSchema.partial()),
    defaultValues: {
      title: editInternshipData?.title,
      description: editInternshipData?.description,
      location: editInternshipData?.location,
      requirements: editInternshipData?.requirements,
      startDate: editInternshipData?.startDate,
      endDate: editInternshipData?.endDate,
    },
  });

  const handleEditInternship = (internship: Internship) => {
    setEditInternshipData(internship);
    editInternshipForm.reset({
      title: internship.title,
      description: internship.description,
      location: internship.location,
      requirements: internship.requirements,
      startDate: internship.startDate,
      endDate: internship.endDate,
    });
    setIsEditInternshipOpen(true);
  };

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const studentCount = users.filter(u => u.role === "student").length;
  const companyCount = users.filter(u => u.role === "company").length;
  const internshipCount = internships.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.username}!</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>Logout</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="py-6 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Students</p>
                  <h2 className="text-3xl font-bold mt-1 text-slate-800">{studentCount}</h2>
                </div>
                <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="py-6 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Companies</p>
                  <h2 className="text-3xl font-bold mt-1 text-slate-800">{companyCount}</h2>
                </div>
                <div className="w-12 h-12 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="py-6 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Internships</p>
                  <h2 className="text-3xl font-bold mt-1 text-slate-800">{internshipCount}</h2>
                </div>
                <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold">System Management</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => setCreateAccountOpen(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Add New Account
                </Button>
                <Button 
                  onClick={() => setCreateInternshipOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Internship
                </Button>
              </div>
            </div>

            <Tabs defaultValue="users" className="h-full space-y-6">
              <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-3 h-auto p-1">
                <TabsTrigger value="users" className="text-sm">Users</TabsTrigger>
                <TabsTrigger value="internships" className="text-sm">Internships</TabsTrigger>
                <TabsTrigger value="applications" className="text-sm">Applications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>All Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingUsers ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No users found
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {users.map((user) => (
                          <Card key={user.id} className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                            <CardContent className="p-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="p-4 sm:p-6 flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${
                                      user.role === "admin" 
                                        ? "bg-purple-500" 
                                        : user.role === "company" 
                                          ? "bg-amber-500" 
                                          : "bg-emerald-500"
                                    }`}></div>
                                    <h3 className="font-medium text-slate-800">{user.username}</h3>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                      <span className="bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
                                        {user.role}
                                      </span>
                                      <span>•</span>
                                      <span className="text-slate-500">{user.email}</span>
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="bg-slate-50 p-4 sm:p-6 flex flex-row sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-slate-100">
                                  {user.role !== "admin" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to delete ${user.username}?`)) {
                                          deleteUserMutation.mutate(user.id);
                                        }
                                      }}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  )}
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
              
              <TabsContent value="internships">
                <Card>
                  <CardHeader>
                    <CardTitle>All Internships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingInternships ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : internships.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No internships found
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {internships.map((internship) => (
                          <Card key={internship.id} className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                            <CardContent className="p-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="p-4 sm:p-6 flex-1">
                                  <div className="mb-2">
                                    <h3 className="font-medium text-slate-800">{internship.title}</h3>
                                    <p className="text-sm text-slate-500">
                                      Company: {internship.companyName || `ID: ${internship.companyId}`}
                                    </p>
                                  </div>
                                  <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                                    {internship.description}
                                  </p>
                                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                    <span className="bg-slate-100 px-2 py-1 rounded">
                                      Location: {internship.location}
                                    </span>
                                    <span className="bg-slate-100 px-2 py-1 rounded">
                                      Start: {new Date(internship.startDate).toLocaleDateString()}
                                    </span>
                                    <span className="bg-slate-100 px-2 py-1 rounded">
                                      End: {new Date(internship.endDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="bg-slate-50 p-4 sm:p-6 flex flex-row sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-slate-100">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    onClick={() => handleEditInternship(internship)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                    onClick={() => {
                                      if (window.confirm("Are you sure you want to delete this internship?")) {
                                        deleteInternshipMutation.mutate(internship.id);
                                      }
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
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
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle>All Applications</CardTitle>
                    <Button variant="outline" onClick={exportApplications} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export to Excel
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loadingApplications ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : allApplications.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No applications found in the system
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                          {allApplications.map((application) => {
                            // Find the associated internship
                            const internship = internships.find(i => i.id === application.internshipId);
                            // Find the student
                            const student = users.find(u => u.id === Number(application.studentId));
                            
                            return (
                              <Card key={application.id} className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                                <CardContent className="p-0">
                                  <div className="bg-slate-50 p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div>
                                        <h3 className="font-medium text-slate-800">
                                          <span>
                                            Application for: <span className="font-semibold">{application.internshipTitle || internship?.title || `Internship ID: ${application.internshipId}`}</span>
                                          </span>
                                        </h3>
                                        <div className="text-sm mt-1 text-slate-500">
                                          By: <span className="font-medium">{application.studentName || student?.username || `Student ID: ${application.studentId}`}</span>
                                        </div>
                                        {(internship || application.internshipTitle) && (
                                          <div className="text-sm mt-1 text-slate-500">
                                            Company: <span className="font-medium">{internship?.companyName || "Unknown"}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          className={cn(
                                            "text-xs px-2 py-1 rounded-full font-medium",
                                            application.status === "pending" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                                            application.status === "accepted" && "bg-green-100 text-green-800 hover:bg-green-100",
                                            application.status === "rejected" && "bg-red-100 text-red-800 hover:bg-red-100"
                                          )}
                                        >
                                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                        </Badge>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-7 w-7 p-0"
                                          onClick={() => {
                                            if (window.confirm("Are you sure you want to delete this application?")) {
                                              deleteApplicationMutation.mutate(application.id);
                                            }
                                          }}
                                        >
                                          <Trash className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <p className="text-sm text-slate-600 mb-2">
                                      <span className="font-medium">Resume:</span>{' '}
                                      <a 
                                        href={application.resumeUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-primary hover:underline"
                                      >
                                        {application.resumeUrl}
                                      </a>
                                    </p>
                                    {application.appliedAt && (
                                      <p className="text-xs text-slate-500">
                                        Applied on: {new Date(application.appliedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                        
                        <div className="mt-8">
                          <h3 className="font-medium text-lg mb-4">Filter Applications by Internship</h3>
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
                                    {internship.title} - {internship.companyName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {selectedInternshipId ? (
                          <div className="mt-6">
                            <h3 className="font-medium text-lg mb-4">
                              Applications for: {internships.find(i => i.id === selectedInternshipId)?.title}
                            </h3>
                            
                            {internshipApplications.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                No applications for this internship
                              </div>
                            ) : (
                              <div className="grid gap-4">
                                {internshipApplications.map((application) => (
                                  <Card key={application.id} className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                                    <CardContent className="p-0">
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div className="p-4 sm:p-6 flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${
                                              application.status === "pending" 
                                                ? "bg-amber-400" 
                                                : application.status === "accepted" 
                                                  ? "bg-emerald-500" 
                                                  : "bg-rose-500"
                                            }`}></div>
                                            <h3 className="font-medium text-slate-800">Student: {application.studentName || `ID: ${application.studentId}`}</h3>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-sm text-slate-500 flex items-center gap-2">
                                              <span className="bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-xs font-medium text-slate-700">
                                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                              </span>
                                              <span>•</span>
                                              <a 
                                                href={application.resumeUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-slate-700 hover:text-slate-900 hover:underline inline-flex items-center gap-1"
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
                                          <div className="bg-slate-50 p-4 sm:p-6 flex flex-row sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-slate-100">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 w-full"
                                              onClick={() => updateApplicationMutation.mutate({ id: application.id, status: "accepted" })}
                                            >
                                              Accept
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 w-full"
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
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
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
                <FormField
                  control={createAccountForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Role</FormLabel>
                      <Select
                        onValueChange={(value: "student" | "company" | "admin") => field.onChange(value)}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-muted/30 focus:bg-white transition-colors">
                            <SelectValue placeholder="Select a role" />
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
              <form onSubmit={createInternshipForm.handleSubmit((data) => createInternshipMutation.mutate(data))} className="space-y-4 py-4">
                <FormField
                  control={createInternshipForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Title</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors" 
                          placeholder="Enter internship title"
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
                          className="bg-muted/30 focus:bg-white transition-colors min-h-[100px]" 
                          placeholder="Enter internship description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            placeholder="City, Country"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company</label>
                    <select 
                      className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm shadow-sm transition-colors focus:bg-white"
                      onChange={(e) => {
                        if (e.target.value) {
                          createInternshipForm.setValue("companyId" as any, Number(e.target.value));
                        }
                      }}
                    >
                      <option value="">Select a company</option>
                      {users
                        .filter(user => user.role === "company")
                        .map(company => (
                          <option key={company.id} value={company.id}>
                            {company.username}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>
                <FormField
                  control={createInternshipForm.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors min-h-[80px]" 
                          placeholder="Enter internship requirements"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {isEditInternshipOpen && editInternshipData && (
        <Dialog open={isEditInternshipOpen} onOpenChange={setIsEditInternshipOpen}>
          <DialogContent className="sm:max-w-lg border-none shadow-xl">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-bold">Edit Internship</DialogTitle>
            </DialogHeader>
            <Form {...editInternshipForm}>
              <form onSubmit={editInternshipForm.handleSubmit((data) => updateInternshipMutation.mutate(data))} className="space-y-4 py-4">
                <FormField
                  control={editInternshipForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Title</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-muted/30 focus:bg-white transition-colors" 
                          placeholder="Enter internship title"
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
                          className="bg-muted/30 focus:bg-white transition-colors min-h-[100px]" 
                          placeholder="Enter internship description"
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
                          placeholder="City, Country"
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
                          className="bg-muted/30 focus:bg-white transition-colors min-h-[80px]" 
                          placeholder="Enter internship requirements"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full font-medium shadow-sm hover:shadow-md transition-all"
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
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}