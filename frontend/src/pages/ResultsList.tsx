import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Filter,
  Clock,
  ChevronRight,
  ArrowUpDown,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Upload,
} from 'lucide-react';
import { api } from '@/lib/api';

const RISK_CONFIG: Record<string, { variant: 'destructive' | 'warning' | 'success' | 'outline'; label: string }> = {
  critical: { variant: 'destructive', label: 'CRITICAL' },
  high:     { variant: 'destructive', label: 'HIGH' },
  medium:   { variant: 'warning',     label: 'MEDIUM' },
  low:      { variant: 'success',     label: 'LOW' },
};

const STATUS_ICONS: Record<string, React.ReactElement> = {
  completed:       <CheckCircle2 className="h-4 w-4 text-green-400" />,
  review_required: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  failed:          <XCircle className="h-4 w-4 text-red-400" />,
  processing:      <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />,
  pending:         <Clock className="h-4 w-4 text-muted-foreground" />,
};

export function ResultsList() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [riskFilter, setRiskFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const params: any = { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE };
        if (riskFilter)   params.risk_level = riskFilter;
        if (statusFilter) params.status     = statusFilter;

        const res = await api.get('/analysis', { params });
        setAnalyses(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [page, riskFilter, statusFilter]);

  const filtered = search
    ? analyses.filter(a =>
        a.analysis_number?.toLowerCase().includes(search.toLowerCase()) ||
        a.original_filename?.toLowerCase().includes(search.toLowerCase()) ||
        a.document_type?.toLowerCase().includes(search.toLowerCase())
      )
    : analyses;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis Results</h1>
          <p className="text-muted-foreground mt-1">{total} total documents screened</p>
        </div>
        <Button asChild>
          <Link to="/upload"><Upload className="mr-2 h-4 w-4" /> Upload New</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by ID, filename, or type…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {/* Risk filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={riskFilter}
                onChange={e => { setRiskFilter(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            {/* Status filter */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="review_required">Review Required</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No analyses found</p>
              <p className="text-sm mt-1">Try changing your filters or upload a document.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {['Analysis ID', 'Filename', 'Doc Type', 'Risk', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((a) => {
                    const risk = RISK_CONFIG[a.risk_level] ?? { variant: 'outline', label: a.risk_level?.toUpperCase() ?? 'UNKNOWN' };
                    return (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.analysis_number}</td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="truncate font-medium" title={a.original_filename}>{a.original_filename}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{(a.document_type ?? 'unknown').toUpperCase()}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {a.risk_level ? (
                            <Badge variant={risk.variant as any}>{risk.label}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {STATUS_ICONS[a.status] ?? <Clock className="h-4 w-4 text-muted-foreground" />}
                            <span className="capitalize text-xs text-muted-foreground">{a.status?.replace(/_/g, ' ')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/results/${a.id}`}>
                              View <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
