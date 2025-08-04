import { useState } from "react";
import { AdminNavigation } from "@/components/admin-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Edit, Trash2, Loader2, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const createUserSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function AdminUsers() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: roles } = useQuery({
    queryKey: ["/api/roles"],
  });

  const createUserForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      forename: "",
      surname: "",
      displayName: "",
    },
  });

  const editUserForm = useForm({
    defaultValues: {
      username: "",
      email: "",
      forename: "",
      surname: "",
      displayName: "",
      isActive: true,
      selectedRoles: [] as string[],
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: Omit<CreateUserFormData, "confirmPassword">) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User created",
        description: "New user has been successfully created.",
      });
      setIsCreateDialogOpen(false);
      createUserForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onCreateUser = (data: CreateUserFormData) => {
    const { confirmPassword, ...userData } = data;
    // Auto-generate display name if not provided
    if (!userData.displayName && userData.forename && userData.surname) {
      userData.displayName = `${userData.forename} ${userData.surname}`;
    }
    createUserMutation.mutate(userData);
  };

  const editUserMutation = useMutation({
    mutationFn: async (data: { id: string; username: string; email: string; forename: string; surname: string; displayName: string; isActive: boolean; selectedRoles: string[] }) => {
      // Update basic user info
      const userRes = await apiRequest("PUT", `/api/users/${data.id}`, {
        username: data.username,
        email: data.email,
        forename: data.forename,
        surname: data.surname,
        displayName: data.displayName,
        isActive: data.isActive,
      });
      
      // Update user roles
      const rolesRes = await apiRequest("PUT", `/api/users/${data.id}/roles`, {
        roleIds: data.selectedRoles,
      });
      
      return userRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User updated",
        description: "User has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    editUserForm.reset({
      username: user.username,
      email: user.email,
      forename: user.forename || "",
      surname: user.surname || "",
      displayName: user.displayName || "",
      isActive: user.isActive ?? true,
      selectedRoles: user.roles?.map((role: any) => role.id) || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const onEditUser = (data: { username: string; email: string; forename: string; surname: string; displayName: string; isActive: boolean; selectedRoles: string[] }) => {
    if (editingUser) {
      editUserMutation.mutate({
        id: editingUser.id,
        username: data.username,
        email: data.email,
        forename: data.forename,
        surname: data.surname,
        displayName: data.displayName,
        isActive: data.isActive,
        selectedRoles: data.selectedRoles,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <AdminNavigation />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">User Management</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage users, roles, and permissions
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={createUserForm.handleSubmit(onCreateUser)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="forename">First Name</Label>
                      <Input
                        id="forename"
                        {...createUserForm.register("forename", { 
                          onChange: (e) => {
                            const forename = e.target.value;
                            const surname = createUserForm.getValues("surname");
                            if (forename && surname) {
                              createUserForm.setValue("displayName", `${forename} ${surname}`);
                            }
                          }
                        })}
                        placeholder="Enter first name"
                        className={createUserForm.formState.errors.forename ? "border-destructive" : ""}
                      />
                      {createUserForm.formState.errors.forename && (
                        <p className="text-sm text-destructive">
                          {createUserForm.formState.errors.forename.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="surname">Last Name</Label>
                      <Input
                        id="surname"
                        {...createUserForm.register("surname", { 
                          onChange: (e) => {
                            const surname = e.target.value;
                            const forename = createUserForm.getValues("forename");
                            if (forename && surname) {
                              createUserForm.setValue("displayName", `${forename} ${surname}`);
                            }
                          }
                        })}
                        placeholder="Enter last name"
                        className={createUserForm.formState.errors.surname ? "border-destructive" : ""}
                      />
                      {createUserForm.formState.errors.surname && (
                        <p className="text-sm text-destructive">
                          {createUserForm.formState.errors.surname.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      {...createUserForm.register("displayName")}
                      placeholder="Auto-populated from first and last name"
                      className={createUserForm.formState.errors.displayName ? "border-destructive" : ""}
                    />
                    {createUserForm.formState.errors.displayName && (
                      <p className="text-sm text-destructive">
                        {createUserForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...createUserForm.register("username")}
                      placeholder="Enter username"
                      className={createUserForm.formState.errors.username ? "border-destructive" : ""}
                    />
                    {createUserForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {createUserForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...createUserForm.register("email")}
                      placeholder="Enter email"
                      className={createUserForm.formState.errors.email ? "border-destructive" : ""}
                    />
                    {createUserForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {createUserForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...createUserForm.register("password")}
                      placeholder="Enter password"
                      className={createUserForm.formState.errors.password ? "border-destructive" : ""}
                    />
                    {createUserForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {createUserForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...createUserForm.register("confirmPassword")}
                      placeholder="Confirm password"
                      className={createUserForm.formState.errors.confirmPassword ? "border-destructive" : ""}
                    />
                    {createUserForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {createUserForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="btn-primary"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create User"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                All Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : users?.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No users found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Get started by creating your first user.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-foreground font-medium text-sm">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{user.displayName || user.username}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role: any) => (
                              <Badge key={role.id} variant="secondary">
                                <Shield className="mr-1 h-3 w-3" />
                                {role.name}
                              </Badge>
                            )) || (
                              <Badge variant="outline">No roles assigned</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.isActive ? "default" : "secondary"} 
                            className={user.isActive 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                            }
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <form onSubmit={editUserForm.handleSubmit(onEditUser)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-forename">First Name</Label>
                    <Input
                      id="edit-forename"
                      {...editUserForm.register("forename", { 
                        onChange: (e) => {
                          const forename = e.target.value;
                          const surname = editUserForm.getValues("surname");
                          if (forename && surname) {
                            editUserForm.setValue("displayName", `${forename} ${surname}`);
                          }
                        }
                      })}
                      placeholder="Enter first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-surname">Last Name</Label>
                    <Input
                      id="edit-surname"
                      {...editUserForm.register("surname", { 
                        onChange: (e) => {
                          const surname = e.target.value;
                          const forename = editUserForm.getValues("forename");
                          if (forename && surname) {
                            editUserForm.setValue("displayName", `${forename} ${surname}`);
                          }
                        }
                      })}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-displayName">Display Name</Label>
                  <Input
                    id="edit-displayName"
                    {...editUserForm.register("displayName")}
                    placeholder="Display name shown in navigation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    {...editUserForm.register("username")}
                    placeholder="Enter username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    {...editUserForm.register("email")}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-active"
                      checked={editUserForm.watch("isActive")}
                      onCheckedChange={(checked) => editUserForm.setValue("isActive", !!checked)}
                    />
                    <Label htmlFor="edit-active" className="cursor-pointer">
                      Account Active
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inactive users cannot log in to the system
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Roles</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {roles?.map((role: any) => {
                      const isChecked = editUserForm.watch("selectedRoles").includes(role.id);
                      return (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const currentRoles = editUserForm.getValues("selectedRoles");
                              if (checked) {
                                editUserForm.setValue("selectedRoles", [...currentRoles, role.id]);
                              } else {
                                editUserForm.setValue("selectedRoles", currentRoles.filter(id => id !== role.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`role-${role.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {role.name}
                          </label>
                          {role.description && (
                            <span className="text-xs text-muted-foreground">
                              - {role.description}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-primary"
                    disabled={editUserMutation.isPending}
                  >
                    {editUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update User"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete User Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete the user "{userToDelete?.username}"? This action cannot be undone.
                </p>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
                    disabled={deleteUserMutation.isPending}
                  >
                    {deleteUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete User"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
