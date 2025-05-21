
import React from 'react';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  title: string;
  icon: React.ReactNode;
  link: string;
  color: string;
  bgColor: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, icon, link, color, bgColor }) => {
  return (
    <Link to={link} className="block">
      <div className={`category-card ${bgColor}`}>
        <div className={`p-3 rounded-full ${color} mb-2`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-center">{title}</span>
      </div>
    </Link>
  );
};

export default CategoryCard;
