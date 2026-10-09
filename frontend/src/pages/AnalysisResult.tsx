import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Search,
  ShieldAlert,
  Download,
  ArrowLeft,
  Brain,
  Eye,
  Info,
  Zap,
  TrendingUp,
  ClipboardCheck,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { api, API_URL } from '@/lib/api';

// --- Risk Gauge SVG Component ---
function RiskGauge({ score }: { score: number }) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const angle = (clampedScore / 100) * 180 - 90; // -90 to 90 degrees
  const r = 60;
  const cx = 80;
  const cy = 80;

  // Arc path (semicircle)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcX = (deg: number) => cx + r * Math.cos(toRad(deg - 90));
  const arcY = (deg: number) => cy + r * Math.sin(toRad(deg - 90));

  const color =
    clampedScore >= 70
      ? '#ef4444'
      : clampedScore >= 40
      ? '#f59e0b'
      : '#22c55e';

  const needleX = cx + (r - 10) * Math.cos(toRad(angle));
  const needleY = cy + (r - 10) * Math.sin(toRad(angle));

  return (
    <svg viewBox="0 0 160 100" className="w-full max-w-[180px] mx-auto">
      {/* Background arc segments */}
      {[
        { start: -90, end: -18, color: '#22c55e33' },
        { start: -18, end: 54, color: '#f59e0b33' },
        { start: 54, end: 90, color: '#ef444433' },
      ].map(({ start, end, color: c }, i) => (
        <path
          key={i}
          d={`M ${arcX(start + 90)} ${arcY(start + 90)} A ${r} ${r} 0 0 1 ${arcX(end + 90)} ${arcY(end + 90)}`}
          fill="none"
          stroke={c}
          strokeWidth="12"
          strokeLinecap="round"
        />
      ))}
      {/* Active arc */}
      <path
        d={`M ${arcX(0)} ${arcY(0)} A ${r} ${r} 0 0 1 ${arcX(angle + 90)} ${arcY(angle + 90)}`}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="4" fill={color} />
      {/* Score label */}
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fill={color}
      >
        {clampedScore}
      </text>
      <text x={cx} y={cy + 32} textAnchor="middle" fontSize="7" fill="#94a3b8">
        / 100
      </text>
      {/* Labels */}
      <text x="14" y="88" fontSize="7" fill="#22c55e">Low</text>
      <text x="66" y="20" fontSize="7" fill="#f59e0b">Med</text>
      <text x="126" y="88" fontSize="7" fill="#ef4444">High</text>
    </svg>
  );
}

// --- Risk factor bar ---
function RiskFactor({ factor, explanation, weight }: { factor: string; explanation: string; weight?: number }) {
  const pct = Math.min(100, Math.max(0, (weight ?? 50)));
  const barColor = pct >= 70 ? 'bg-red-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{factor}</span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{explanation}</p>
    </div>
  );
}

