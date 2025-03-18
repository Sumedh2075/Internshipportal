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
import { Loader2 } from "lucide-react";

export default function CompanyDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: internships, isLoading } = useQuery({
    queryKey: ["/api/internships/company"],
  });

  const { data: applications } = useQuery({
    queryKey: ["/api/applications/company"],
  });

  const createInternshipMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/internships", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships/company"] });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertInternshipSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      location: "",
      deadline: new Date().toISOString().split("T")[0],
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
          <h1 className="text-3xl font-bold">Company Dashboard</h1>
          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Post Internship</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Internship</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deadline</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={createInternshipMutation.isPending}>
                      {createInternshipMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create Internship"
                      )}
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

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Internships</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {internships?.map((internship: any) => (
                    <Card key={internship.id}>
                      <CardContent className="pt-6">
                        <h3 className="font-semibold">{internship.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {internship.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applications?.map((application: any) => (
                <Card key={application.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Application #{application.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          Status: {application.status}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            // Handle accept/reject
                            null
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            // Handle reject
                            null
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
