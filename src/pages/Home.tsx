
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Briefcase, CreditCard, Globe, Gift, Dices } from 'lucide-react';
import CategoryCard from '@/components/common/CategoryCard';
import ReportCard, { Report } from '@/components/common/ReportCard';
import Layout from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Home: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [latestReports, setLatestReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/check?q=${encodeURIComponent(searchInput.trim())}`);
    }
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
            reporterName: data.reporterName
          };
        });
        
        setLatestReports(reports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        // Use dummy data if fetch fails
        setLatestReports([
          {
            id: '1',
            title: 'Suspicious Job Offer',
            content: 'Received an email claiming to offer a remote job with very high pay but asking for payment upfront for "training materials".',
            category: 'Job Scam',
            riskLevel: 'high',
            reportCount: 47,
            timestamp: Timestamp.now()
          },
          {
            id: '2',
            title: 'Bank OTP Request',
            content: 'Got a text message claiming to be from my bank asking for an OTP to "verify my account".',
            category: 'Banking Scam',
            riskLevel: 'high',
            reportCount: 124,
            timestamp: Timestamp.now()
          },
          {
            id: '3',
            title: 'Fake Shopping Website',
            content: 'Found a website selling branded items at suspiciously low prices with no secure payment options.',
            category: 'Fake Website',
            riskLevel: 'medium',
            reportCount: 32,
            timestamp: Timestamp.now()
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
    { title: 'Betting Apps', icon: <Dices className="h-5 w-5" />, link: "/explorer?category=betting", color: "bg-purple-100 text-purple-600", bgColor: "bg-purple-50" }
  ];

  return (
    <Layout>
      <div className="flex flex-col space-y-8">
        <div className="bg-gradient-to-r from-scamshield-blue to-blue-500 rounded-2xl p-6 shadow-lg text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome to ScamShield</h1>
          <p className="text-blue-50 mb-6">Check, report, and protect yourself from scams.</p>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Paste message, URL, or phone number to check..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white/90 border-0 placeholder-gray-500 text-gray-900"
            />
            <Button type="submit" variant="secondary">Check Now</Button>
          </form>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Categories</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
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
        </div>
        
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latestReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
