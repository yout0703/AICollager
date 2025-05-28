'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, Share2, Download, Filter, Grid, List } from 'lucide-react';

interface CollageItem {
  id: string;
  uuid: string;
  title: string;
  description: string;
  thumbnail: string;
  preview: string;
  author: string;
  likes: number;
  views: number;
  createdAt: string;
  style: string;
  theme: string;
  isLiked?: boolean;
}

type SortBy = 'newest' | 'popular' | 'likes';
type ViewMode = 'grid' | 'list';

export default function GalleryPage() {
  const [collages, setCollages] = useState<CollageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');

  // 模拟数据
  useEffect(() => {
    const mockCollages: CollageItem[] = [
      {
        id: '1',
        uuid: 'abc123',
        title: '夏日回忆',
        description: '海边度假的美好时光',
        thumbnail: '/api/placeholder/300/200',
        preview: '/api/placeholder/600/400',
        author: '小明',
        likes: 125,
        views: 1250,
        createdAt: '2024-12-01',
        style: 'modern',
        theme: 'travel'
      },
      {
        id: '2',
        uuid: 'def456',
        title: '家庭聚会',
        description: '温暖的家庭时光',
        thumbnail: '/api/placeholder/300/200',
        preview: '/api/placeholder/600/400',
        author: '小红',
        likes: 89,
        views: 856,
        createdAt: '2024-11-28',
        style: 'vintage',
        theme: 'family'
      },
      {
        id: '3',
        uuid: 'ghi789',
        title: '美食探索',
        description: '品味生活的美好',
        thumbnail: '/api/placeholder/300/200',
        preview: '/api/placeholder/600/400',
        author: '美食达人',
        likes: 234,
        views: 2145,
        createdAt: '2024-11-25',
        style: 'artistic',
        theme: 'food'
      },
      {
        id: '4',
        uuid: 'jkl012',
        title: '宠物日常',
        description: '可爱的毛茸茸朋友们',
        thumbnail: '/api/placeholder/300/200',
        preview: '/api/placeholder/600/400',
        author: '铲屎官',
        likes: 156,
        views: 1678,
        createdAt: '2024-11-20',
        style: 'minimal',
        theme: 'pets'
      }
    ];

    setTimeout(() => {
      setCollages(mockCollages);
      setLoading(false);
    }, 1000);
  }, []);

  const handleLike = (id: string) => {
    setCollages(prev => prev.map(collage => 
      collage.id === id 
        ? { 
            ...collage, 
            likes: collage.isLiked ? collage.likes - 1 : collage.likes + 1,
            isLiked: !collage.isLiked 
          }
        : collage
    ));
  };

  const filteredAndSortedCollages = React.useMemo(() => {
    let filtered = collages;

    // 按风格筛选
    if (selectedStyle !== 'all') {
      filtered = filtered.filter(collage => collage.style === selectedStyle);
    }

    // 按主题筛选
    if (selectedTheme !== 'all') {
      filtered = filtered.filter(collage => collage.theme === selectedTheme);
    }

    // 排序
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.views - a.views;
        case 'likes':
          return b.likes - a.likes;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [collages, selectedStyle, selectedTheme, sortBy]);

  const CollageCard = ({ collage }: { collage: CollageItem }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video">
        <Image
          src={collage.thumbnail}
          alt={collage.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
          <Link
            href={`/zh/collage/${collage.uuid}`}
            className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            查看详情
          </Link>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2">{collage.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{collage.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>by {collage.author}</span>
          <span>{new Date(collage.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLike(collage.id)}
              className={`flex items-center space-x-1 ${
                collage.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              } transition-colors`}
            >
              <Heart className={`w-4 h-4 ${collage.isLiked ? 'fill-current' : ''}`} />
              <span>{collage.likes}</span>
            </button>
            
            <div className="flex items-center space-x-1 text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{collage.views}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">精选作品画廊</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              探索社区创作者们的精美AI拼图作品，获取创作灵感
            </p>
          </div>
        </div>
      </div>

      {/* 筛选和排序 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">筛选:</span>
            </div>
            
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有风格</option>
              <option value="modern">现代风格</option>
              <option value="vintage">复古风格</option>
              <option value="artistic">艺术风格</option>
              <option value="minimal">极简风格</option>
            </select>
            
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有主题</option>
              <option value="travel">旅行</option>
              <option value="family">家庭</option>
              <option value="food">美食</option>
              <option value="pets">宠物</option>
              <option value="celebration">庆祝</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">最新</option>
              <option value="popular">最热门</option>
              <option value="likes">最多赞</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              } transition-colors`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              } transition-colors`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 作品网格 */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredAndSortedCollages.map((collage) => (
              <CollageCard key={collage.id} collage={collage} />
            ))}
          </div>
        )}

        {!loading && filteredAndSortedCollages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Grid className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无匹配的作品</h3>
            <p className="text-gray-600">请尝试调整筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
} 