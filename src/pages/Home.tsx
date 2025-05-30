import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Briefcase,
  CreditCard,
  Globe,
  Gift,
  Dices,
  Banknote,
  AlertCircle
} from 'lucide-react';
import CategoryCard from '@/components/common/CategoryCard';
import ReportCard, { Report } from '@/components/common/ReportCard';
import Layout from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';

const Home: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [latestReports, setLatestReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const validatePhoneNumber = (input: string) => {
    const isPhone = /^\d+$/.test(input);
    if (isPhone && input.length !== 10) {
      return 'Please enter a valid 10-digit phone number';
    }
    return '';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const error = validatePhoneNumber(searchInput);
    if (error && /^\d+$/.test(searchInput)) {
      setInputError(error);
      toast({
        title: "Invalid Phone Number",
        description: error,
        variant: "destructive"
      });
      return;
    }

    setInputError('');
    navigate(`/check?q=${encodeURIComponent(searchInput.trim())}`);
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, orderBy('timestamp', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);

        const reports: Report[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled Report',
            content: data.content || 'No content provided',
            category: data.category || 'Uncategorized',
            riskLevel: data.riskLevel || 'medium',
            reportCount: data.reportCount || 1,
            timestamp: data.timestamp || Timestamp.now(),
            reporterName: data.reporterName,
            screenshotUrl: data.screenshotUrl || '',
          };
        });

        setLatestReports(reports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Failed to load reports",
          description: "Showing fallback examples.",
        });

        setLatestReports([
          {
            id: '1',
            title: 'Suspicious Job Offer',
            content: 'Remote job with high pay, asking upfront money for "training".',
            category: 'Job Scam',
            riskLevel: 'high',
            reportCount: 47,
            timestamp: Timestamp.now(),
            screenshotUrl: '',
          },
          {
            id: '2',
            title: 'Bank OTP Request',
            content: 'Fake bank message asking for OTP.',
            category: 'Banking Scam',
            riskLevel: 'high',
            reportCount: 124,
            timestamp: Timestamp.now(),
            screenshotUrl: '',
          },
          {
            id: '3',
            title: 'Fake Shopping Website',
            content: 'Low-priced branded items without secure payment.',
            category: 'Fake Website',
            riskLevel: 'medium',
            reportCount: 32,
            timestamp: Timestamp.now(),
            screenshotUrl: '',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const categoryCards = [
    { title: 'Job Scams', icon: <Briefcase className="h-5 w-5" />, link: "/explorer?category=job", color: "bg-blue-100 text-blue-600", bgColor: "bg-blue-50" },
    { title: 'Banking/OTP', icon: <CreditCard className="h-5 w-5" />, link: "/explorer?category=banking", color: "bg-red-100 text-red-600", bgColor: "bg-red-50" },
    { title: 'Fake Sites', icon: <Globe className="h-5 w-5" />, link: "/explorer?category=website", color: "bg-green-100 text-green-600", bgColor: "bg-green-50" },
    { title: 'Lottery', icon: <Gift className="h-5 w-5" />, link: "/explorer?category=lottery", color: "bg-yellow-100 text-yellow-600", bgColor: "bg-yellow-50" },
    { title: 'Betting Apps', icon: <Dices className="h-5 w-5" />, link: "/explorer?category=betting", color: "bg-purple-100 text-purple-600", bgColor: "bg-purple-50" },
    { title: 'Loan Apps', icon: <Banknote className="h-5 w-5" />, link: "/explorer?category=loan-apps", color: "bg-orange-100 text-orange-600", bgColor: "bg-orange-50" }
  ];

  return (
    <Layout>
      <div className="flex flex-col space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-scamshield-blue to-blue-500 rounded-2xl p-6 shadow-lg text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome to ScamShield</h1>
          <p className="text-blue-50 mb-6">Check, report, and protect yourself from scams.</p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex flex-col gap-2">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Paste message, URL, or phone number to check..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setInputError('');
                }}
                className="bg-white/90 border-0 placeholder-gray-500 text-gray-900"
                error={!!inputError}
              />
              {inputError && (
                <div className="absolute -bottom-6 left-0 text-xs text-red-200 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {inputError}
                </div>
              )}
            </div>
            <div className="flex mt-2">
              <Button type="submit" variant="secondary" className="ml-auto">Check Now</Button>
            </div>
          </form>
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Categories</h2>
          {isMobile ? (
            <div className="grid grid-cols-3 gap-2">
              {categoryCards.map((card, index) => (
                <CategoryCard
                  key={index}
                  title={card.title}
                  icon={card.icon}
                  link={card.link}
                  color={card.color}
                  bgColor={card.bgColor}
                />
              ))}
            </div>
          ) : (
            <div
              className="grid gap-4 w-full"
              style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
            >
              {categoryCards.map((card, index) => (
                <div
                  key={index}
                  className="relative w-full"
                  style={{ paddingTop: '100%' }}
                >
                  <div className="absolute inset-0">
                    <CategoryCard
                      title={card.title}
                      icon={card.icon}
                      link={card.link}
                      color={card.color}
                      bgColor={card.bgColor}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Reports */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Latest Reports</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse-slow">
                  <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-full"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3 w-5/6"></div>
                  <div className="flex gap-2">
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                    <div className="h-5 bg-gray-200 rounded w-24"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {latestReports.map((report) => (
                  <div
                    key={report.id}
                    className="group cursor-pointer transition-transform transform hover:scale-[1.03] hover:shadow-lg hover:z-10 rounded-md"
                  >
                    <ReportCard report={report} />
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <Button variant="link" className="text-blue-600" onClick={() => navigate('/explorer')}>
                  View All Reports →
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
