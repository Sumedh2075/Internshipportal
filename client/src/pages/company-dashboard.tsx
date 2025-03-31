import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInternshipSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2, Trash, Edit, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from 'react';

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
  status: string;
  resumeUrl: string;
  studentName?: string;
}

export default function CompanyDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedInternshipId, setSelectedInternshipId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"internships" | "applications">("internships");
  
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


  const { data: internships = [], isLoading: loadingInternships } = useQuery<Internship[]>({
    queryKey: ["/api/internships/company"],
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: [`/api/applications/internship/${selectedInternshipId}`],
    enabled: !!selectedInternshipId,
  });

  const createInternshipMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Format dates as YYYY-MM-DD strings
        const formattedData = {
          ...data,
          startDate: data.startDate,
          endDate: data.endDate,
        };

        const res = await apiRequest("POST", "/api/internships", formattedData);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to create internship");
        }
        return res.json();
      } catch (error: any) {
        throw new Error(error.message || "Failed to create internship");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships/company"] });
      setCreateOpen(false);
      createInternshipForm.reset();
      toast({ title: "Internship created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create internship", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateInternshipMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/internships/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update internship");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships/company"] });
      toast({
        title: "Success",
        description: "Internship updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update internship",
        variant: "destructive"
      });
    }
  });

  const deleteInternshipMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/internships/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete internship");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships/company"] });
      toast({
        title: "Success",
        description: "Internship deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete internship",
        variant: "destructive"
      });
    }
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/applications/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/internship/${selectedInternshipId}`] });
    },
  });

  const form = useForm({
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

  if (!user || user.role !== "company") {
    return <Redirect to="/auth" />;
  }

  const onSubmit = (data: any) => {
    createInternshipMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Company Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome, {user.username}</p>
          </div>
          <div className="flex gap-4">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setCreateOpen(true)}>Post Internship</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Internship</DialogTitle>
                </DialogHeader>
                <Form {...createInternshipForm}>
                  <form onSubmit={createInternshipForm.handleSubmit(onSubmit)} className="space-y-3">
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
                    <Button type="submit" className="w-full">
                      Create Internship
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="internships">
          <TabsList>
            <TabsTrigger value="internships">Internships</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="internships">
            <Card>
              <CardHeader>
                <CardTitle>Your Internships</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInternships ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {internships?.map((internship: Internship) => (
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
                            <div className="flex gap-2">
                              <Dialog open={editOpen === internship.id} onOpenChange={(open) => setEditOpen(open ? internship.id : null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => {
                                      form.reset({
                                        title: internship.title,
                                        description: internship.description,
                                        requirements: internship.requirements,
                                        location: internship.location,
                                        startDate: internship.startDate.split('T')[0],
                                        endDate: internship.endDate.split('T')[0],
                                      });
                                      setEditOpen(internship.id);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Internship</DialogTitle>
                                  </DialogHeader>
                                  <Form {...form}>
                                    <form
                                      onSubmit={form.handleSubmit(async (data) => {
                                        await updateInternshipMutation.mutate({
                                          id: internship.id,
                                          data: data
                                        });
                                        setEditOpen(null);
                                      })}
                                      className="space-y-4"
                                    >
                                      <FormField
                                        control={form.control}
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
                                        control={form.control}
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
                                        control={form.control}
                                        name="requirements"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Requirements</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
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
                                      <FormField
                                        control={form.control}
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
                                        control={form.control}
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
                                      <Button type="submit" className="w-full">
                                        Save Changes
                                      </Button>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => deleteInternshipMutation.mutate(internship.id)}
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

          <TabsContent value="applications" className="space-y-4">
            <div className="mb-4">
              <select
                className="w-full p-2 border rounded"
                onChange={(e) => setSelectedInternshipId(Number(e.target.value))}
                value={selectedInternshipId || ''}
              >
                <option value="">Select an internship to view applications</option>
                {internships?.map((internship: Internship) => (
                  <option key={internship.id} value={internship.id}>
                    {internship.title}
                  </option>
                ))}
              </select>
            </div>
            {applications?.map((application: Application) => (
              <Card key={application.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold">Student: {application.studentName || `ID: ${application.studentId}`}</h3>
                    <p className="text-sm text-muted-foreground">Resume: <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Resume</a></p>
                    <p className="text-sm text-muted-foreground">Status: {application.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="w-24" onClick={() => updateApplicationMutation.mutate({ id: application.id, status: "accepted" })} disabled={application.status !== "pending"}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="w-24" onClick={() => updateApplicationMutation.mutate({ id: application.id, status: "rejected" })} disabled={application.status !== "pending"}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}