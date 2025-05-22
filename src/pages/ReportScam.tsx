
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from 'lucide-react';

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
  const [showThankYou, setShowThankYou] = useState(false);
  const [contactInfoError, setContactInfoError] = useState<string | null>(null);

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // If empty, consider it valid (since it's optional)
    if (!phoneNumber) return true;
    
    // Check if it starts with a country code (+ followed by 1-3 digits)
    const hasCountryCode = /^\+\d{1,3}/.test(phoneNumber);
    
    if (!hasCountryCode) {
      setContactInfoError("Please enter the phone number with a valid country code (e.g., +91, +1).");
      return false;
    }
    
    // Check if it has exactly 10 digits after the country code
    const digitsAfterCode = phoneNumber.substring(phoneNumber.indexOf('+') + 1).replace(/\D/g, '');
    const codeDigits = digitsAfterCode.length - 10;
    
    if (codeDigits < 0 || digitsAfterCode.length - codeDigits !== 10) {
      setContactInfoError("Phone number must contain exactly 10 digits after the country code.");
      return false;
    }
    
    setContactInfoError(null);
    return true;
  };

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

  const handleContactInfoChange = (value: string) => {
    setContactInfo(value);
    if (value && (value.includes('+') || value.match(/\d{10}/))) {
      validatePhoneNumber(value);
    } else {
      setContactInfoError(null);
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
    
    // Validate contact info if it's a phone number
    if (contactInfo && !validatePhoneNumber(contactInfo)) {
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
      
      // Show thank you dialog instead of toast
      setShowThankYou(true);
      
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

  const handleCloseThankYou = () => {
    setShowThankYou(false);
    // Navigate to home or reports list
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
                  placeholder="Phone number with country code (e.g., +91xxxxxxxxxx) or website URL"
                  value={contactInfo}
                  onChange={(e) => handleContactInfoChange(e.target.value)}
                />
                {contactInfoError && (
                  <p className="text-sm text-red-500 mt-1">{contactInfoError}</p>
                )}
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
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
          <p className="font-semibold">Important Note:</p>
          <p>All reports will be reviewed before being made public to ensure quality and accuracy.</p>
        </div>

        <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Report Submitted
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                Thank you for your report! We will review the number/website shortly.
                Your contribution helps keep the community safe.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center mt-4">
              <Button onClick={handleCloseThankYou} className="w-32">
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ReportScam;
