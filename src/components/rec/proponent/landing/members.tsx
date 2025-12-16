"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { Crown, FileText, Shield, UserCog, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { reviewersManagementService, Reviewer, ReviewerRole } from "@/lib/services/reviewers/reviewersManagementService";

interface DisplayMember {
  id: string;
  name: string;
  image: string;
  position: 'chair' | 'vice-chair' |'secretary' | 'office-secretary' | 'member';
  department?: string;
  specialty?: string;
  highestEducationalAttainment?: string;
  educationalBackground?: string;
  roleInREC?: string;
  sex?: string;
  ageCategory?: string;
}

const REC_MEMBER_ROLES: ReviewerRole[] = ['chairperson', 'vice-chair', 'secretary', 'office-secretary', 'member'];

export const Members = () => {
  const { ref: membersRef, isVisible: membersVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true });
  const [members, setMembers] = useState<DisplayMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const allReviewers = await reviewersManagementService.getAllReviewers();
      
      // Filter only active reviewers with REC member roles
      const recMembers = allReviewers.filter(r => 
        r.isActive && r.role && REC_MEMBER_ROLES.includes(r.role)
      );

      // Debug: Log roles found
      console.log('REC Members found:', recMembers.map(r => ({ name: r.name, role: r.role })));

      // Transform reviewers to display members
      const displayMembers: DisplayMember[] = recMembers.map(reviewer => {
        // Get image URL - use imageUrl if available, otherwise use getMemberImagePath
        let imageUrl = reviewer.imageUrl;
        if (!imageUrl) {
          // Try .png first, then .jpg as fallback
          const imagePathPng = reviewersManagementService.getMemberImagePath(reviewer.name);
          const imagePathJpg = imagePathPng?.replace('.png', '.jpg') || null;
          // Use .png by default, the onError handler will try .jpg if needed
          imageUrl = imagePathPng || '/SPUP-Logo-with-yellow.png';
        }

        // Map role to display position
        let position: 'chair' | 'vice-chair' | 'secretary' | 'office-secretary' | 'member' = 'member';
        let department = 'REC Member';
        
        if (reviewer.role === 'chairperson') {
          position = 'chair';
          department = 'REC Chairperson';
        } else if (reviewer.role === 'vice-chair') {
          position = 'vice-chair';
          department = 'REC Vice Chairperson';
        } else if (reviewer.role === 'secretary') {
          position = 'secretary';
          department = 'REC Secretary';
        } else if (reviewer.role === 'office-secretary') {
          position = 'office-secretary';
          department = 'REC Office Secretary';
        }

        return {
          id: reviewer.id,
          name: reviewer.name,
          image: imageUrl,
          position,
          department,
          specialty: reviewer.specialty,
          highestEducationalAttainment: reviewer.highestEducationalAttainment,
          educationalBackground: reviewer.educationalBackground,
          roleInREC: reviewer.roleInREC,
          sex: reviewer.sex,
          ageCategory: reviewer.ageCategory
        };
      });

      // Sort members: chair first, vice-chair second, secretary, office-secretary, then members
      displayMembers.sort((a, b) => {
        const order = { 
          chair: 0, 
          'vice-chair': 1, 
          'secretary': 2,
          'office-secretary': 3,
          member: 4 
        };
        return (order[a.position] ?? 99) - (order[b.position] ?? 99);
      });

      setMembers(displayMembers);
    } catch (error) {
      console.error('Error loading REC members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case 'chair':
        return (
          <Badge className="bg-[#FECC07] text-[#036635] border-[#FECC07] hover:bg-[#FECC07]/90">
            <Crown className="h-3 w-3 mr-1" />
            Chair
          </Badge>
        );
      case 'vice-chair':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
            <Shield className="h-3 w-3 mr-1" />
            Vice Chair
          </Badge>
        );
      case 'secretary':
        return (
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <FileText className="h-3 w-3 mr-1" />
            Secretary
          </Badge>
        );
      case 'office-secretary':
        return (
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <UserCog className="h-3 w-3 mr-1" />
            Office Secretary
          </Badge>
        );
      default:
        return (
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Users className="h-3 w-3 mr-1" />
            Member
          </Badge>
        );
    }
  };

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div 
          ref={membersRef}
          className={`flex gap-4 py-8 lg:py-12 flex-col items-center transition-all duration-1000 ${
            membersVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Header */}
          <div className={`flex gap-2 flex-col items-center text-center transition-all duration-700 delay-100 ${
            membersVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tighter font-regular text-foreground">
              Our Committee Members
            </h2>
            <p className="text-base sm:text-lg max-w-2xl leading-relaxed tracking-tight text-muted-foreground">
              Meet the dedicated professionals who ensure ethical standards in research at SPUP
            </p>
          </div>

          {/* Members Grid */}
          {loading ? (
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full mt-8 transition-all duration-700 delay-200 ${
              membersVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="relative w-full max-w-[280px] mx-auto rounded-lg overflow-hidden bg-card border border-border shadow-sm animate-pulse flex flex-col"
                >
                  <div className="relative w-full flex-[2] min-h-[200px] bg-muted" />
                  <div className="bg-[#036635] px-4 py-3 flex-[1] flex flex-col items-center justify-center gap-2">
                    <div className="h-3 w-28 bg-white/20 rounded mb-1" />
                    <div className="h-5 w-20 bg-white/20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length > 0 ? (
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full mt-8 transition-all duration-700 delay-200 ${
              membersVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {members.map((member) => {
                const hasDetails = member.specialty || member.highestEducationalAttainment || member.educationalBackground || member.roleInREC || member.sex || member.ageCategory;
                
                return (
                  <div
                    key={member.id}
                    className="group relative w-full max-w-[280px] mx-auto rounded-lg overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
                  >
                    {/* Photo Section - Top 2/3 */}
                    <div className="relative w-full flex-[2] min-h-[400px] bg-muted overflow-hidden">
                      {/* Image */}
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover transition-all duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // Try .jpg if .png failed (e.g., for Rita Daliwag)
                          if (target.src.endsWith('.png')) {
                            target.src = target.src.replace('.png', '.jpg');
                          } else {
                            // If .jpg also fails, use fallback logo
                            target.src = '/SPUP-Logo-with-yellow.png';
                          }
                        }}
                      />
                      {/* Gradient Overlay on Hover - matches design: transparent at 0% to opaque at 85% */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-b from-transparent via-[#036635]/30 to-[#036635]/100" />
                    </div>

                    {/* Green Section - Bottom 1/3 with fixed height and overflow hidden */}
                    <div className="relative bg-[#036635] px-4 py-3 flex-[1] min-h-[90px] max-h-[90px] flex flex-col items-center justify-center text-center overflow-hidden">
                      {/* Content Container - Shifts up on hover */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-500 ease-in-out group-hover:-translate-y-8 px-4 z-10">
                        {/* Name */}
                        <h3 className="font-semibold text-white text-sm leading-tight mb-1.5">
                          {member.name}
                        </h3>
                        
                        {/* Role Badge */}
                        <div className="flex items-center justify-center">
                          {getPositionBadge(member.position)}
                        </div>
                      </div>

                      {/* Additional Details - Slides in from bottom on hover */}
                      {hasDetails && (
                        <div className="absolute inset-x-0 bottom-0 left-0 right-0 px-4 pb-3 transform translate-y-full group-hover:translate-y-0 transition-all duration-500 ease-in-out z-20 bg-[#036635] min-h-[90px] flex items-center justify-center">
                          <div className="flex flex-col gap-0.5 items-center text-center w-full">
                            {member.highestEducationalAttainment && (
                              <p className="text-white/90 text-xs font-medium">
                                {member.highestEducationalAttainment}
                              </p>
                            )}
                            {member.specialty && (
                              <p className="text-white text-sm">
                                {member.specialty}
                              </p>
                            )}
                            {member.educationalBackground && !member.highestEducationalAttainment && (
                              <p className="text-white text-sm">
                                {member.educationalBackground}
                              </p>
                            )}
                            {member.roleInREC && (
                              <p className="text-white/90 text-xs">
                                {member.roleInREC}
                              </p>
                            )}
                            {(member.sex || member.ageCategory) && (
                              <div className="flex gap-1.5 items-center mt-0.5">
                                {member.sex && (
                                  <p className="text-white/80 text-xs">
                                    {member.sex}
                                  </p>
                                )}
                                {member.ageCategory && (
                                  <p className="text-white/80 text-xs">
                                    {member.ageCategory}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`w-full mt-8 text-center transition-all duration-700 delay-200 ${
              membersVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <p className="text-muted-foreground">No committee members found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

