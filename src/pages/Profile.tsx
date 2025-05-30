// All your existing imports remain unchanged
import React, { useEffect, useRef, useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ReportCard, { Report } from '@/components/common/ReportCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEFAULT_PORTRAIT = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

function isGoogleLetterAvatar(url: string | null | undefined): boolean {
  if (!url) return true;
  return (
    url.includes('googleusercontent.com') &&
    (url.includes('default-user') || url.match(/\/a\/[^/]+$/))
  ) || url.includes('avatar_2x.png') || url.includes('blank-profile');
}

const badgeThresholds = [
  { reports: 1, name: 'First Report', description: 'Submitted your first scam report', color: 'bg-blue-100 text-blue-700', emoji: '🎉' },
  { reports: 5, name: 'Scam Spotter', description: 'Identified 5 potential scams', color: 'bg-purple-100 text-purple-700', emoji: '🕵️‍♂️' },
  { reports: 10, name: 'Investigator', description: 'Submitted 10 scam reports', color: 'bg-yellow-100 text-yellow-700', emoji: '🔍' },
  { reports: 25, name: 'Safety Advocate', description: '25 reports for community safety', color: 'bg-green-100 text-green-700', emoji: '🛡️' },
  { reports: 50, name: 'Trusted Reporter', description: 'Contributed 50 valuable reports', color: 'bg-pink-100 text-pink-700', emoji: '💎' },
  { reports: 75, name: 'Scam Buster', description: '75 scam busts achieved!', color: 'bg-indigo-100 text-indigo-700', emoji: '🚫' },
  { reports: 100, name: 'Centurion', description: '100 reports milestone unlocked!', color: 'bg-red-100 text-red-700', emoji: '🏆' },
  { reports: 150, name: 'Community Hero', description: 'Protected users with 150 reports', color: 'bg-orange-100 text-orange-700', emoji: '🦸‍♂️' },
  { reports: 200, name: 'Shield Bearer', description: '200 total reports submitted', color: 'bg-teal-100 text-teal-700', emoji: '🛡️' },
  { reports: 300, name: 'Legendary Reporter', description: 'Reached 300 scam reports!', color: 'bg-gray-100 text-gray-700', emoji: '🌟' },
];

const Profile: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reputationScore, setReputationScore] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<typeof badgeThresholds>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_PORTRAIT);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (isGoogleLetterAvatar(currentUser.photoURL)) {
      setProfileImage(DEFAULT_PORTRAIT);
    } else {
      setProfileImage(currentUser.photoURL || DEFAULT_PORTRAIT);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserReports = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(
          reportsRef,
          where('reporterId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(300)
        );

        const querySnapshot = await getDocs(q);
        const reports: Report[] = querySnapshot.docs.map((doc) => {
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
          };
        });

        setUserReports(reports);
        setReputationScore(reports.length * 10);
        const eligibleBadges = badgeThresholds.filter(b => reports.length >= b.reports);
        setEarnedBadges(eligibleBadges);
      } catch (error) {
        console.error('Error fetching user reports:', error);
        setUserReports([]);
        setReputationScore(0);
        setEarnedBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserReports();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfileImage = () => {
    if (previewImage) {
      setProfileImage(previewImage);
    }
    if (editingBio) {
      setBio(bioInput);
      setEditingBio(false);
    }
    setIsEditing(false);
    setPreviewImage(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setPreviewImage(null);
    setEditingBio(false);
    setBioInput(bio);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeProfilePhoto = () => {
    setPreviewImage(null);
    setProfileImage(DEFAULT_PORTRAIT);
  };

  const isCustomImage = profileImage !== DEFAULT_PORTRAIT;

  return (
    <Layout requireAuth={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profileImage} alt="Profile Photo" />
                <AvatarFallback />
              </Avatar>
              <div>
                <CardTitle>{currentUser.displayName || 'User'}</CardTitle>
                {bio && !isEditing && (
                  <p className="text-sm text-muted-foreground mt-1">{bio}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4 sm:mt-0">
              {!isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={saveProfileImage}
                    disabled={!previewImage && !isCustomImage && !editingBio}
                  >
                    Save
                  </Button>
                </>
              )}
            </div>
          </CardHeader>

          {isEditing && (
            <CardContent className="flex flex-col items-center space-y-4 mt-6">
              <div className="relative w-32 h-32">
                <img
                  src={previewImage || profileImage}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-2 border-gray-400"
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={triggerFileInput}>
                  {isCustomImage ? 'Add New Profile Photo' : 'Add Profile Photo'}
                </Button>
                {isCustomImage && (
                  <Button variant="destructive" onClick={removeProfilePhoto}>
                    Remove Profile Photo
                  </Button>
                )}
              </div>

              {/* Bio section */}
              {!editingBio ? (
                <Button variant="outline" onClick={() => { setEditingBio(true); setBioInput(bio); }}>
                  {bio ? 'Edit Bio' : 'Add Bio'}
                </Button>
              ) : (
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white"
                  rows={3}
                  placeholder="Write something about yourself..."
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                />
              )}
            </CardContent>
          )}

          {!isEditing && (
            <CardContent>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg space-x-4">
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
                  <p className="text-2xl font-bold text-primary">{earnedBadges.length}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Tabs defaultValue="your-reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="your-reports">Your Reports</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="your-reports">
            {loading ? (
              <p>Loading your reports...</p>
            ) : userReports.length === 0 ? (
              <p>You have not submitted any reports yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {userReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            )}
          </TabsContent>

         <TabsContent value="badges">
  {earnedBadges.length === 0 ? (
    <p>You have not earned any badges yet.</p>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {earnedBadges.map((badge) => (
        <Card
          key={badge.name}
          className={`p-4 ${badge.color} transform transition-transform duration-300 hover:scale-105 hover:shadow-lg cursor-pointer`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <span>{badge.emoji}</span>
              {badge.name}
            </CardTitle>
            <CardDescription>{badge.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )}
</TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
