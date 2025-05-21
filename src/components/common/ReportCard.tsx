import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageCircle } from 'lucide-react';
import RiskTag from './RiskTag';
import { Link } from 'react-router-dom';

export interface Report {
  id: string;
  title: string;
  content: string;
  category: string;
  riskLevel: string;
  reportCount: number;
  timestamp: any;
  reporterName?: string;
  contactInfo?: string;
  screenshotUrl?: string;
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Unknown date';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">{report.title}</CardTitle>
          <Badge variant="secondary">{report.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-500 truncate">{report.content}</p>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center text-gray-400">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(report.timestamp)}
          </div>
          <div className="flex items-center text-gray-400">
            <MessageCircle className="h-3 w-3 mr-1" />
            {report.reportCount} reports
          </div>
        </div>
        <div className="flex justify-between items-center">
          <RiskTag level={report.riskLevel} />
          <Link to={`/report/${report.id}`} className="text-blue-500 hover:underline text-sm">
            Read more
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;
