
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import RiskTag from '@/components/common/RiskTag';
import ReportCard, { Report } from '@/components/common/ReportCard';
import { AlertCircle, CheckCircle, Shield, Info } from 'lucide-react';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type RiskLevel = 'high' | 'medium' | 'low' | null;

// Simple scam keywords for detection
const scamKeywords = {
  high: [
    'bitcoin', 'crypto', 'wallet', 'urgent', 'payment', 'verify', 'account', 'suspicious',
    'otp', 'pin', 'password', 'credit card', 'ssn', 'social security', 'gift card',
    'lottery', 'winner', 'won', 'prize', 'claim', 'inheritance', 'prince', 'million',
    'loan', 'investment', 'work from home', 'make money', 'easy cash', 'get paid',
    'betting', 'gambling', 'jackpot', 'casino', 'slots', 'poker'
  ],
  medium: [
    'offer', 'limited time', 'discount', 'sale', 'special', 'exclusive', 'guarantee',
    'cash back', 'opportunity', 'click here', 'download', 'activate', 'verify',
    'update', 'confirm', 'service', 'request', 'process', 'application',
    'bet now', 'play now', 'odds', 'win big', 'sports betting'
  ]
};

const ScamCheck: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState(searchParams.get('q') || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(null);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [scamScore, setScamScore] = useState(0);
  const [similarReports, setSimilarReports] = useState<Report[]>([]);
  const [isReportedButSafe, setIsReportedButSafe] = useState(false);

  // Pre-populate the text area if search query exists
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setContent(queryParam);
      analyzeContent(queryParam);
    }
  }, [searchParams]);

  const analyzeContent = async (textToAnalyze: string) => {
    setIsAnalyzing(true);
    setIsReportedButSafe(false);
    const lowerCaseContent = textToAnalyze.toLowerCase();
    
    // Find matching high-risk keywords
    const highRiskMatches = scamKeywords.high.filter(keyword => 
      lowerCaseContent.includes(keyword.toLowerCase())
    );
    
    // Find matching medium-risk keywords
    const mediumRiskMatches = scamKeywords.medium.filter(keyword => 
      lowerCaseContent.includes(keyword.toLowerCase())
    );

    // Calculate a simple scam score (0-100)
    const highRiskWeight = 5;
    const mediumRiskWeight = 2;
    let calculatedScore = 
      (highRiskMatches.length * highRiskWeight) + 
      (mediumRiskMatches.length * mediumRiskWeight);
    
    // Cap the score at 100
    calculatedScore = Math.min(calculatedScore, 100);
    
    // Determine risk level based on score
    let calculatedRiskLevel: RiskLevel;
    if (calculatedScore >= 50) {
      calculatedRiskLevel = 'high';
    } else if (calculatedScore >= 15) {
      calculatedRiskLevel = 'medium';
    } else {
      calculatedRiskLevel = 'low';
    }

    // Check if this has been reported but is currently safe
    const isPhoneNumber = /^\+\d{1,3}\d{10}$/.test(textToAnalyze.replace(/\D/g, ''));
    const isUrl = textToAnalyze.includes('http') || textToAnalyze.includes('www.');
    
    try {
      if (isPhoneNumber || isUrl) {
        const reportsRef = collection(db, 'reports');
        const q = query(
          reportsRef,
          where('contactInfo', '==', textToAnalyze),
          where('status', '==', 'pending'),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty && calculatedRiskLevel === 'low') {
          setIsReportedButSafe(true);
        }
      }

      // Look for similar reports in Firestore
      const keywordsToSearch = [...highRiskMatches, ...mediumRiskMatches].slice(0, 5);
      const similarReportsData: Report[] = [];
      
      if (keywordsToSearch.length > 0) {
        const reportsRef = collection(db, 'reports');
        
        for (const keyword of keywordsToSearch) {
          const q = query(
            reportsRef,
            where('content', '>=', keyword),
            where('content', '<=', keyword + '\uf8ff'),
            limit(3)
          );
          
          const querySnapshot = await getDocs(q);
          
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
        }
      }
      
      // If no reports found or error, fall back to dummy data for demonstration
      if (similarReportsData.length === 0 && calculatedScore > 30) {
        similarReportsData.push({
          id: 'sample1',
          title: 'Similar Scam Report',
          content: `This appears to be similar to a known scam involving ${highRiskMatches[0] || 'suspicious activity'}`,
          category: highRiskMatches.includes('bitcoin') ? 'Cryptocurrency Scam' : 
                   highRiskMatches.includes('otp') ? 'Banking Scam' : 
                   highRiskMatches.includes('betting') ? 'Betting App Scam' : 'Potential Scam',
          riskLevel: calculatedRiskLevel,
          reportCount: Math.floor(Math.random() * 50) + 10,
          timestamp: Timestamp.now()
        });
      }
      
      setSimilarReports(similarReportsData);
    } catch (error) {
      console.error("Error finding similar reports:", error);
    }

    // Update state with analysis results
    setScamScore(calculatedScore);
    setRiskLevel(calculatedRiskLevel);
    setMatchedKeywords([...highRiskMatches, ...mediumRiskMatches]);
    
    // Simulate analysis time
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      analyzeContent(content);
    }
  };

  const getScoreColor = () => {
    if (scamScore >= 50) return 'text-red-600';
    if (scamScore >= 15) return 'text-amber-600';
    return 'text-green-600';
  };

  const getActionTips = () => {
    if (riskLevel === 'high') {
      return [
        "Don't respond or click any links",
        "Block the sender immediately",
        "Report to relevant authorities",
        "Consider reporting to ScamShield community"
      ];
    } else if (riskLevel === 'medium') {
      return [
        "Be very cautious about any requests",
        "Never share personal information",
        "Research the sender before engaging",
        "Consider reporting for community awareness"
      ];
    } else {
      return [
        "While this appears safe, always stay vigilant",
        "Never share sensitive information online",
        "If something feels suspicious, trust your instincts"
      ];
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Scam Check</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea 
            placeholder="Paste the message, URL, or content you want to check for scams..." 
            className="min-h-32"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button 
            type="submit" 
            disabled={!content.trim() || isAnalyzing}
            className="w-full sm:w-auto"
          >
            {isAnalyzing ? 'Analyzing...' : 'Check Now'}
          </Button>
        </form>
        
        {isAnalyzing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary animate-pulse" />
                Analyzing content...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={45} className="h-2" />
            </CardContent>
          </Card>
        )}

        {isReportedButSafe && !isAnalyzing && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
            <Info className="h-5 w-5" />
            <AlertTitle>Under Review</AlertTitle>
            <AlertDescription>
              This number/website has been reported but is currently marked safe. Please allow some time for review.
            </AlertDescription>
          </Alert>
        )}
        
        {riskLevel !== null && !isAnalyzing && (
          <div className="space-y-6">
            <Card className={`border-l-4 ${riskLevel === 'high' ? 'border-l-red-600' : riskLevel === 'medium' ? 'border-l-amber-600' : 'border-l-green-600'}`}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {riskLevel === 'high' ? (
                    <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                  ) : riskLevel === 'medium' ? (
                    <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  )}
                  Scam Analysis Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Risk Level</h3>
                  <div className="flex items-center">
                    <RiskTag level={riskLevel} />
                    <span className={`ml-3 text-lg font-semibold ${getScoreColor()}`}>
                      {scamScore}/100 Scam Score
                    </span>
                  </div>
                </div>
                
                {matchedKeywords.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Suspicious Indicators Found</h3>
                    <div className="flex flex-wrap gap-2">
                      {matchedKeywords.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full dark:bg-gray-800 dark:text-gray-200">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Recommended Actions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {getActionTips().map((tip, index) => (
                      <li key={index} className="text-sm">{tip}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            {similarReports.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-3">Similar Reports ({similarReports.length})</h2>
                <div className="grid grid-cols-1 gap-4">
                  {similarReports.map(report => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setContent('')}>
                Clear & Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ScamCheck;
