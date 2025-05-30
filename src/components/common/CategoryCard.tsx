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
    <Link to={link} className="block w-full h-full">
      <div
        className={`
          group aspect-square flex flex-col items-center justify-center p-3 
          rounded-xl border border-gray-300 dark:border-gray-600
          shadow-md hover:shadow-xl transition-shadow
          hover:scale-110 transition-transform duration-300 ease-in-out
          ${bgColor}
          hover:bg-gray-900 dark:hover:bg-opacity-100
          cursor-pointer
        `}
      >
        <div className={`p-3 rounded-full ${color} mb-2`}>
          {icon}
        </div>
        <span className="
          text-sm font-medium text-center 
          text-black dark:text-black 
          group-hover:text-white dark:group-hover:text-white 
          transition-colors
        ">
          {title}
        </span>
      </div>
    </Link>
  );
};

export default CategoryCard;