// --- ML Prediction Panel ---
function MLPredictionPanel({ prediction }: { prediction: any }) {
  if (!prediction || !prediction.available) {
    return (
      <div className="flex items-start gap-3 p-4 border rounded-md bg-muted/30">
        <Info className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium text-sm">Model Analysis Not Available</p>
          <p className="text-sm text-muted-foreground mt-1">
            The deep learning field-detection model (e.g., YOLOv8) was not applied. This usually happens if the document type is not recognized (e.g., not Aadhaar or PAN) or if the model was not trained for this specific format.
          </p>
        </div>
      </div>
    );
  }

  const detections: any[] = prediction.detections ?? [];
  const confidence: number = prediction.avg_confidence ?? 0;
  
  // Explainability logic
  const isHighConfidence = confidence > 0.7;
  const missingCriticalFields = detections.length < 3; // heuristic

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 p-4 rounded-md bg-primary/5 border border-primary/20">
        <Brain className="h-6 w-6 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">AI Field Detection Model</h4>
            <Badge variant={isHighConfidence ? 'success' : 'warning'}>
              {isHighConfidence ? 'Reliable' : 'Uncertain'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            The <strong>{prediction.model_version ?? 'YOLOv8'}</strong> model analyzed the document's structure to locate expected fields. 
            Average field confidence is <span className="font-semibold text-foreground">{(confidence * 100).toFixed(1)}%</span>.
            {isHighConfidence 
              ? ' High confidence indicates the document layout closely matches standard issued templates.'
              : ' Low confidence suggests the layout is non-standard, blurry, or potentially manipulated.'}
          </p>
          {missingCriticalFields && isHighConfidence && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 bg-amber-500/10 p-2 rounded border border-amber-500/20">
              <AlertTriangle className="inline-block h-4 w-4 mr-1 mb-0.5" />
              Despite high confidence in found fields, few fields were detected overall. This might indicate missing critical information (e.g., missing signature or photo).
            </p>
          )}
        </div>
      </div>

      {detections.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Detected Structural Fields</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detections.map((d: any, i: number) => {
              const dConf = d.confidence ?? 0;
              const isLowConf = dConf < 0.6;
              return (
                <div key={i} className={`flex flex-col p-3 rounded-lg border ${isLowConf ? 'bg-amber-500/5 border-amber-500/20' : 'bg-card'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="capitalize font-medium text-sm">{(d.class_name ?? d.class_id ?? '').toString().replace(/_/g, ' ')}</span>
                    <span className={`text-xs font-mono font-bold ${isLowConf ? 'text-amber-500' : 'text-green-500'}`}>
                      {(dConf * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isLowConf ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${dConf * 100}%` }} />
                  </div>
                  {isLowConf && (
                    <p className="text-[10px] text-amber-600/80 mt-2">
                      Low confidence. This field may be tampered with, obscured, or poorly printed.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded border border-dashed text-center">
          <p className="text-sm text-muted-foreground">No standard fields detected by the model.</p>
        </div>
      )}
    </div>
  );
}

// --- Verdict Banner ---
function VerdictBanner({ level, reviewStatus }: { level: string; reviewStatus: string }): React.ReactElement {
  const configs: Record<string, { bg: string; border: string; icon: React.ReactElement; title: string; desc: string }> = {
    critical: {
      bg: 'bg-red-950/40',
      border: 'border-red-500/60',
      icon: <XCircle className="h-8 w-8 text-red-400" />,
      title: 'CRITICAL RISK — Likely Forged',
      desc: 'Multiple high-severity forensic anomalies detected. Immediate escalation recommended.',
    },
    high: {
      bg: 'bg-red-950/20',
      border: 'border-red-500/40',
      icon: <AlertTriangle className="h-8 w-8 text-red-400" />,
      title: 'HIGH RISK — Suspicious Document',
      desc: 'Significant forensic indicators suggest potential tampering. Manual review required.',
    },
    medium: {
      bg: 'bg-yellow-950/20',
      border: 'border-yellow-500/40',
      icon: <AlertTriangle className="h-8 w-8 text-yellow-400" />,
      title: 'MEDIUM RISK — Needs Verification',
      desc: 'Some anomalies detected. Cross-check with issuing authority before accepting.',
    },
    low: {
      bg: 'bg-green-950/20',
      border: 'border-green-500/40',
      icon: <ShieldCheck className="h-8 w-8 text-green-400" />,
      title: 'LOW RISK — Appears Authentic',
      desc: 'No significant forensic anomalies found. Document structure consistent with genuine samples.',
    },
    insufficient: {
      bg: 'bg-muted/30',
      border: 'border-border',
      icon: <Info className="h-8 w-8 text-muted-foreground" />,
      title: 'INSUFFICIENT DATA',
      desc: 'Unable to extract enough information to make a confident determination.',
    },
  };

  const cfg = configs[level] ?? configs['insufficient'];

  return (
    <div className={`flex items-center gap-4 p-5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}
      <div>
        <p className="font-bold text-lg tracking-wide">{cfg.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{cfg.desc}</p>
      </div>
      {reviewStatus && (
        <Badge className="ml-auto shrink-0" variant={reviewStatus === 'pending' ? 'warning' : reviewStatus === 'approved' ? 'success' : 'destructive'}>
          {reviewStatus.toUpperCase()}
        </Badge>
      )}
    </div>
  );
}

// --- Main Page ---
export function AnalysisResult() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'forensics' | 'ml' | 'ocr'>('overview');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const fetchAnalysis = async () => {
      try {
        const response = await api.get(`/analysis/${id}`);
        setAnalysis(response.data);
        if (response.data.status !== 'pending' && response.data.status !== 'processing') {
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load analysis results.');
        setLoading(false);
        clearInterval(interval);
      }
    };

    fetchAnalysis();
    interval = setInterval(fetchAnalysis, 2000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Analysis Not Found</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild><Link to="/upload">Upload New Document</Link></Button>
      </div>
    );
  }

  if (loading || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="relative h-28 w-28">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-b-transparent animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
          <ShieldAlert className="absolute inset-0 m-auto h-9 w-9 text-primary animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">AI Screening in Progress</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            Running OCR, Error Level Analysis, Copy-Move Detection, and YOLOv8 field-alignment models...
          </p>
        </div>
        <div className="grid grid-cols-4 gap-4 max-w-lg w-full text-center">
          {['OCR Extraction', 'Forensic Analysis', 'ML Inference', 'Risk Scoring'].map((step, i) => (
            <div key={i} className="p-3 rounded-lg border bg-card/60">
              <div className="h-1.5 w-full rounded-full bg-muted mb-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%', animationDelay: `${i * 200}ms` }} />
              </div>
              <p className="text-xs text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const riskLevel = analysis.risk_level ?? 'insufficient';
  const riskScore = analysis.risk_score ?? 0;
  const isHighRisk = riskLevel === 'high' || riskLevel === 'critical';

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Eye className="h-4 w-4" /> },
    { key: 'forensics', label: 'Forensics', icon: <Search className="h-4 w-4" /> },
    { key: 'ml', label: 'AI / ML', icon: <Brain className="h-4 w-4" /> },
    { key: 'ocr', label: 'OCR Data', icon: <FileText className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/results"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analysis Report</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-muted-foreground text-sm">{analysis.analysis_number}</span>
              <Badge variant="outline">{(analysis.document_type ?? 'unknown').toUpperCase()}</Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(analysis.created_at).toLocaleString()}
              </span>
              {analysis.processing_time_ms && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3 text-primary" />
                  {(analysis.processing_time_ms / 1000).toFixed(2)}s
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`${API_URL}/analysis/${analysis.id}/report/pdf`} download>
              <Download className="mr-2 h-4 w-4" /> PDF Report
            </a>
          </Button>
        </div>
      </div>

      {/* Verdict Banner */}
      <VerdictBanner level={riskLevel} reviewStatus={analysis.review_status ?? 'pending'} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: image + gauge */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Document Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md overflow-hidden border bg-black/20">
                <img
                  src={`${API_URL}/analysis/${analysis.id}/image`}
                  alt="Uploaded document"
                  className="w-full h-auto"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={isHighRisk ? 'border-destructive/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Risk Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <RiskGauge score={riskScore} />
              <div className="w-full space-y-1 text-center">
                <p className="text-xs text-muted-foreground">
                  OCR Confidence: <strong>{analysis.ocr_confidence ? `${(analysis.ocr_confidence * 100).toFixed(1)}%` : 'N/A'}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* File metadata */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">File Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Filename', analysis.original_filename],
                ['Size', analysis.file_size ? `${(analysis.file_size / 1024).toFixed(1)} KB` : 'N/A'],
                ['MIME Type', analysis.mime_type ?? 'N/A'],
                ['Status', analysis.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center border-b border-border/50 pb-1 last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium truncate max-w-[120px]" title={value}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: tabbed content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab bar */}
          <div className="flex gap-1 border rounded-lg p-1 bg-muted/30">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-primary" /> Risk Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{analysis.risk_explanation ?? 'No explanation available.'}</p>

                  {analysis.risk_factors && analysis.risk_factors.length > 0 && (
                    <div className="space-y-4 pt-2 border-t">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Contributing Risk Factors</p>
                      {analysis.risk_factors.map((f: any, i: number) => (
                        <RiskFactor
                          key={i}
                          factor={f.factor ?? `Factor ${i + 1}`}
                          explanation={f.explanation ?? ''}
                          weight={f.weight ?? f.score ?? 50}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {analysis.institution_match && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <ClipboardCheck className="h-4 w-4 text-primary" /> Institution Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={analysis.institution_match.status === 'verified' ? 'success' : 'warning'}>
                        {analysis.institution_match.status?.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{analysis.institution_match.details}</p>
                  </CardContent>
                </Card>
              )}

              {analysis.status === 'review_required' && (
                <Card className="border-amber-500/40 bg-amber-500/5">
                  <CardHeader>
                    <CardTitle className="text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> Manual Review Required
                    </CardTitle>
                    <CardDescription>This document was automatically flagged. A human reviewer must make the final call.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-3">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button variant="outline">Add Note</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tab: Forensics */}
          {activeTab === 'forensics' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" /> Forensic Analysis Results
                </CardTitle>
                <CardDescription>{analysis.forensic_summary ?? 'Digital forensics scan results.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.forensic_findings && analysis.forensic_findings.length > 0 ? (
                  analysis.forensic_findings.map((f: any, i: number) => {
                    const isHigh = f.severity === 'high';
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-4 p-4 rounded-lg border ${
                          isHigh ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'
                        }`}
                      >
                        <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${isHigh ? 'text-red-400' : 'text-yellow-400'}`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{f.finding}</p>
                            <Badge variant={isHigh ? 'destructive' : 'warning'} className="text-xs">
                              {f.severity?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Detection Method: <span className="font-medium text-foreground">{(f.method ?? '').replace(/_/g, ' ')}</span>
                          </p>
                          {f.details && <p className="text-xs text-muted-foreground mt-1">{f.details}</p>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center gap-3 p-5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                    <CheckCircle2 className="h-6 w-6 shrink-0" />
                    <div>
                      <p className="font-semibold">No Forensic Anomalies Detected</p>
                      <p className="text-sm opacity-80 mt-0.5">
                        ELA, noise consistency, and copy-move analysis all passed. Image structure appears unmodified.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Methods Applied</p>
                  <div className="flex flex-wrap gap-2">
                    {['Error Level Analysis (ELA)', 'Noise Consistency', 'Copy-Move Detection', 'Edge Integrity'].map(m => (
                      <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab: ML */}
          {activeTab === 'ml' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" /> YOLOv8 Field Detection
                </CardTitle>
                <CardDescription>
                  Deep learning model trained on the Aadhaar/PAN dataset to detect and validate document fields.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MLPredictionPanel prediction={analysis.ml_prediction} />
              </CardContent>
            </Card>
          )}

          {/* Tab: OCR */}
          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Extracted Fields
                  </CardTitle>
                  <CardDescription>
                    Fields parsed from the document via OCR.
                    OCR confidence: <strong>{analysis.ocr_confidence ? `${(analysis.ocr_confidence * 100).toFixed(1)}%` : 'N/A'}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.extracted_fields && Object.keys(analysis.extracted_fields).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(analysis.extracted_fields).map(([key, value]) => (
                        <div key={key} className="space-y-1 p-3 rounded-lg border bg-muted/20">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <p className="font-medium break-all">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p>No structured fields could be extracted.</p>
                      <p className="text-xs mt-1">The document may not have been recognized or text was unreadable.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {analysis.ocr_results?.raw_text && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Raw OCR Text</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted/30 rounded-md p-4 overflow-auto max-h-64 whitespace-pre-wrap font-mono">
                      {analysis.ocr_results.raw_text}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
