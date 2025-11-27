"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, Users, UserCheck } from 'lucide-react';
import { reviewersManagementService, Reviewer } from '@/lib/services/reviewers/reviewersManagementService';

interface RECMember {
  name: string;
  image: string;
  position: 'chair' | 'vice-chair' | 'member';
  department?: string;
}

// Member data with image mappings
const REC_MEMBERS: RECMember[] = [
  {
    name: 'Rita Daliwag',
    image: '/members/Rita-Daliwag.jpg',
    position: 'chair',
    department: 'REC Chairperson'
  },
  {
    name: 'Mark Klimson Luyun',
    image: '/members/Mark-Klimson-Luyun.png',
    position: 'vice-chair',
    department: 'REC Vice Chairperson'
  },
  {
    name: 'Allan Paulo Blaquera',
    image: '/members/Allan-Paulo-Blaquera.png',
    position: 'member',
    department: 'REC Member'
  },
  {
    name: 'Angelo Peralta',
    image: '/members/Angelo-Peralta.png',
    position: 'member',
    department: 'REC Member'
  },
  {
    name: 'Everett Laureta',
    image: '/members/Everett-Laureta.png',
    position: 'member',
    department: 'REC Member'
  },
  {
    name: 'Iquin Elizabeth',
    image: '/members/Iquin-Elizabeth.png',
    position: 'member',
    department: 'REC Member'
  },
  {
    name: 'Maria Felina Agbayani',
    image: '/members/Maria-Felina-Agbayani.png',
    position: 'member',
    department: 'REC Member'
  },
  {
    name: 'Marjorie Bambalan',
    image: '/members/Marjorie-Bambalan.png',
    position: 'member',
    department: 'REC Member'
  },
  {
    name: 'Milrose Tangonan',
    image: '/members/Milrose-Tangonan.png',
    position: 'member',
    department: 'REC Member'
  },
  {
    name: 'Nova Domingo',
    image: '/members/Nova-Domingo.png',
    position: 'member',
    department: 'REC Member'
  },
  {
    name: 'Vercel Baccay',
    image: '/members/Vercel-Baccay.png',
    position: 'member',
    department: 'REC Member'
  }
];

export default function RECMembersList() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviewers = async () => {
      try {
        const reviewersData = await reviewersManagementService.getAllReviewers();
        setReviewers(reviewersData);
      } catch (error) {
        console.error('Error loading reviewers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadReviewers();
  }, []);

  // Check if a member name matches a reviewer (by name matching since we don't have REC member IDs in static data)
  const isMemberAlsoReviewer = (memberName: string) => {
    return reviewers.some(reviewer => {
      const reviewerName = (reviewer as { name?: string }).name;
      return reviewerName?.toLowerCase() === memberName.toLowerCase();
    });
  };

  // Sort members: chair first, vice-chair second, then members
  const sortedMembers = [...REC_MEMBERS].sort((a, b) => {
    const order = { chair: 0, 'vice-chair': 1, member: 2 };
    return order[a.position] - order[b.position];
  });

  const getPositionBadge = (position: string) => {
    switch (position) {
      case 'chair':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Crown className="h-3 w-3 mr-1" />
            Chair
          </Badge>
        );
      case 'vice-chair':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Shield className="h-3 w-3 mr-1" />
            Vice Chair
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            Member
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Research Ethics Committee Members</h2>
        <p className="text-muted-foreground">
          Current members of the Research Ethics Committee
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedMembers.map((member, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="relative w-full h-64 bg-muted">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg leading-tight">{member.name}</h3>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {getPositionBadge(member.position)}
                  {!loading && isMemberAlsoReviewer(member.name) && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Reviewer
                    </Badge>
                  )}
                </div>
                {member.department && (
                  <p className="text-sm text-muted-foreground">{member.department}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

