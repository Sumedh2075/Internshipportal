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

export default function CompanyDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const { data: internships, isLoading: loadingInternships } = useQuery({
    queryKey: ["/api/internships/company"],
  });

  const { data: applications } = useQuery({
    queryKey: [`/api/applications/internship/${internships?.[0]?.id}`],
    enabled: !!internships?.[0]?.id,
  });

  const createInternshipMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/internships", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships/company"] });
    },
  });

  const updateInternshipMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/internships/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships/company"] });
    },
  });

  const deleteInternshipMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/internships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships/company"] });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/applications/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/company"] });
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
    const formattedData = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    };
    createInternshipMutation.mutate(formattedData);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Company Dashboard</h1>
          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Post Internship</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Internship</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
                            <Textarea {...field} />
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
                    {internships?.map((internship: any) => (
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
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="icon" variant="outline">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Internship</DialogTitle>
                                  </DialogHeader>
                                  <Form {...form}>
                                    <form 
                                      onSubmit={form.handleSubmit((data) => 
                                        updateInternshipMutation.mutate({ id: internship.id, data })
                                      )} 
                                      className="space-y-4"
                                    >
                                      {/* Same form fields as create */}
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

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Received Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications?.map((application: any) => (
                    <Card key={application.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">Student ID: {application.studentId}</h3>
                            <p className="text-sm">Status: {application.status}</p>
                            <a 
                              href={application.resumeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline"
                            >
                              View Resume
                            </a>
                          </div>
                          {application.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => 
                                  updateApplicationMutation.mutate({ 
                                    id: application.id, 
                                    status: "accepted" 
                                  })
                                }
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => 
                                  updateApplicationMutation.mutate({ 
                                    id: application.id, 
                                    status: "rejected" 
                                  })
                                }
                              >
                                <X className="h-4 w-4 mr-1" />
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
  );
}