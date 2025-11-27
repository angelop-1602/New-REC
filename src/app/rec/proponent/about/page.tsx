"use client"

import { useState, useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewersManagementService, Reviewer } from "@/lib/services/reviewers/reviewersManagementService";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Footer } from '@/components/rec/proponent/landing/footer';

interface Member {
  name: string;
  role: string;
  qualifications?: string;
  photo: string;
}

// Map member names to their image files in public/members/
// This function automatically matches names to image files based on name patterns
const getMemberImagePath = (name: string): string | null => {
  // All available member images in public/members/
  // Note: Some files use Last-First format (e.g., Elizabeth-Iquin.png)
  const memberImages = [
    { file: 'Allan-Paulo-Blaquera.png', names: ['Allan Paulo Blaquera', 'Allan Paulo C. Blaquera', 'Allan Paulo', 'Blaquera'] },
    { file: 'Angelo-Peralta.png', names: ['Angelo Peralta', 'Angelo C. Peralta', 'Angelo', 'Peralta'] },
    { file: 'Everett-Laureta.png', names: ['Everett Laureta', 'Everett C. Laureta', 'Everett', 'Laureta'] },
    { file: 'Elizabeth-Iquin.png', names: ['Iquin Elizabeth', 'Elizabeth Iquin', 'Iquin Elizabeth C.', 'Iquin', 'Elizabeth'] },
    { file: 'Maria-Felina-Agbayani.png', names: ['Maria Felina Agbayani', 'Maria Felina C. Agbayani', 'Maria Felina', 'Agbayani'] },
    { file: 'Marjorie-Bambalan.png', names: ['Marjorie Bambalan', 'Marjorie C. Bambalan', 'Marjorie', 'Bambalan'] },
    { file: 'Mark-Klimson-Luyun.png', names: ['Mark Klimson Luyun', 'Mark Klimson C. Luyun', 'Mark Klimson', 'Luyun'] },
    { file: 'Milrose-Tangonan.png', names: ['Milrose Tangonan', 'Milrose C. Tangonan', 'Milrose', 'Tangonan'] },
    { file: 'Nova-Domingo.png', names: ['Nova Domingo', 'Nova C. Domingo', 'Nova', 'Domingo'] },
    { file: 'Rita-Daliwag.jpg', names: ['Rita Daliwag', 'Rita C. Daliwag', 'Rita', 'Daliwag'] },
    { file: 'Vercel-Baccay.png', names: ['Vercel Baccay', 'Vercel C. Baccay', 'Vercel', 'Baccay'] },
    { file: 'Normie-Anne-Tuazon.png', names: ['Normie Anne Tuazon', 'Normie Anne C. Tuazon', 'Normie Anne', 'Tuazon', 'Normie', 'Anne Tuazon'] },
    { file: 'Kristine-Joy-Cortes.png', names: ['Kristine Joy Cortes', 'Kristine Joy C. Cortes', 'Kristine Joy', 'Cortes', 'Kristine', 'Joy Cortes'] },
  ];

  // Normalize the input name
  const normalizeName = (n: string) => n.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedInput = normalizeName(name);

  // Try exact match first
  for (const image of memberImages) {
    for (const mappedName of image.names) {
      if (normalizeName(mappedName) === normalizedInput) {
        return `/members/${image.file}`;
      }
    }
  }

  // Try matching by last name (most reliable identifier)
  const nameParts = normalizedInput.split(' ');
  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    for (const image of memberImages) {
      const imageParts = image.file.toLowerCase().replace(/\.(png|jpg)$/i, '').split('-');
      const imageFirst = imageParts[0];
      const imageLast = imageParts[imageParts.length - 1];
      
      // Try matching: name format could be First-Last or Last-First
      // Check if last name matches (most reliable)
      if (lastName === imageLast || lastName === imageFirst) {
        return `/members/${image.file}`;
      }
      
      // Try matching first and last name (both orders)
      if (nameParts.length >= 2 && imageParts.length >= 2) {
        // First-Last format match
        if (firstName === imageFirst && lastName === imageLast) {
          return `/members/${image.file}`;
        }
        // Last-First format match (e.g., "Elizabeth Iquin" matches "Elizabeth-Iquin.png")
        if (firstName === imageLast && lastName === imageFirst) {
          return `/members/${image.file}`;
        }
      }
    }
  }

  // Try partial match with first name
  if (nameParts.length > 0) {
    const firstName = nameParts[0];
    for (const image of memberImages) {
      const imageParts = image.file.toLowerCase().replace(/\.(png|jpg)$/i, '').split('-');
      if (imageParts[0] === firstName && nameParts.length >= 2) {
        // Check if any other part matches
        for (let i = 1; i < imageParts.length && i < nameParts.length; i++) {
          if (imageParts[i] === nameParts[i]) {
            return `/members/${image.file}`;
          }
        }
      }
    }
  }

  return null;
};

// Map reviewer role to display role
const getDisplayRole = (role?: string): string => {
  const roleMap: Record<string, string> = {
    'chairperson': 'REC Chairperson',
    'vice-chair': 'REC Vice-Chairperson',
    'secretary': 'REC Secretary',
    'office-secretary': 'REC Office Secretary',
    'member': 'REC Member'
  };
  return roleMap[role || ''] || 'REC Member';
};

// Sort members by role priority
const sortMembersByRole = (members: Member[]): Member[] => {
  const rolePriority: Record<string, number> = {
    'REC Chairperson': 1,
    'REC Vice-Chairperson': 2,
    'REC Secretary': 3,
    'REC Office Secretary': 4,
    'REC Member': 5
  };
  
  return members.sort((a, b) => {
    const priorityA = rolePriority[a.role] || 99;
    const priorityB = rolePriority[b.role] || 99;
    return priorityA - priorityB;
  });
};

