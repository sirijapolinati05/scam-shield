
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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useToast } from "@/components/ui/use-toast";

const ReportScam: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    
    setIsSubmitting(true);
    
    try {
      // Prepare report data
      const reportData: any = {
        title,
        content,
        category,
        contactInfo,
        reporterId: currentUser.uid,
        reporterName: currentUser.displayName || 'Anonymous',
        reportCount: 1,
        // Default to medium risk, can be updated later via moderation
        riskLevel: 'medium',
        timestamp: serverTimestamp(),
        status: 'pending' // For moderation purposes
      };
      
      // If screenshot provided, upload it first
      if (screenshot) {
        const storageRef = ref(storage, `screenshots/${Date.now()}_${screenshot.name}`);
        const uploadResult = await uploadBytes(storageRef, screenshot);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        reportData.screenshotUrl = downloadURL;
      }
      
      // Save report to Firestore
      const docRef = await addDoc(collection(db, 'reports'), reportData);
      
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep others safe!",
      });
      
      // Navigate to the submitted report
      navigate(`/report/${docRef.id}`);
      
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
                    <SelectItem value="banking">OTP/Banking</SelectItem>
                    <SelectItem value="website">Fake Website</SelectItem>
                    <SelectItem value="lottery">Lottery/Giveaway</SelectItem>
                    <SelectItem value="betting">Betting App</SelectItem>
                    <SelectItem value="shopping">Shopping Scam</SelectItem>
                    <SelectItem value="investment">Investment Scam</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Scam Content <span className="text-red-500">*</span></Label>
                <Textarea
                  id="content"
                  placeholder="Paste the full message, describe the scam in detail, or provide the website URL"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="min-h-32"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactInfo">Related Phone/URL (Optional)</Label>
                <Input
                  id="contactInfo"
                  placeholder="Phone number or website URL used in the scam"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="screenshot">Screenshot (Optional)</Label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                />
                
                {screenshotPreview && (
                  <div className="mt-2">
                    <img 
                      src={screenshotPreview} 
                      alt="Screenshot preview" 
                      className="max-h-40 border rounded"
                    />
                  </div>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold">Important Note:</p>
          <p>All reports will be reviewed before being made public to ensure quality and accuracy.</p>
        </div>
      </div>
    </Layout>
  );
};

export default ReportScam;
