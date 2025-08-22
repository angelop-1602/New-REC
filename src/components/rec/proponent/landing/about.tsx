import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const members = [
  {
    name: "Dr. Elizabeth Iquin",
    role: "REC Chairperson",
    qualifications: "MD, MPH",
    photo: "/Image of Members/elizabeth iquin.png",
  },
  {
    name: "Dr. Angelo P. Peralta",
    role: "REC Vice-Chairperson",
    qualifications: "PhD in Educational Management",
    photo: "/Image of Members/Peralta, Angelo P.png",
  },
  {
    name: "Dr. Nova R. Domingo",
    role: "REC Secretary",
    qualifications: "PhD in Nursing",
    photo: "/Image of Members/Domingo, Nova R.png",
  },
  {
    name: "Dr. Everett T. Laureta",
    role: "REC Member",
    qualifications: "PhD in Psychology",
    photo: "/Image of Members/Laureta, Everett T.png",
  },
  {
    name: "Dr. Sergio G. Imperio",
    role: "REC Member",
    qualifications: "MD, Specialist in Internal Medicine",
    photo: "/Image of Members/Imperio, Sergio G.png",
  },
  {
    name: "Dr. Maria Felina B. Agbayani",
    role: "REC Member",
    qualifications: "PhD in Education",
    photo: "/Image of Members/Agbayani, Maria Felina B.png",
  },
  {
    name: "Dr. Claudeth U. Gamiao",
    role: "REC Member",
    qualifications: "PhD in Education",
    photo: "/Image of Members/Gamiao, Claudeth U.png",
  },
  {
    name: "Dr. Allan Paulo L. Blaquera",
    role: "REC Member",
    qualifications: "PhD in Business Administration",
    photo: "/Image of Members/Blaquera, Allan Paulo L.png",
  },
  {
    name: "Dr. Marjorie L. Bambalan",
    role: "REC Member",
    qualifications: "PhD in Education",
    photo: "/Image of Members/Bambalan, Marjorie L.png",
  },
  {
    name: "Dr. Marjorie L. Bambalan4",
    role: "REC Member",
    qualifications: "PhD in Education",
    photo: "/Image of Members/Bambalan, Marjorie L.png",
  },
  {
    name: "Dr. Marjorie L. Bambalan1",
    role: "REC Member",
    qualifications: "PhD in Education",
    photo: "/Image of Members/Bambalan, Marjorie L.png",
  },
  {
    name: "Dr. Marjorie L. Bambalan3",
    role: "REC Member",
    qualifications: "PhD in Education",
    photo: "/Image of Members/Bambalan, Marjorie L.png",
  },
  {
    name: "Dr. Marjorie L. Bambalan2",
    role: "REC Member",
    qualifications: "PhD in Education",
    photo: "/Image of Members/Bambalan, Marjorie L.png",
  },
];

export const About = () => (
  <div className="w-full px-4 py-2 sm:px-6 lg:px-8">
    <div className="container mx-auto">
      <div className="flex gap-4 py-20 lg:py-40 flex-col items-start">
        <div className="flex gap-2 flex-col">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tighter lg:max-w-xl font-regular">
            About SPUP Research Ethics Committee
          </h2>
          <p className="text-base sm:text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-muted-foreground">
            Managing a small business today is already tough.
          </p>
        </div>
        <div className="flex gap-10 pt-2 flex-col w-full">
          <p>
            Established in 2021, the St. Paul University Philippines Research
            Ethics Committee (SPUP REC) is committed to upholding the highest
            standards of research ethics. We ensure that all research involving
            human participants conducted within our institution adheres to
            international ethical principles and national guidelines. Our
            committee operates under the fundamental ethical principles of
            respect for persons, beneficence, and justice, ensuring that
            research participants' rights, safety, and well-being are always
            protected. We provide comprehensive support to researchers, faculty,
            and students, ensuring that all research proposals are reviewed and
            approved in accordance with relevant ethical guidelines and
            institutional policies. Our committee operates under the fundamental
            ethical principles of respect for persons, beneficence, and justice,
            ensuring that research participants' rights, safety, and well-being
            are always protected.
          </p>
        </div>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <Badge
                variant="outline"
                className="gap-2 px-4 py-2 flex items-center"
              >
                Want to know more about the SPUP REC?
                <MoveRight className="w-4 h-4 ml-2" />
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="text-base sm:text-lg  leading-relaxed tracking-tight text-muted-foreground w-full pt-6">
                <h1 className="text-primary sm:text-3xl md:text-4xl lg:text-4xl tracking-tighter lg:max-w-xl font-regular mb-2">
                    Meet Our Steamed Members
              </h1>
              <p className="text-base mb-10 sm:text-lg max-w-xl lg:max-w-xl leading-relaxed text-muted-foreground">
                Our committee is composed of multi-disciplinary members who are
                committed to upholding the highest standards of research ethics.
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {members.map((member) => (
                  <div
                    key={member.name}
                    className="group relative rounded-xl overflow-hidden bg-primary shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
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
                        <p className="text-white text-xs mt-1">
                          {member.qualifications}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  </div>
);
