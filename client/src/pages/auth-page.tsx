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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        <Card className="w-full border border-slate-100 shadow-md transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-medium text-slate-800">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs 
              value={isLogin ? "login" : "register"} 
              onValueChange={(v) => setIsLogin(v === "login")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100">
                <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm transition-all duration-200">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm transition-all duration-200">Register</TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                    <FormField
                      control={form.control}
                      name={isLogin ? "username" : (selectedRole === "student" ? "studentId" : "username")}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {isLogin ? (selectedRole === "student" ? "Student ID" : "Username") : (selectedRole === "student" ? "Student ID" : "Username")}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-muted/30 focus:bg-white transition-colors"
                              placeholder={isLogin ? "Enter your username" : (selectedRole === "student" ? "Enter your student ID" : "Choose a username")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500 delay-100">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                {...field} 
                                className="bg-muted/30 focus:bg-white transition-colors"
                                placeholder={isLogin ? "Enter your password" : "Create a secure password"}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
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
                  </div>

                  {!isLogin && (
                    <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-5 duration-500 delay-200">
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">I am a...</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedRole(value);
                              }}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-muted/30 focus:bg-white transition-colors">
                                  <SelectValue placeholder="Select your role" />
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

                      {selectedRole === "student" && (
                        <div className="animate-in fade-in-50 slide-in-from-right-5 duration-300">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="bg-muted/30 focus:bg-white transition-colors"
                                    placeholder="Enter your full name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  {...field} 
                                  className="bg-muted/30 focus:bg-white transition-colors"
                                  placeholder="Enter your email address"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 animate-in fade-in-50 slide-in-from-bottom-5 duration-500 delay-300">
                    <Button 
                      type="submit" 
                      className="w-full font-medium bg-slate-800 hover:bg-slate-700 text-white shadow-none hover:shadow-sm transition-all"
                      disabled={loginMutation.isPending || registerMutation.isPending}
                    >
                      {isLogin ? "Sign In" : "Create Account"}
                      {(loginMutation.isPending || registerMutation.isPending) && (
                        <span className="ml-2 inline-block animate-spin">⟳</span>
                      )}
                    </Button>
                  </div>

                  {isLogin && (
                    <div className="text-center animate-in fade-in-50 slide-in-from-bottom-5 duration-500 delay-400">
                      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-sm text-primary/80 hover:text-primary transition-colors">
                            Forgot password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md shadow-xl border-none">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Reset Your Password</DialogTitle>
                          </DialogHeader>
                          <Form {...resetPasswordForm}>
                            <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                              <FormField
                                control={resetPasswordForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">Username</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        className="bg-muted/30 focus:bg-white transition-colors"
                                        placeholder="Enter your username"
                                      />
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
                                    <FormLabel className="text-sm font-medium">New Password</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Input 
                                          type={showNewPassword ? "text" : "password"} 
                                          {...field} 
                                          className="bg-muted/30 focus:bg-white transition-colors"
                                          placeholder="Enter your new password"
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
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
                              <Button 
                                type="submit" 
                                className="w-full font-medium shadow-sm hover:shadow-md transition-all"
                              >
                                Reset Password
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Demo: username: "admin", password: "admin123"
                      </p>
                    </div>
                  )}
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>

        <div className="hidden md:flex flex-col justify-center space-y-6 bg-slate-50 p-8 rounded-lg border border-slate-100 transition-all duration-300">
          <h1 className="text-3xl font-semibold text-slate-800">InternConnect</h1>
          <p className="text-base text-slate-600">
            Connect with opportunities and talent. Your career journey starts here.
          </p>
          <div className="grid grid-cols-1 gap-6 mt-4">
            <div className="flex items-center gap-4 group">
              <div className="p-2.5 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors duration-300">
                <GraduationCap className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800 group-hover:text-primary transition-colors duration-300">For Students</h3>
                <p className="text-sm text-slate-500">Find internships matching your skills and career goals</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2.5 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors duration-300">
                <Building2 className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800 group-hover:text-primary transition-colors duration-300">For Companies</h3>
                <p className="text-sm text-slate-500">Post internships and connect with talented students</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2.5 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors duration-300">
                <KeyRound className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800 group-hover:text-primary transition-colors duration-300">Secure Access</h3>
                <p className="text-sm text-slate-500">Robust authentication and role-based permissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}