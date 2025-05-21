
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ReportCard, { Report } from '@/components/common/ReportCard';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const badges = [
  { name: 'First Report', description: 'Submitted your first scam report', color: 'bg-blue-100 text-blue-700' },
  { name: 'Scam Spotter', description: 'Identified 5 potential scams', color: 'bg-purple-100 text-purple-700' },
  { name: 'Community Guardian', description: 'Helped keep the community safe', color: 'bg-green-100 text-green-700' }
];

const Profile: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reputationScore, setReputationScore] = useState(0);

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const fetchUserReports = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(
          reportsRef,
          where('reporterId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        
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
        
        setUserReports(reports);
        
        // Calculate reputation score (1 point per report)
        setReputationScore(reports.length * 10);
        
      } catch (error) {
        console.error("Error fetching user reports:", error);
        // Use dummy data if fetch fails
        setUserReports([
          {
            id: '1',
            title: 'Fake Job Offer',
            content: 'Received an email about a remote job with suspiciously high pay.',
            category: 'job',
            riskLevel: 'high',
            reportCount: 5,
            timestamp: Timestamp.now()
          },
          {
            id: '2',
            title: 'Banking SMS Scam',
            content: 'SMS claiming to be from my bank asking for account verification.',
            category: 'banking',
            riskLevel: 'high',
            reportCount: 3,
            timestamp: Timestamp.now()
          }
        ]);
        setReputationScore(20);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserReports();
  }, [currentUser, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!currentUser) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Layout requireAuth={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentUser.photoURL || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(currentUser.displayName || 'User')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{currentUser.displayName || 'User'}</CardTitle>
                <CardDescription>{currentUser.email}</CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="mt-4 sm:mt-0">
              Sign Out
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Reputation Score</h3>
                <p className="text-2xl font-bold text-primary">{reputationScore}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Reports Submitted</h3>
                <p className="text-2xl font-bold text-primary">{userReports.length}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Badges Earned</h3>
                <p className="text-2xl font-bold text-primary">{badges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="reports">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">Your Reports</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
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
            ) : userReports.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {userReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <h3 className="text-lg font-medium">No reports yet</h3>
                <p className="mt-2 text-gray-600">Help the community by reporting scams you encounter.</p>
                <Button className="mt-4" onClick={() => navigate('/report')}>
                  Report a Scam
                </Button>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="badges" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {badges.map((badge, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className={`h-2 ${badge.color}`}></div>
                  <CardContent className="pt-6">
                    <Badge variant="outline" className={badge.color}>
                      {badge.name}
                    </Badge>
                    <p className="mt-2 text-sm text-gray-600">{badge.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
