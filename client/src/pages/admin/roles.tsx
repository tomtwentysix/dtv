import { useState } from "react";
import { AdminNavigation } from "@/components/admin-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Shield, Plus, Edit, Trash2, Loader2, Key, GripVertical, ArrowRight, ChevronDown, ChevronUp, X } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  CSS
} from '@dnd-kit/utilities';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRoleSchema, insertPermissionSchema } from "@shared/schema";
import { z } from "zod";

type CreateRoleFormData = z.infer<typeof insertRoleSchema>;
type CreatePermissionFormData = z.infer<typeof insertPermissionSchema>;

// Draggable permission component
function DraggablePermission({ permission }: { permission: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: permission.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-center space-x-2">
        <GripVertical className="h-4 w-4 text-gray-400" />
        <div>
          <div className="font-medium">{permission.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {permission.description}
          </div>
        </div>
      </div>
    </div>
  );
}

// Drop zone for roles
function RoleDropZone({ role, permissions, onDrop, onRemove, onEdit, onDelete }: { role: any; permissions: any[]; onDrop: (permissionId: string, roleId: string) => void; onRemove: (roleId: string, permissionId: string) => void; onEdit?: (roleId: string) => void; onDelete?: (roleId: string) => void }) {
  const isClientRole = role.name === 'Client';
  const isReadOnly = isClientRole;
  
  const { isOver, setNodeRef } = useDroppable({
    id: role.id,
    disabled: isReadOnly,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 transition-all ${
        isReadOnly 
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60' 
          : isOver 
            ? 'border-accent bg-accent/5' 
            : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold flex items-center">
          <Shield className="mr-2 h-4 w-4" />
          {role.name}
          {isReadOnly && (
            <span className="ml-2 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
              Read Only
            </span>
          )}
        </h4>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={isReadOnly}
            onClick={() => !isReadOnly && onEdit && onEdit(role.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={isReadOnly}
            onClick={() => !isReadOnly && onDelete && onDelete(role.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {role.description}
      </p>
      
      <div className="min-h-[100px] space-y-2">
        {isOver && !isReadOnly && (
          <div className="flex items-center justify-center py-4 text-accent">
            <ArrowRight className="mr-2 h-4 w-4" />
            Drop permission here
          </div>
        )}
        {isReadOnly && isOver && (
          <div className="flex items-center justify-center py-4 text-orange-600 dark:text-orange-400">
            <Shield className="mr-2 h-4 w-4" />
            Role is read-only
          </div>
        )}
        {role.permissions?.map((permission: any) => (
          <div key={permission.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <Badge variant="secondary" className="text-xs">
              {permission.name}
            </Badge>
            {!isReadOnly && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onRemove(role.id, permission.id)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        {(!role.permissions || role.permissions.length === 0) && !isOver && (
          <div className="text-center py-4 text-gray-400">
            {isReadOnly ? "Protected role - no permissions" : "Drag permissions here"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminRoles() {
  const { toast } = useToast();
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/roles"],
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/permissions"],
  });

  const createRoleForm = useForm<CreateRoleFormData>({
    resolver: zodResolver(insertRoleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createPermissionForm = useForm<CreatePermissionFormData>({
    resolver: zodResolver(insertPermissionSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: CreateRoleFormData) => {
      const res = await apiRequest("POST", "/api/roles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Role created",
        description: "New role has been successfully created.",
      });
      setIsCreateRoleDialogOpen(false);
      createRoleForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPermissionMutation = useMutation({
    mutationFn: async (data: CreatePermissionFormData) => {
      const res = await apiRequest("POST", "/api/permissions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({
        title: "Permission created",
        description: "New permission has been successfully created.",
      });
      setIsCreatePermissionDialogOpen(false);
      createPermissionForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create permission",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editRoleForm = useForm<CreateRoleFormData>({
    resolver: zodResolver(insertRoleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      await apiRequest("DELETE", `/api/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Role deleted",
        description: "Role has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editRoleMutation = useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: CreateRoleFormData }) => {
      const res = await apiRequest("PUT", `/api/roles/${roleId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Role updated",
        description: "Role has been successfully updated.",
      });
      setIsEditRoleDialogOpen(false);
      setEditingRole(null);
      editRoleForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignPermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      await apiRequest("POST", `/api/roles/${roleId}/permissions/${permissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Permission assigned",
        description: "Permission has been successfully assigned to role.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign permission",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      await apiRequest("DELETE", `/api/roles/${roleId}/permissions/${permissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Permission removed",
        description: "Permission has been successfully removed from role.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove permission",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onCreateRole = (data: CreateRoleFormData) => {
    createRoleMutation.mutate(data);
  };

  const onCreatePermission = (data: CreatePermissionFormData) => {
    createPermissionMutation.mutate(data);
  };

  const onEditRole = (data: CreateRoleFormData) => {
    if (editingRole) {
      editRoleMutation.mutate({ roleId: editingRole.id, data });
    }
  };

  const handleEditRole = (roleId: string) => {
    const role = (roles as any)?.find((r: any) => r.id === roleId);
    if (role) {
      setEditingRole(role);
      editRoleForm.reset({
        name: role.name,
        description: role.description || "",
      });
      setIsEditRoleDialogOpen(true);
    }
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm("Are you sure you want to delete this role?")) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const handleAssignPermission = (permissionId: string, roleId: string) => {
    assignPermissionMutation.mutate({ roleId, permissionId });
  };

  const handleRemovePermission = (roleId: string, permissionId: string) => {
    removePermissionMutation.mutate({ roleId, permissionId });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Check if we're dropping on a role
      const roleId = over.id as string;
      const permissionId = active.id as string;
      
      // Find the role to make sure it exists
      const targetRole = (roles as any)?.find((role: any) => role.id === roleId);
      if (targetRole) {
        handleAssignPermission(permissionId, roleId);
      }
    }
    
    setActiveId(null);
  };

  // Get available permissions (not assigned to any role or available for multiple roles)
  const availablePermissions = (permissions as any)?.filter((permission: any) => {
    // Show all permissions as they can be assigned to multiple roles
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <AdminNavigation />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Roles & Permissions</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage access control and user permissions
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Dialog open={isCreatePermissionDialogOpen} onOpenChange={setIsCreatePermissionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Key className="mr-2 h-4 w-4" />
                    Add Permission
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Permission</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={createPermissionForm.handleSubmit(onCreatePermission)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="permission-name">Permission Name</Label>
                      <Input
                        id="permission-name"
                        {...createPermissionForm.register("name")}
                        placeholder="e.g., upload:media"
                        className={createPermissionForm.formState.errors.name ? "border-destructive" : ""}
                      />
                      {createPermissionForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {createPermissionForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="permission-description">Description</Label>
                      <Textarea
                        id="permission-description"
                        {...createPermissionForm.register("description")}
                        placeholder="Describe what this permission allows"
                        className={createPermissionForm.formState.errors.description ? "border-destructive" : ""}
                      />
                      {createPermissionForm.formState.errors.description && (
                        <p className="text-sm text-destructive">
                          {createPermissionForm.formState.errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreatePermissionDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="btn-primary"
                        disabled={createPermissionMutation.isPending}
                      >
                        {createPermissionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Permission"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={createRoleForm.handleSubmit(onCreateRole)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role-name">Role Name</Label>
                      <Input
                        id="role-name"
                        {...createRoleForm.register("name")}
                        placeholder="Enter role name"
                        className={createRoleForm.formState.errors.name ? "border-destructive" : ""}
                      />
                      {createRoleForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {createRoleForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role-description">Description</Label>
                      <Textarea
                        id="role-description"
                        {...createRoleForm.register("description")}
                        placeholder="Describe this role"
                        className={createRoleForm.formState.errors.description ? "border-destructive" : ""}
                      />
                      {createRoleForm.formState.errors.description && (
                        <p className="text-sm text-destructive">
                          {createRoleForm.formState.errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateRoleDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="btn-primary"
                        disabled={createRoleMutation.isPending}
                      >
                        {createRoleMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Role"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Edit Role Dialog */}
              <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Role</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={editRoleForm.handleSubmit(onEditRole)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-role-name">Role Name</Label>
                      <Input
                        id="edit-role-name"
                        {...editRoleForm.register("name")}
                        placeholder="Enter role name"
                        className={editRoleForm.formState.errors.name ? "border-destructive" : ""}
                      />
                      {editRoleForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {editRoleForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-role-description">Description</Label>
                      <Textarea
                        id="edit-role-description"
                        {...editRoleForm.register("description")}
                        placeholder="Describe this role"
                        className={editRoleForm.formState.errors.description ? "border-destructive" : ""}
                      />
                      {editRoleForm.formState.errors.description && (
                        <p className="text-sm text-destructive">
                          {editRoleForm.formState.errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditRoleDialogOpen(false);
                          setEditingRole(null);
                          editRoleForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="btn-primary"
                        disabled={editRoleMutation.isPending}
                      >
                        {editRoleMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Role"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-white/20 dark:border-gray-800/30 rounded-lg mb-8 shadow-lg">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <ArrowRight className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-800 dark:text-gray-200">How to use</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {showInstructions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            {showInstructions && (
              <div className="px-4 pb-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Drag permissions from the right panel and drop them onto roles in the left panel to assign them. 
                  Click the trash icon next to a permission in a role to remove it. Note: The Client role is read-only and protected from modifications.
                </p>
              </div>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="relative">
              {/* Roles - Drop Zones */}
              <div className="lg:pr-96 space-y-4">
                <h2 className="text-2xl font-bold flex items-center mb-4">
                  <Shield className="mr-2 h-6 w-6" />
                  Roles
                </h2>
                {rolesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (roles as any)?.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No roles found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Create your first role to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(roles as any)?.map((role: any) => (
                      <RoleDropZone
                        key={role.id}
                        role={role}
                        permissions={availablePermissions}
                        onDrop={handleAssignPermission}
                        onRemove={handleRemovePermission}
                        onEdit={handleEditRole}
                        onDelete={handleDeleteRole}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Permissions - Fixed Position Panel */}
              <div className="hidden lg:block fixed top-24 right-8 w-80 h-[calc(100vh-120px)] bg-white dark:bg-gray-900 border rounded-lg shadow-lg">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold flex items-center">
                    <Key className="mr-2 h-5 w-5" />
                    Available Permissions
                  </h2>
                </div>
                <div className="h-[calc(100%-80px)] overflow-y-auto p-4">
                  {permissionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (permissions as any)?.length === 0 ? (
                    <div className="text-center py-8">
                      <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No permissions found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Create your first permission to get started.
                      </p>
                    </div>
                  ) : (
                    <SortableContext items={availablePermissions.map((p: any) => p.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {availablePermissions.map((permission: any) => (
                          <DraggablePermission key={permission.id} permission={permission} />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              </div>

              {/* Mobile Permissions - Show below roles on small screens */}
              <div className="lg:hidden mt-8 space-y-4">
                <h2 className="text-2xl font-bold flex items-center mb-4">
                  <Key className="mr-2 h-6 w-6" />
                  Available Permissions
                </h2>
                <div className="border rounded-lg bg-white dark:bg-gray-900 p-4">
                  {permissionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (permissions as any)?.length === 0 ? (
                    <div className="text-center py-8">
                      <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No permissions found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Create your first permission to get started.
                      </p>
                    </div>
                  ) : (
                    <SortableContext items={availablePermissions.map((p: any) => p.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {availablePermissions.map((permission: any) => (
                          <DraggablePermission key={permission.id} permission={permission} />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              </div>
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-lg opacity-80">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {availablePermissions.find((p: any) => p.id === activeId)?.name}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
