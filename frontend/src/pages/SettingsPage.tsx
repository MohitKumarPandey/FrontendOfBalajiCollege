import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  Database,
  Brain,
  Shield,
  Server,
  Save,
  Info,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';

function SectionHeader({ icon, title, description }: { icon: React.ReactElement; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [trainingAadhaar, setTrainingAadhaar] = useState(false);
  const [trainingPan, setTrainingPan] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await api.get('/system/health');
      setHealth(res.data);
    } catch {
      setMsg('Failed to fetch system health.');
    } finally {
      setLoadingHealth(false);
    }
  };

  const triggerTraining = async (type: 'aadhaar' | 'pan') => {
    const setter = type === 'aadhaar' ? setTrainingAadhaar : setTrainingPan;
    setter(true);
    setMsg(null);
    try {
      const res = await api.post(`/system/ml/train/${type}`, null, { params: { epochs: 10, batch_size: 8 } });
      setMsg(res.data.message);
    } catch (e: any) {
      setMsg(e.response?.data?.detail ?? 'Training request failed.');
    } finally {
      setter(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">System configuration and management</p>
      </div>

      {msg && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/30 text-sm">
          <Info className="h-4 w-4 text-primary shrink-0" />
          {msg}
        </div>
      )}

      {/* System Health */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={<Server className="h-5 w-5" />}
            title="System Health"
            description="Live status of all backend services and AI models"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loadingHealth}>
            {loadingHealth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SettingsIcon className="mr-2 h-4 w-4" />}
            {health ? 'Refresh' : 'Check System Health'}
          </Button>

          {health && (
            <div className="space-y-3 mt-2">
              {[
                { label: 'API Status',    value: health.status,   ok: health.status === 'online' },
                { label: 'Version',       value: health.version,  ok: true },
                { label: 'Database',      value: health.database, ok: health.database === 'ok' },
                {
                  label: 'Dataset',
                  value: health.dataset?.exists ? `Mounted at ${health.dataset.configured_path}` : 'Not found',
                  ok: health.dataset?.exists,
                },
                {
                  label: 'Uptime',
                  value: health.uptime_seconds ? `${Math.floor(health.uptime_seconds / 60)} min` : 'N/A',
                  ok: true,
                },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{row.value}</span>
                    {row.ok
                      ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                      : <Info className="h-4 w-4 text-red-400" />}
                  </div>
                </div>
              ))}

              {/* ML Models */}
              {health.ml_models && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">ML Model Status</p>
                  <div className="space-y-1">
                    {Object.entries(health.ml_models).map(([model, info]: [string, any]) => (
                      <div key={model} className="flex items-center justify-between text-sm p-2 rounded border bg-muted/20">
                        <span className="capitalize">{model.replace(/_/g, ' ')}</span>
                        <Badge variant={info.available ? 'success' : 'outline'}>
                          {info.available ? `v${info.version ?? '1.0'}` : 'Not Trained'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ML Model Training */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={<Brain className="h-5 w-5" />}
            title="AI Model Training"
            description="Trigger YOLOv8 training on the existing Aadhaar/PAN dataset"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-md border bg-yellow-500/5 border-yellow-500/30 text-sm">
            <Info className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-yellow-300/80">
              Training runs in the background on CPU. Expect ~30–60 minutes for 10 epochs depending on dataset size.
              The model will be saved automatically on completion.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">Aadhaar Detector</CardTitle>
                <CardDescription className="text-xs">YOLOv8 field detection on Aadhaar cards</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => triggerTraining('aadhaar')}
                  disabled={trainingAadhaar}
                >
                  {trainingAadhaar ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Training…</> : 'Train Aadhaar Model'}
                </Button>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">PAN Card Detector</CardTitle>
                <CardDescription className="text-xs">YOLOv8 field detection on PAN cards</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => triggerTraining('pan')}
                  disabled={trainingPan}
                >
                  {trainingPan ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Training…</> : 'Train PAN Model'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={<Shield className="h-5 w-5" />}
            title="Security"
            description="Authentication and access control settings"
          />
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            ['Authentication', 'JWT Bearer Tokens'],
            ['Password Hashing', 'bcrypt (rounds: 12)'],
            ['Token Expiry', '480 minutes'],
            ['CORS Origins', 'localhost:3000'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-border/50 pb-2 last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dataset Info */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={<Database className="h-5 w-5" />}
            title="Dataset Configuration"
            description="Training data used by the AI models"
          />
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            ['Aadhaar Dataset', 'archive(2) — Entity detection, 5 classes'],
            ['PAN Dataset', 'archive(3) — Entity detection, 4 classes'],
            ['Format', 'YOLOv8 (YOLO txt annotations)'],
            ['Training Split', '80% train / 20% val'],
            ['Augmentation', 'mosaic, flipLR, hsv, scale'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-border/50 pb-2 last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-right font-medium max-w-[55%]">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
