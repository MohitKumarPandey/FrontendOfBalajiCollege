import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  Activity,
  ShieldAlert
} from 'lucide-react';
import { api } from '@/lib/api';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/system/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-red-500">Failed to load dashboard statistics. Ensure backend is running.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your document screening operations and risk metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyzed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_analyses}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.analyses_this_week} this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_analyses}</div>
            <p className="text-xs text-muted-foreground">
              Currently in pipeline
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Review Needed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.review_required}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting human decision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Found</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {(stats.risk_distribution?.high || 0) + (stats.risk_distribution?.critical || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Potential forgeries detected
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>
              Latest documents processed by the screening engine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!stats.recent_analyses || stats.recent_analyses.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">No recent analyses found.</div>
              ) : (
                stats.recent_analyses.map((analysis: any) => (
                  <div key={analysis.id} className="flex items-center p-3 rounded-lg border bg-card/50">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{analysis.analysis_number}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {analysis.original_filename}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </div>
                      <Badge 
                        variant={
                          analysis.risk_level === 'low' ? 'success' : 
                          analysis.risk_level === 'medium' ? 'warning' : 
                          analysis.risk_level === 'insufficient' ? 'outline' :
                          'destructive'
                        }
                      >
                        {analysis.risk_level ? analysis.risk_level.toUpperCase() : 'UNKNOWN'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Backend services and AI model status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Database Connection</span>
                <Badge variant="success" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Online</Badge>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Aadhaar AI Model</span>
                <Badge variant="success" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">PAN AI Model</span>
                <Badge variant="success" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Avg Processing Time</span>
                <span className="text-sm font-medium text-blue-400">
                  {stats.avg_processing_time_ms ? `${(stats.avg_processing_time_ms / 1000).toFixed(2)}s` : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
