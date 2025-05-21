import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import RiskTag from '@/components/common/RiskTag';
import { AlertCircle, Calendar, MessageCircle, Share2, User } from 'lucide-react';
import { doc, getDoc, collection, query, where, limit, getDocs, Timestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import ReportCard, { Report } from '@/components/common/ReportCard';

// Extend the Report type to include the additional fields used in this component
interface ExtendedReport extends Report {
  contactInfo?: string;
  screenshotUrl?: string;
}

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [report, setReport] = useState<ExtendedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarReports, setSimilarReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!id) return;
      
      try {
        const reportDoc = doc(db, 'reports', id);
        const reportSnapshot = await getDoc(reportDoc);
        
        if (reportSnapshot.exists()) {
          const data = reportSnapshot.data();
          setReport({
            id: reportSnapshot.id,
            title: data.title || 'Untitled Report',
            content: data.content || 'No content provided',
            category: data.category || 'Uncategorized',
            riskLevel: data.riskLevel || 'medium',
            reportCount: data.reportCount || 1,
            timestamp: data.timestamp || Timestamp.now(),
            reporterName: data.reporterName,
            contactInfo: data.contactInfo,
            screenshotUrl: data.screenshotUrl
          });
          
          // Fetch similar reports
          const reportsRef = collection(db, 'reports');
          const q = query(
            reportsRef,
            where('category', '==', data.category),
            where('id', '!=', id),
            limit(3)
          );
          
          const querySnapshot = await getDocs(q);
          const similarReportsData: Report[] = [];
          
          querySnapshot.forEach(doc => {
            const data = doc.data();
            similarReportsData.push({
              id: doc.id,
              title: data.title || 'Untitled Report',
              content: data.content || 'No content provided',
              category: data.category || 'Uncategorized',
              riskLevel: data.riskLevel || 'medium',
              reportCount: data.reportCount || 1,
              timestamp: data.timestamp || Timestamp.now()
            });
          });
          
          setSimilarReports(similarReportsData);
        } else {
          toast({
            title: "Report not found",
            description: "The requested report does not exist or has been removed.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching report:", error);
        toast({
          title: "Error",
          description: "Failed to load report details. Please try again.",
          variant: "destructive"
        });
        
        // Use dummy data if fetch fails
        setReport({
          id: id || '1',
          title: 'Sample Scam Report',
          content: 'This is a sample scam report for demonstration purposes.',
          category: 'banking',
          riskLevel: 'high',
          reportCount: 47,
          timestamp: Timestamp.now(),
          reporterName: 'Sample User',
          contactInfo: 'https://fakescam.example.com'
        });
        
        setSimilarReports([
          {
            id: '2',
            title: 'Similar Banking Scam',
            content: 'Another example of a banking scam with similar characteristics.',
            category: 'banking',
            riskLevel: 'high',
            reportCount: 32,
            timestamp: Timestamp.now()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportDetails();
  }, [id, toast]);

  const confirmReport = async () => {
    if (!id || !currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to report this scam.",
      });
      return;
    }
    
    try {
      const reportRef = doc(db, 'reports', id);
      await updateDoc(reportRef, {
        reportCount: increment(1)
      });
      
      // Update local state
      if (report) {
        setReport({
          ...report,
          reportCount: report.reportCount + 1
        });
      }
      
      toast({
        title: "Thank you!",
        description: "You've confirmed this scam report and helped the community.",
      });
    } catch (error) {
      console.error("Error confirming report:", error);
      toast({
        title: "Error",
        description: "Failed to confirm report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const shareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: report?.title || 'Scam Report',
        text: `Check out this scam report: ${report?.title}`,
        url: window.location.href
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied to clipboard",
        description: "You can now share this report with others.",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 animate-pulse-slow">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded mt-4"></div>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800">Report Not Found</h2>
          <p className="text-red-700 mt-2">The requested report does not exist or has been removed.</p>
          <Link to="/explorer" className="mt-4 inline-block text-blue-600 hover:underline">
            Browse all reports
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1 gap-4">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" /> {formatDate(report.timestamp)}
              </span>
              <span className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" /> {report.reportCount} reports
              </span>
              {report.reporterName && (
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1" /> Reported by {report.reporterName}
                </span>
              )}
            </div>
          </div>
          <RiskTag level={report.riskLevel} />
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Report Details</CardTitle>
              <Badge variant="outline" className="bg-accent">
                {report.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-500">Scam Content</h3>
              <div className="bg-gray-50 p-4 rounded-md border text-gray-800 whitespace-pre-wrap">
                {report.content}
              </div>
            </div>
            
            {report.contactInfo && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-gray-500">Related Phone/URL</h3>
                <p className="text-gray-800">{report.contactInfo}</p>
              </div>
            )}
            
            {report.screenshotUrl && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-gray-500">Screenshot</h3>
                <img 
                  src={report.screenshotUrl} 
                  alt="Scam screenshot" 
                  className="border rounded-lg max-h-96 object-contain" 
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {currentUser && (
              <Button onClick={confirmReport} className="gap-2">
                <MessageCircle className="h-4 w-4" /> Confirm This Scam
              </Button>
            )}
            <Button variant="outline" onClick={shareReport} className="gap-2">
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </CardFooter>
        </Card>
        
        {similarReports.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-medium">Similar Reports</h2>
              <Separator className="flex-1 mx-4" />
              <Link to={`/explorer?category=${report.category}`} className="text-primary text-sm hover:underline">
                See all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {similarReports.map((similarReport) => (
                <ReportCard key={similarReport.id} report={similarReport} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportDetail;
