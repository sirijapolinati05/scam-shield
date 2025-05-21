
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RiskTag from './RiskTag';
import { Button } from '@/components/ui/button';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Report {
  id: string;
  title: string;
  content: string;
  category: string;
  riskLevel: 'high' | 'medium' | 'low';
  reportCount: number;
  timestamp: any;
  reporterName?: string;
}

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <Card className="scam-shield-card overflow-hidden">
      <CardHeader className="p-4 pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold truncate pr-2">{report.title}</CardTitle>
          <RiskTag level={report.riskLevel} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-2">
        <p className="text-sm text-gray-600 line-clamp-2">{report.content}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-accent">
            {report.category}
          </Badge>
          <Badge variant="outline" className="bg-accent flex items-center">
            <MessageCircle className="h-3 w-3 mr-1" /> {report.reportCount} reports
          </Badge>
          <Badge variant="outline" className="bg-accent">
            {formatDate(report.timestamp)}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-end">
        <Link to={`/report/${report.id}`}>
          <Button variant="outline" size="sm" className="text-xs">
            View Details <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ReportCard;