export default function AboutPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const reviewers = await reviewersManagementService.getAllReviewers();
        
        // Filter only active reviewers with REC roles
        const recRoles = ['chairperson', 'vice-chair', 'secretary', 'office-secretary', 'member'];
        const recMembers = reviewers.filter(r => 
          r.isActive && r.role && recRoles.includes(r.role)
        );

        // Map reviewers to member format
        const mappedMembers: Member[] = recMembers.map((reviewer: Reviewer) => {
          // Use imageUrl from database if available, otherwise try to match from public folder
          let photo = reviewer.imageUrl;
          
          if (!photo) {
            // Try to get image from public/members/ folder based on name
            const publicImagePath = getMemberImagePath(reviewer.name);
            if (publicImagePath) {
              photo = publicImagePath;
              console.log(`✅ Matched image for "${reviewer.name}": ${publicImagePath}`);
            } else {
              photo = '/placeholder-member.png';
              console.log(`⚠️ No image match found for "${reviewer.name}" - trying fallback matching...`);
              // Try a more aggressive fallback - check if any part of the name matches
              const nameWords = reviewer.name.toLowerCase().split(/\s+/);
              for (const word of nameWords) {
                if (word.length > 2) { // Only check words longer than 2 characters
                  const memberImages = [
                    'Allan-Paulo-Blaquera.png', 'Angelo-Peralta.png', 'Everett-Laureta.png',
                    'Elizabeth-Iquin.png', 'Maria-Felina-Agbayani.png', 'Marjorie-Bambalan.png',
                    'Mark-Klimson-Luyun.png', 'Milrose-Tangonan.png', 'Nova-Domingo.png',
                    'Rita-Daliwag.jpg', 'Vercel-Baccay.png', 'Normie-Anne-Tuazon.png',
                    'Kristine-Joy-Cortes.png'
                  ];
                  for (const imgFile of memberImages) {
                    if (imgFile.toLowerCase().includes(word)) {
                      photo = `/members/${imgFile}`;
                      console.log(`✅ Fallback match: "${reviewer.name}" -> ${photo} (matched on "${word}")`);
                      break;
                    }
                  }
                  if (photo !== '/placeholder-member.png') break;
                }
              }
            }
          } else {
            console.log(`📸 Using database imageUrl for "${reviewer.name}": ${photo}`);
          }
          
          return {
          name: reviewer.name,
          role: getDisplayRole(reviewer.role),
          qualifications: '', // Can be added to Reviewer interface later if needed
            photo: photo
          };
        });

        // Sort by role priority
        const sortedMembers = sortMembersByRole(mappedMembers);
        setMembers(sortedMembers);
      } catch (error) {
        console.error('Error loading members:', error);
        // Fallback to empty array on error
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full px-4 py-2 sm:px-6 lg:px-8 flex-1">
        <div className="container mx-auto">
          {/* Back Button */}
          <div className="pt-4 pb-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/rec/proponent')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>

          {/* About Section */}
          <div className="flex gap-4 py-6 lg:py-10 flex-col items-start">
            <div className="flex gap-2 flex-col">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tighter lg:max-w-3xl font-regular">
                About SPUP Research Ethics Committee
              </h1>
              <p className="text-base sm:text-lg max-w-2xl lg:max-w-3xl leading-relaxed tracking-tight text-muted-foreground">
                Committed to upholding the highest standards of research ethics.
              </p>
            </div>
            
            <div className="flex gap-4 pt-4 flex-col w-full">
              <div className="prose prose-lg max-w-none">
                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                  Established in 2021, the St. Paul University Philippines Research
                  Ethics Committee (SPUP REC) is committed to upholding the highest
                  standards of research ethics. We ensure that all research involving
                  human participants conducted within our institution adheres to
                  international ethical principles and national guidelines.
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground mt-4">
                  Our committee operates under the fundamental ethical principles of
                  respect for persons, beneficence, and justice, ensuring that
                  research participants&apos; rights, safety, and well-being are always
                  protected. We provide comprehensive support to researchers, faculty,
                  and students, ensuring that all research proposals are reviewed and
                  approved in accordance with relevant ethical guidelines and
                  institutional policies.
                </p>
              </div>
            </div>

            {/* Members Section */}
            <div className="w-full pt-12">
              <div className="flex gap-2 flex-col mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tighter font-regular text-primary">
                  Meet Our Esteemed Members
                </h2>
                <p className="text-base sm:text-lg max-w-2xl leading-relaxed text-muted-foreground">
                  Our committee is composed of multi-disciplinary members who are
                  committed to upholding the highest standards of research ethics.
                </p>
              </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading members...</span>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No members available at this time.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {members.map((member) => (
                    <div
                      key={member.name}
                      className="group relative rounded-xl overflow-hidden bg-primary shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Image */}
                      <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                        {member.photo && member.photo !== '/placeholder-member.png' ? (
                          <Image
                            src={member.photo}
                            alt={member.name}
                            fill
                            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-muted-foreground text-xs">No Image</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/90 via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Member Info */}
                      <div className="p-4 bg-primary relative">
                        <div className="text-white space-y-1 transition-opacity duration-300 group-hover:opacity-0">
                          <h3 className="font-bold text-sm">{member.name}</h3>
                          <p className="text-secondary font-semibold text-xs">
                            {member.role}
                          </p>
                        </div>

                        {/* Hover Overlay with Full Info */}
                        <div className="absolute inset-0 bg-primary/70 flex flex-col justify-center items-center text-center px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <h3 className="font-bold text-sm text-white">
                            {member.name}
                          </h3>
                          <p className="text-secondary text-xs">{member.role}</p>
                          {member.qualifications && (
                            <p className="text-white text-xs mt-1">
                              {member.qualifications}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

