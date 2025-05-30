import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReportCard, { Report } from '@/components/common/ReportCard';
import { collection, query, where, orderBy, limit, getDocs, startAfter, DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ScamExplorer: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const loadReports = async (isFirstLoad = false) => {
    setLoading(true);
    
    try {
      const reportsRef = collection(db, 'reports');
      let q = query(reportsRef, where('status', '==', 'approved'));
      
      // Apply category filter if selected
      if (categoryFilter && categoryFilter !== 'all') {
        q = query(q, where('category', '==', categoryFilter));
      }
      
      // Apply risk filter if selected
      if (riskFilter && riskFilter !== 'all') {
        q = query(q, where('riskLevel', '==', riskFilter));
      }
      
      // Apply sorting
      if (sortBy === 'latest') {
        q = query(q, orderBy('timestamp', 'desc'));
      } else if (sortBy === 'reported') {
        q = query(q, orderBy('reportCount', 'desc'));
      }
      
      // Apply pagination
      q = query(q, limit(10));
      
      // If not the first load, start after the last document
      if (!isFirstLoad && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }
      
      const querySnapshot = await getDocs(q);
      
      // If no documents returned, there are no more to load
      if (querySnapshot.empty) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      
      // Update the last visible document for pagination
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      
      const newReports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Report',
          content: data.content || 'No content provided',
          category: data.category || 'Uncategorized',
          riskLevel: data.riskLevel || 'medium',
          reportCount: data.reportCount || 1,
          timestamp: data.timestamp || Timestamp.now()
        };
      });
      
      // If it's a new search/filter, replace the reports array
      // Otherwise, append to it
      if (isFirstLoad) {
        setReports(newReports);
      } else {
        setReports(prev => [...prev, ...newReports]);
      }
      
    } catch (error) {
      console.error("Error fetching reports:", error);
      
      // If we can't fetch from Firestore, use dummy data for demonstration
      if (isFirstLoad) {
        const dummyReports: Report[] = [
          {
            id: '1',
            title: 'Suspicious Job Offer',
            content: 'Received an email claiming to offer a remote job with very high pay but asking for payment upfront for "training materials".',
            category: 'job',
            riskLevel: 'high',
            reportCount: 47,
            timestamp: Timestamp.now()
          },
          {
            id: '2',
            title: 'Bank OTP Request',
            content: 'Got a text message claiming to be from my bank asking for an OTP to "verify my account".',
            category: 'banking',
            riskLevel: 'high',
            reportCount: 124,
            timestamp: Timestamp.now()
          },
          {
            id: '3',
            title: 'Fake Shopping Website',
            content: 'Found a website selling branded items at suspiciously low prices with no secure payment options.',
            category: 'website',
            riskLevel: 'medium',
            reportCount: 32,
            timestamp: Timestamp.now()
          },
          {
            id: '4',
            title: 'Lottery Winner Notification',
            content: 'Received an email saying I won a lottery I never entered, asking for personal details to claim the prize.',
            category: 'lottery',
            riskLevel: 'high',
            reportCount: 89,
            timestamp: Timestamp.now()
          },
          {
            id: '5',
            title: 'Unregulated Betting App',
            content: 'Found a betting app promising guaranteed returns but requiring large deposits upfront.',
            category: 'betting',
            riskLevel: 'high',
            reportCount: 56,
            timestamp: Timestamp.now()
          }
        ];
        
        // Apply filters to dummy data
        let filteredReports = dummyReports;
        
        if (categoryFilter && categoryFilter !== 'all') {
          filteredReports = filteredReports.filter(report => report.category === categoryFilter);
        }
        
        if (riskFilter && riskFilter !== 'all') {
          filteredReports = filteredReports.filter(report => report.riskLevel === riskFilter);
        }
        
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredReports = filteredReports.filter(report => 
            report.title.toLowerCase().includes(term) || 
            report.content.toLowerCase().includes(term)
          );
        }
        
        // Apply sorting
        if (sortBy === 'latest') {
          // Already sorted by timestamp in the dummy data
        } else if (sortBy === 'reported') {
          filteredReports.sort((a, b) => b.reportCount - a.reportCount);
        }
        
        setReports(filteredReports);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadReports(true);
  }, [categoryFilter, riskFilter, sortBy]);

  // Handle search
  const handleSearch = () => {
    // For a real app, you'd implement search on Firestore
    // For this demo, just filter the reports we already have
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const filtered = reports.filter(report => 
        report.title.toLowerCase().includes(term) || 
        report.content.toLowerCase().includes(term)
      );
      setReports(filtered);
    } else {
      // If search is cleared, reload reports
      loadReports(true);
    }
  };

  // Handle filter reset
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setRiskFilter('all');
    setSortBy('latest');
    loadReports(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Scam Explorer</h1>
        
        <div className="bg-white border rounded-lg p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search in reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="job">Job Scams</SelectItem>
                <SelectItem value="banking">OTP/Banking</SelectItem>
                <SelectItem value="website">Fake Websites</SelectItem>
                <SelectItem value="lottery">Lottery/Giveaway</SelectItem>
                <SelectItem value="betting">Betting Apps</SelectItem>
                <SelectItem value="shopping">Shopping Scams</SelectItem>
                <SelectItem value="investment">Investment Scams</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest First</SelectItem>
                <SelectItem value="reported">Most Reported</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
        
        {loading && reports.length === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse-slow">
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-full"></div>
                <div className="h-3 bg-gray-200 rounded mb-3 w-5/6"></div>
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => loadReports()}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No reports found.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ScamExplorer;
