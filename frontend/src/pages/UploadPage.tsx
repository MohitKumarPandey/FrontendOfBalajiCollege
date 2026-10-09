import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState('unknown');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
        setError(null);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(droppedFile);
      } else {
        setError('Please upload an image file (JPEG, PNG).');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    if (docType !== 'unknown') {
      formData.append('document_type', docType);
    }

    try {
      const response = await api.post('/analysis/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // The analysis is processed in the background. We can navigate to the results page
      navigate(`/results/${response.data.id}`);
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
        <p className="text-muted-foreground mt-1">
          Submit an identity document or certificate for AI-powered verification.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
            <CardDescription>Drag and drop your image file here.</CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div 
                className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:bg-accent/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[300px]"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">Click or drag image to upload</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports JPG, PNG, WEBP (Max 5MB)
                </p>
                <Button variant="secondary">Select File</Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="relative bg-black/10 flex items-center justify-center p-4 min-h-[300px]">
                  <img src={previewUrl!} alt="Preview" className="max-h-[400px] object-contain rounded-md shadow-lg" />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 border-t flex items-center bg-muted/20">
                  <File className="h-5 w-5 text-primary mr-3" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end border-t pt-6">
            <Button 
              size="lg" 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Run AI Verification
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>Configure analysis settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type (Optional)</label>
              <select 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="unknown">Auto-Detect (AI)</option>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="driving_license">Driving License</option>
                <option value="passport">Passport</option>
                <option value="certificate">Educational Certificate</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Leave as Auto-Detect to let the AI determine the document structure.
              </p>
            </div>
            
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium">Active Pipelines</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> OCR Data Extraction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Error Level Analysis (ELA)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Field Tampering Detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> YOLOv8 Field Alignment
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
