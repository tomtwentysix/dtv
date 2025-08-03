import { AdminNavigation } from "@/components/admin-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BarChart3, 
  Users, 
  VideoIcon, 
  Shield, 
  TrendingUp, 
  Upload,
  Settings,
  Eye,
  Loader2,
  Image as ImageIcon
} from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  }) as { data: any, isLoading: boolean };

  const { data: recentMedia, isLoading: mediaLoading } = useQuery({
    queryKey: ["/api/media"],
    select: (data) => (data as any)?.slice(0, 5) || [], // Get last 5 media items
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <AdminNavigation />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your cinematic media production platform
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Link href="/admin/media">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Media</p>
                          <p className="text-3xl font-bold text-accent">{stats?.totalMedia || 0}</p>
                        </div>
                        <VideoIcon className="h-8 w-8 text-accent" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/clients">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Active Clients</p>
                          <p className="text-3xl font-bold text-accent">{stats?.activeClients || 0}</p>
                        </div>
                        <Users className="h-8 w-8 text-accent" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Staff Members</p>
                        <p className="text-3xl font-bold text-accent">{stats?.staffMembers || 0}</p>
                      </div>
                      <Shield className="h-8 w-8 text-accent" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Featured Media</p>
                        <p className="text-3xl font-bold text-accent">{stats?.featuredMedia || 0}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/admin/media?upload=true">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold">Upload Media</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add new content</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/clients">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold">Manage Clients</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Client management</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold">Manage Users</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Staff administration</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/roles">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold">Roles & Permissions</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Access control</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/website-customization">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Settings className="h-8 w-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold">Website Customization</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Background images</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/portfolio">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Eye className="h-8 w-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold">View Portfolio</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Public showcase</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Recent Media Uploads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mediaLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : recentMedia?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No media uploaded yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMedia?.map((media: any) => (
                      <div key={media.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                          {media.type === "video" ? (
                            <VideoIcon className="h-6 w-6 text-accent" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-accent" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{media.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {media.type} • {new Date(media.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {media.isFeatured && (
                          <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Roles</span>
                    <span className="font-semibold">{stats?.totalRoles || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Permissions</span>
                    <span className="font-semibold">{stats?.totalPermissions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Featured Content</span>
                    <span className="font-semibold">{stats?.featuredMedia || 0} items</span>
                  </div>
                  <hr className="my-4" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Quick Actions</h4>
                    <div className="space-y-2">
                      <Link href="/admin/media?upload=true">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload New Media
                        </Button>
                      </Link>
                      <Link href="/admin/users">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Users className="mr-2 h-4 w-4" />
                          Add New User
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
