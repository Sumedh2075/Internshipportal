import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useState } from "react";
import { Building2, GraduationCap, KeyRound, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(
      isLogin
        ? insertUserSchema.pick({ username: true, password: true })
        : insertUserSchema
    ),
    defaultValues: {
      username: "",
      password: "",
      role: "student",
      name: "",
      email: "",
      studentId: ""
    },
  });

  const resetPasswordForm = useForm({
    resolver: zodResolver(
      insertUserSchema.pick({ username: true, password: true })
    ),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const onSubmit = (data: any) => {
    if (isLogin) {
      loginMutation.mutate(data);
    } else {
      if (data.role === "student") {
        if (!data.name) {
          toast({
            title: "Name is required for students",
            variant: "destructive",
          });
          return;
        }
        // Use studentId as username for students
        data.username = data.studentId;
      }
      registerMutation.mutate(data);
    }
  };

  const onResetPassword = async (data: any) => {
    try {
      await apiRequest("POST", "/api/reset-password", data);
      toast({
        title: "Password reset successful",
        description: "You can now login with your new password",
      });
      setShowResetPassword(false);
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
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
                    name={isLogin ? "username" : (selectedRole === "student" ? "studentId" : "username")}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isLogin ? (selectedRole === "student" ? "Student ID" : "Username") : (selectedRole === "student" ? "Student ID" : "Username")}</FormLabel>
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
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
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
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedRole(value);
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
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

                      {selectedRole === "student" && (
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
                      )}

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

                  {isLogin && (
                    <div className="text-center">
                      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-sm">
                            Forgot password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                          </DialogHeader>
                          <Form {...resetPasswordForm}>
                            <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                              <FormField
                                control={resetPasswordForm.control}
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
                                control={resetPasswordForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Input 
                                          type={showNewPassword ? "text" : "password"} 
                                          {...field} 
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="absolute right-0 top-0 h-full px-3"
                                          onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" className="w-full">
                                Reset Password
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
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
              <KeyRound className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Secure Access</h3>
                <p className="text-sm text-muted-foreground">Simple and secure authentication</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}