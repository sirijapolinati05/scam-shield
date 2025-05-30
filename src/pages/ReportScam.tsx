import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, X } from 'lucide-react';

const ReportScam: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [contactInfoError, setContactInfoError] = useState<string | null>(null);

  const validateContactInfo = (info: string): boolean => {
    if (!info) {
      setContactInfoError("Please provide a phone number or website URL.");
      return false;
    }

    const phonePattern = /^\+\d{1,3}\d{7,14}$/;
    const urlPattern = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

    const isPhoneValid = phonePattern.test(info);
    const isUrlValid = urlPattern.test(info);

    if (!isPhoneValid && !isUrlValid) {
      setContactInfoError("Please enter a valid phone number (e.g., +91xxxxxxxxxx) or a valid website URL (starting with http/https).");
      return false;
    }

    setContactInfoError(null);
    return true;
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setScreenshots(prev => [...prev, ...newFiles]);

      const newPreviews = newFiles.map(file => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        return new Promise<string>(resolve => {
          reader.onloadend = () => resolve(reader.result as string);
        });
      });

      Promise.all(newPreviews).then(results => {
        setScreenshotPreviews(prev => [...prev, ...results]);
      });
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to report a scam.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!title || !content || !category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!validateContactInfo(contactInfo)) {
      return;
    }

    setIsSubmitting(true);
    setShowThankYou(true);

    try {
      const reportData: any = {
        title,
        content,
        category,
        contactInfo,
        reporterId: currentUser.uid,
        reporterName: currentUser.displayName || 'Anonymous',
        reportCount: 1,
        riskLevel: 'medium',
        timestamp: serverTimestamp(),
        status: 'pending',  // <-- default status on report creation
        hasScreenshots: screenshots.length > 0
      };

      const reportRef = await addDoc(collection(db, 'reports'), reportData);

      if (screenshots.length > 0) {
        const screenshotUrls = await Promise.all(
          screenshots.map(async (screenshot, index) => {
            const storageRef = ref(storage, `screenshots/${reportRef.id}_${index}_${screenshot.name}`);
            const uploadResult = await uploadBytes(storageRef, screenshot);
            return getDownloadURL(uploadResult.ref);
          })
        );

        await updateDoc(doc(db, 'reports', reportRef.id), { screenshotUrls });
      }

      setTitle('');
      setContent('');
      setCategory('');
      setContactInfo('');
      setScreenshots([]);
      setScreenshotPreviews([]);

    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: `Failed to submit report: ${error.message}`,
        variant: "destructive"
      });
      setShowThankYou(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseThankYou = () => {
    setShowThankYou(false);
    navigate('/');
  };

  return (
    <Layout requireAuth={true}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Report a Scam</h1>

        <Card>
          <CardHeader>
            <CardTitle>Submit a New Scam Report</CardTitle>
            <CardDescription>
              Help protect the community by reporting scams you've encountered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="Brief description of the scam"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scam category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job">Job Scam</SelectItem>
                    <SelectItem value="banking">Banking/OTP Scam</SelectItem>
                    <SelectItem value="website">Fake Website</SelectItem>
                    <SelectItem value="shopping">Shopping Scam</SelectItem>
                    <SelectItem value="investment">Investment Scam</SelectItem>
                    <SelectItem value="betting">Betting App</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Scam Content <span className="text-red-500">*</span></Label>
                <Textarea
                  id="content"
                  placeholder="Describe the scam in detail or paste the full message"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="min-h-32"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo">Phone Number or URL <span className="text-red-500">*</span></Label>
                <Input
                  id="contactInfo"
                  placeholder="e.g., +91xxxxxxxxxx or https://example.com"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
                {contactInfoError && (
                  <p className="text-sm text-red-500 mt-1">{contactInfoError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshots">Screenshots (Optional)</Label>
                <Input
                  id="screenshots"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleScreenshotChange}
                />
                {screenshotPreviews.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {screenshotPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Screenshot preview ${index + 1}`}
                          className="max-h-40 border rounded"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => handleRemoveScreenshot(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
          <p className="font-semibold">Important Note:</p>
          <p>All reports will be reviewed before being made public to ensure quality and accuracy.</p>
        </div>

        <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span>Thank you for your report!</span>
              </DialogTitle>
              <DialogDescription>
                Your scam report has been submitted successfully. It will be reviewed and approved shortly.
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={handleCloseThankYou}
              className="mt-4 w-full"
            >
              Close
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ReportScam;
