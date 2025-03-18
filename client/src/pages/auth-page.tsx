import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useState } from "react";
import { Building2, GraduationCap, LockKeyhole } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const form = useForm({
    resolver: zodResolver(isLogin 
      ? insertUserSchema.pick({ username: true, password: true })
      : insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "student",
      name: "",
      email: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const onSubmit = (data: any) => {
    if (isLogin) {
      loginMutation.mutate(data);
    } else {
      registerMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? "login" : "register"} onValueChange={(v) => setIsLogin(v === "login")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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

                  {!isLogin && (
                    <>
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
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
                    </>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending || registerMutation.isPending}
                  >
                    {isLogin ? "Login" : "Register"}
                  </Button>
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>

        <div className="hidden md:flex flex-col justify-center space-y-6">
          <h1 className="text-4xl font-bold">Internship Portal</h1>
          <p className="text-lg text-muted-foreground">
            Connect with opportunities and talent. Your career journey starts here.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">For Students</h3>
                <p className="text-sm text-muted-foreground">Find internships matching your skills</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">For Companies</h3>
                <p className="text-sm text-muted-foreground">Post internships and find great talent</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Secure Platform</h3>
                <p className="text-sm text-muted-foreground">Your data is safe with us</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
