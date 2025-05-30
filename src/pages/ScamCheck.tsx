import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import RiskTag from '@/components/common/RiskTag';
import ReportCard, { Report } from '@/components/common/ReportCard';
import { AlertCircle, CheckCircle, Shield, Info } from 'lucide-react';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

type RiskLevel = 'high' | 'medium' | 'low' | null;

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
  const [inputError, setInputError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(null);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [scamScore, setScamScore] = useState(0);
  const [approvedReports, setApprovedReports] = useState<Report[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [isReportedButSafe, setIsReportedButSafe] = useState(false);
  const [reportStatus, setReportStatus] = useState<'approved' | 'pending' | null>(null);

  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned.substring(0, 1)} (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
    } else if (cleaned.length > 10) {
      const countryCode = cleaned.substring(0, cleaned.length - 10);
      const number = cleaned.substring(cleaned.length - 10);
      return `+${countryCode} (${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`;
    }
    return phoneNumber;
  };

  const normalizeUrl = (url: string, preserveFragment: boolean = false) => {
    try {
      let normalized = url.toLowerCase().trim();
      // Add https:// if no protocol is specified
      if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = `https://${normalized}`;
      }
      const urlObj = new URL(normalized);
      // Remove www. and optionally preserve fragment
      let result = urlObj.hostname.replace(/^www\./, '') + urlObj.pathname.replace(/\/+$/, '');
      if (preserveFragment && urlObj.hash) {
        result += urlObj.hash;
      }
      return result;
    } catch (e) {
      return url.toLowerCase().trim();
    }
  };

  const generateUrlFormats = (url: string) => {
    const normalized = normalizeUrl(url);
    const normalizedWithFragment = normalizeUrl(url, true);
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const formats = [
      normalized,
      normalizedWithFragment,
      `http://${normalized}`,
      `https://${normalized}`,
      `www.${normalized}`,
      `http://www.${normalized}`,
      `https://www.${normalized}`,
      normalized.replace(/^[^/]+/, ''), // Path only
      url.toLowerCase().trim(), // Original input
      hostname, // Hostname only
      `https://${hostname}/#/`, // Specific format from Firebase
      `www.${hostname}/#/`, // Specific format with www
    ];
    return [...new Set(formats)];
  };

  const validatePhoneNumber = (input: string) => {
    const cleanedNumber = input.replace(/\D/g, '');
    const isPhoneNumber = /^\+?\d+$/.test(input);
    if (isPhoneNumber) {
      if (cleanedNumber.length < 10) {
        return 'Phone number must be at least 10 digits';
      } else if (cleanedNumber.length > 15) {
        return 'Phone number cannot exceed 15 digits';
      }
      return '';
    }
    return '';
  };

  const validateUrl = (input: string) => {
    try {
      new URL(input.startsWith('http') ? input : `https://${input}`);
      return '';
    } catch (e) {
      return 'Invalid URL format';
    }
  };

  const isValidPhoneNumber = (input: string) => {
    const cleanedNumber = input.replace(/\D/g, '');
    const isPhoneNumber = /^\+?\d+$/.test(input);
    return isPhoneNumber && cleanedNumber.length >= 10 && cleanedNumber.length <= 15;
  };

  const isValidUrl = (input: string) => {
    try {
      new URL(input.startsWith('http') ? input : `https://${input}`);
      return true;
    } catch (e) {
      return false;
    }
  };

  const extractMainPhoneNumber = (input: string) => {
    const cleaned = input.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return cleaned.substring(cleaned.length - 10);
    }
    return cleaned;
  };

  const generatePhoneNumberFormats = (cleanedNumber: string) => {
    const mainNumber = cleanedNumber.length >= 10 ? cleanedNumber.substring(cleaned.length - 10) : cleanedNumber;
    const formats = [
      cleanedNumber,
      mainNumber,
      mainNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'),
      mainNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'),
      mainNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1.$2.$3'),
      `+1${mainNumber}`,
      `1${mainNumber}`,
      `+${cleanedNumber}`
    ];
    return [...new Set(formats)];
  };

  const resetState = () => {
    setContent('');
    setInputError('');
    setIsAnalyzing(false);
    setRiskLevel(null);
    setMatchedKeywords([]);
    setScamScore(0);
    setApprovedReports([]);
    setPendingReports([]);
    setIsReportedButSafe(false);
    setReportStatus(null);
  };

  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setContent(queryParam);
      if (isValidPhoneNumber(queryParam)) {
        const error = validatePhoneNumber(queryParam);
        if (error) {
          setInputError(error);
          toast({
            title: "Invalid Phone Number",
            description: error,
            variant: "destructive"
          });
          return;
        }
      } else if (isValidUrl(queryParam)) {
        const error = validateUrl(queryParam);
        if (error) {
          setInputError(error);
          toast({
            title: "Invalid URL",
            description: error,
            variant: "destructive"
          });
          return;
        }
      }
      analyzeContent(queryParam);
    }
  }, [searchParams]);

  const analyzeContent = async (textToAnalyze: string) => {
    if (isValidPhoneNumber(textToAnalyze)) {
      const error = validatePhoneNumber(textToAnalyze);
      if (error) {
        setInputError(error);
        toast({
          title: "Invalid Phone Number",
          description: error,
          variant: "destructive"
        });
        return;
      }
    } else if (isValidUrl(textToAnalyze)) {
      const error = validateUrl(textToAnalyze);
      if (error) {
        setInputError(error);
        toast({
          title: "Invalid URL",
          description: error,
          variant: "destructive"
        });
        return;
      }
    }

    setInputError('');
    setIsAnalyzing(true);
    setIsReportedButSafe(false);
    setReportStatus(null);
    const lowerCaseContent = textToAnalyze.toLowerCase();
    const isPhoneNumber = isValidPhoneNumber(textToAnalyze);
    const isUrl = isValidUrl(textToAnalyze);

    let approvedReportsData: Report[] = [];
    let pendingReportsData: Report[] = [];

    try {
      if (isPhoneNumber || isUrl) {
        const formats = isPhoneNumber
          ? generatePhoneNumberFormats(textToAnalyze.replace(/\D/g, ''))
          : generateUrlFormats(textToAnalyze);

        console.log('Searching formats:', formats);

        const reportsRef = collection(db, 'reports');
        for (const format of formats) {
          console.log(`Querying contactInfo: ${format}`);
          const q = query(
            reportsRef,
            where('contactInfo', '==', format),
            limit(10)
          );

          const querySnapshot = await getDocs(q);

          querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`Found report for contactInfo: ${data.contactInfo}, status: ${data.status}`);
            const report = {
              id: doc.id,
              title: data.title || (isPhoneNumber ? 'Phone Scam Report' : 'Website Scam Report'),
              content: data.content || `Scam reported for this ${isPhoneNumber ? 'phone number' : 'website'}`,
              category: data.category || (isPhoneNumber ? 'Phone Scam' : 'Website Scam'),
              riskLevel: data.riskLevel || 'high',
              reportCount: data.reportCount || 1,
              timestamp: data.timestamp || Timestamp.now(),
              status: data.status?.trim() || 'pending' // Trim status to handle extra spaces
            };
            if (report.status === 'approved' && !approvedReportsData.find(r => r.id === doc.id)) {
              approvedReportsData.push(report);
            } else if (report.status === 'pending' && !pendingReportsData.find(r => r.id === doc.id)) {
              pendingReportsData.push(report);
            }
          });

          if (approvedReportsData.length + pendingReportsData.length >= 10) break;
        }

        // Fallback query for URLs: partial match on hostname
        if (isUrl && approvedReportsData.length === 0 && pendingReportsData.length === 0) {
          const normalized = normalizeUrl(textToAnalyze);
          const hostname = normalized.split('/')[0];
          console.log(`Fallback query for hostname: ${hostname}`);
          const fallbackQuery = query(
            reportsRef,
            where('contactInfo', '>=', hostname),
            where('contactInfo', '<=', hostname + '\uf8ff'),
            limit(5)
          );
          const fallbackSnapshot = await getDocs(fallbackQuery);
          fallbackSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`Fallback report found: ${data.contactInfo}, status: ${data.status}`);
            const report = {
              id: doc.id,
              title: data.title || 'Website Scam Report',
              content: data.content || 'Scam reported for this website',
              category: data.category || 'Website Scam',
              riskLevel: data.riskLevel || 'high',
              reportCount: data.reportCount || 1,
              timestamp: data.timestamp || Timestamp.now(),
              status: data.status?.trim() || 'pending'
            };
            if (report.status === 'approved' && !approvedReportsData.find(r => r.id === doc.id)) {
              approvedReportsData.push(report);
            } else if (report.status === 'pending' && !pendingReportsData.find(r => r.id === doc.id)) {
              pendingReportsData.push(report);
            }
          });
        }

        console.log('Final reports:', { approved: approvedReportsData, pending: pendingReportsData });
      } else {
        const highRiskMatches = scamKeywords.high.filter(keyword =>
          lowerCaseContent.includes(keyword.toLowerCase())
        );
        const mediumRiskMatches = scamKeywords.medium.filter(keyword =>
          lowerCaseContent.includes(keyword.toLowerCase())
        );

        const keywordsToSearch = [...highRiskMatches, ...mediumRiskMatches].slice(0, 5);

        if (keywordsToSearch.length > 0) {
          const reportsRef = collection(db, 'reports');

          for (const keyword of keywordsToSearch) {
            const keywordQuery = query(
              reportsRef,
              where('content', '>=', keyword),
              where('content', '<=', keyword + '\uf8ff'),
              limit(3)
            );

            const keywordQuerySnapshot = await getDocs(keywordQuery);

            keywordQuerySnapshot.forEach(doc => {
              const data = doc.data();
              const report = {
                id: doc.id,
                title: data.title || 'Scam Report',
                content: data.content || 'Scam content reported',
                category: data.category || 'Text Scam',
                riskLevel: data.riskLevel || 'medium',
                reportCount: data.reportCount || 1,
                timestamp: data.timestamp || Timestamp.now(),
                status: data.status?.trim() || 'pending'
              };
              if (report.status === 'approved' && !approvedReportsData.find(r => r.id === doc.id)) {
                approvedReportsData.push(report);
              } else if (report.status === 'pending' && !pendingReportsData.find(r => r.id === doc.id)) {
                pendingReportsData.push(report);
              }
            });
          }
        }

        setMatchedKeywords([...highRiskMatches, ...mediumRiskMatches]);
      }

      setApprovedReports(approvedReportsData);
      setPendingReports(pendingReportsData);
      setReportStatus(approvedReportsData.length > 0 ? 'approved' : pendingReportsData.length > 0 ? 'pending' : null);

      let calculatedRiskLevel: RiskLevel;
      let calculatedScore = 0;

      if (approvedReportsData.length > 0) {
        const highRiskReports = approvedReportsData.filter(r => r.riskLevel === 'high').length;
        const mediumRiskReports = approvedReportsData.filter(r => r.riskLevel === 'medium').length;

        calculatedScore = Math.min((highRiskReports * 30) + (mediumRiskReports * 15) + (approvedReportsData.length * 10), 100);

        if (highRiskReports > 0 || calculatedScore >= 50) {
          calculatedRiskLevel = 'high';
        } else if (mediumRiskReports > 0 || calculatedScore >= 20) {
          calculatedRiskLevel = 'medium';
        } else {
          calculatedRiskLevel = 'low';
        }
      } else {
        calculatedRiskLevel = 'low';
        calculatedScore = 0;
      }

      setScamScore(calculatedScore);
      setRiskLevel(calculatedRiskLevel);

    } catch (error) {
      console.error("Error searching for reports:", error);
      setApprovedReports([]);
      setPendingReports([]);
      setRiskLevel('low');
      setScamScore(0);
      setReportStatus(null);
      toast({
        title: "Error",
        description: "Failed to fetch reports. Please try again later.",
        variant: "destructive"
      });
    }

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

  const renderNoReportsUI = () => {
    const isPhoneNumber = isValidPhoneNumber(content);
    const isUrl = isValidUrl(content);

    return (
      <Card className="border-l-4 border-l-green-600">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            {isPhoneNumber ? 'No scams found for this number' : 'No scams found for this URL'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Shield className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-medium">
                {isPhoneNumber
                  ? `The phone number ${formatPhoneNumber(content)} has no reported scams based on our records.`
                  : `The URL ${normalizeUrl(content)} has no reported scams based on our records.`}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                We haven't found any reported scams associated with this {isPhoneNumber ? 'phone number' : 'URL'}.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Stay vigilant</h3>
            <ul className="list-disc pl-5 space-y-1">
              {getActionTips().map((tip, index) => (
                <li key={index} className="text-sm">{tip}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPendingReportsUI = () => {
    const isPhoneNumber = isValidPhoneNumber(content);
    const isUrl = isValidUrl(content);

    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-l-amber-600">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-amber-600" />
              {isPhoneNumber ? 'Phone Number Under Review' : 'URL Under Review'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <Shield className="h-10 w-10 text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isPhoneNumber
                    ? `The phone number ${formatPhoneNumber(content)} is reported as a scam based on our records but is still in pending status.`
                    : `The URL ${normalizeUrl(content)} is reported as a scam based on our records but is still in pending status.`}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  This {isPhoneNumber ? 'phone number' : 'URL'} needs to be verified.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Recommended Actions</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Exercise caution until verification is complete</li>
                <li>Do not share personal information</li>
                <li>Consider reporting additional details to help verification</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                className="bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-400"
                onClick={() => window.location.href = '/report'}
              >
                Report Additional Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {pendingReports.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {isPhoneNumber ? 'Pending Phone Number Scam Reports' : 'Pending URL Scam Reports'}
            </h2>
            <div className="space-y-4">
              {pendingReports.map(report => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderScamResult = () => {
    const isPhoneNumber = isValidPhoneNumber(content);
    const isUrl = isValidUrl(content);

    return (
      <Card className={`border-l-4 ${riskLevel === 'high' ? 'border-l-red-600' : 'border-l-amber-600'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            {isPhoneNumber ? 'Phone Number Scam Alert!' : 'URL Scam Alert!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-950 dark:border-red-900">
            <div className="flex items-center">
              <RiskTag level={riskLevel || 'medium'} />
              <span className={`ml-3 text-lg font-semibold ${getScoreColor()}`}>
                {scamScore}/100 Scam Score
              </span>
            </div>
            <p className="mt-2 text-sm">
              This {isPhoneNumber ? 'phone number' : 'URL'} has been reported {approvedReports.length} {approvedReports.length === 1 ? 'time' : 'times'} for scams.
            </p>
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

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:border-red-900 dark:text-red-400"
              onClick={() => window.location.href = '/report'}
            >
              Report Additional Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderReportsFoundUI = () => {
    const isPhoneNumber = isValidPhoneNumber(content);
    const isUrl = isValidUrl(content);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {isPhoneNumber ? 'Phone Number Scam Check' : 'URL Scam Check'}
          </h1>
          <div className="bg-gray-900 text-white p-4 rounded-lg font-mono">
            {isPhoneNumber ? formatPhoneNumber(content) : normalizeUrl(content)}
          </div>
        </div>

        <Button
          onClick={() => analyzeContent(content)}
          disabled={isAnalyzing}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          {isAnalyzing ? 'Analyzing...' : 'Check Now'}
        </Button>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            {isPhoneNumber ? 'Phone Number Scam Reports' : 'URL Scam Reports'}
          </h2>
          <div className="space-y-4">
            {approvedReports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={resetState}>
            Clear & Start Over
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {!isAnalyzing && riskLevel !== null && reportStatus === 'approved' && approvedReports.length > 0 ? (
          renderReportsFoundUI()
        ) : (
          <>
            <h1 className="text-2xl font-bold">Scam Check</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Enter any Phone number or URL to check for scams..."
                  className={`min-h-32 ${inputError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setInputError('');
                  }}
                />
                {inputError && (
                  <div className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {inputError}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={!content.trim() || isAnalyzing || !!inputError}
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
                {reportStatus === 'approved' && approvedReports.length > 0 ? (
                  renderScamResult()
                ) : reportStatus === 'pending' ? (
                  renderPendingReportsUI()
                ) : (
                  renderNoReportsUI()
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={resetState}>
                    Clear & Start Over
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ScamCheck;
