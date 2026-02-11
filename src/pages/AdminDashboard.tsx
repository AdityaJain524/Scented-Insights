import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  FileText,
  Flag,
  Award,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  expertise_level: 'beginner' | 'explorer' | 'enthusiast' | 'expert' | null;
  credibility_score: number;
  created_at: string;
}

interface FlaggedPost {
  id: string;
  post_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  post?: {
    fragrance_name: string;
    author_id: string;
  };
  flagged_by_profile?: {
    display_name: string;
  };
}

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  pendingFlags: number;
  expertsCount: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin, activeTab]);

  const checkAdminRole = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator']);

      if (error) throw error;

      setIsAdmin(data && data.length > 0);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const [usersRes, postsRes, flagsRes, expertsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('fragrance_posts').select('id', { count: 'exact', head: true }),
        supabase.from('flagged_posts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('expertise_level', 'expert'),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalPosts: postsRes.count || 0,
        pendingFlags: flagsRes.count || 0,
        expertsCount: expertsRes.count || 0,
      });

      // Fetch users
      if (activeTab === 'users') {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        setUsers(usersData || []);
      }

      // Fetch flagged posts
      if (activeTab === 'flags') {
        const { data: flagsData } = await supabase
          .from('flagged_posts')
          .select(`
            *,
            post:fragrance_posts(fragrance_name, author_id)
          `)
          .order('created_at', { ascending: false });
        setFlaggedPosts(flagsData || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserExpertise = async (userId: string, level: 'beginner' | 'explorer' | 'enthusiast' | 'expert') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ expertise_level: level })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'User updated',
        description: 'Expertise level has been updated.',
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user.',
        variant: 'destructive',
      });
    }
  };

  const assignBadge = async (userId: string, badgeType: string, name: string, description: string) => {
    try {
      const { error } = await supabase.from('badges').insert({
        user_id: userId,
        badge_type: badgeType,
        name,
        description,
      });

      if (error) throw error;

      toast({
        title: 'Badge assigned',
        description: `${name} badge has been assigned.`,
      });
    } catch (error) {
      console.error('Error assigning badge:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign badge.',
        variant: 'destructive',
      });
    }
  };

  const updateFlagStatus = async (flagId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('flagged_posts')
        .update({ 
          status, 
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', flagId);

      if (error) throw error;

      toast({
        title: 'Flag updated',
        description: `Flag has been ${status}.`,
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error updating flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flag.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, moderate content, and assign badges.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalPosts}</p>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Flag className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingFlags}</p>
                    <p className="text-sm text-muted-foreground">Pending Flags</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.expertsCount}</p>
                    <p className="text-sm text-muted-foreground">Experts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="flags" className="gap-2">
              <Flag className="h-4 w-4" />
              Flagged Posts
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="h-4 w-4" />
              Badges
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Expertise</TableHead>
                        <TableHead>Credibility</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={u.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(u.display_name)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{u.display_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>@{u.username}</TableCell>
                          <TableCell>
                            <Select
                              value={u.expertise_level || 'beginner'}
                              onValueChange={(v) => updateUserExpertise(u.user_id, v as 'beginner' | 'explorer' | 'enthusiast' | 'expert')}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="explorer">Explorer</SelectItem>
                                <SelectItem value="enthusiast">Enthusiast</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{u.credibility_score || 0}%</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Award className="h-4 w-4 mr-1" />
                                  Badge
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assign Badge</DialogTitle>
                                  <DialogDescription>
                                    Choose a badge to assign to {u.display_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-3 py-4">
                                  <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() =>
                                      assignBadge(
                                        u.user_id,
                                        'verified-reviewer',
                                        'Verified Reviewer',
                                        'Expert-verified reviewer with consistently accurate information'
                                      )
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                    Verified Reviewer
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() =>
                                      assignBadge(
                                        u.user_id,
                                        'expert',
                                        'Community Expert',
                                        'Recognized expert in the fragrance community'
                                      )
                                    }
                                  >
                                    <Award className="h-4 w-4 mr-2 text-amber-500" />
                                    Community Expert
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() =>
                                      assignBadge(
                                        u.user_id,
                                        'sustainability-champion',
                                        'Sustainability Champion',
                                        'Advocate for sustainable fragrance practices'
                                      )
                                    }
                                  >
                                    <span className="mr-2">🌿</span>
                                    Sustainability Champion
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flagged Posts Tab */}
          <TabsContent value="flags">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : flaggedPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No flagged posts to review</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Post</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flaggedPosts.map((flag) => (
                        <TableRow key={flag.id}>
                          <TableCell className="font-medium">
                            {flag.post?.fragrance_name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{flag.reason}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {flag.details || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                flag.status === 'pending'
                                  ? 'secondary'
                                  : flag.status === 'approved'
                                  ? 'default'
                                  : 'outline'
                              }
                            >
                              {flag.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(flag.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {flag.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-600"
                                  onClick={() => updateFlagStatus(flag.id, 'approved')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive"
                                  onClick={() => updateFlagStatus(flag.id, 'rejected')}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Badge Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-2 border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Verified Reviewer</h4>
                          <p className="text-xs text-muted-foreground">
                            Accuracy-verified content
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Award to users with consistently accurate and helpful reviews.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Award className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Community Expert</h4>
                          <p className="text-xs text-muted-foreground">
                            Recognized expertise
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Award to fragrance professionals or highly credible enthusiasts.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <span className="text-lg">🌿</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">Sustainability Champion</h4>
                          <p className="text-xs text-muted-foreground">
                            Eco-conscious advocate
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Award to users promoting sustainable fragrance practices.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
