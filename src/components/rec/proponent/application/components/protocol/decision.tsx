import { CustomDecisionAlert } from "@/components/ui/custom/decission-alert";

// Uncomment the one you want to display!

// 1. APPROVED
const decision = {
  status: "Approved",
  type: "Full Board Review",
  date: "2025-07-03",
  comments: "Your protocol has been approved. Please submit your annual progress report, and notify REC of any amendments.",
  nextSteps: [
    "Submit progress report before the anniversary of approval.",
    "Submit final report within 8 weeks after study completion.",
    "Report any protocol amendments via the REC portal."
  ],
  documents: [
    {
      name: "Certificate of Approval",
      status: "Available",
      dueDate: "2025-07-03",
      url: "/downloads/certificate-of-approval.pdf"
    },
    {
      name: "Ethical Clearance Letter",
      status: "Available",
      dueDate: "2025-07-03",
      url: "/downloads/ethical-clearance-letter.pdf"
    }
  ]
};

// 2. MINOR MODIFICATION
// const decision = {
//   status: "Minor modification",
//   type: "Expedited Review",
//   date: "2025-07-03",
//   comments: "Please address the following: 1. Update the risk mitigation section. 2. Clarify the recruitment process. Submit your revised protocol within 2 weeks.",
//   nextSteps: [
//     "Revise protocol and consent forms as per comments.",
//     "Complete and upload the Resubmission Form.",
//     "Re-upload updated documents through the portal within the given deadline."
//   ],
//   documents: [
//     {
//       name: "Reviewer Comments",
//       status: "Available",
//       dueDate: "2025-07-10",
//       url: "/downloads/reviewer-comments.pdf"
//     },
//     {
//       name: "Resubmission Form",
//       status: "Available",
//       dueDate: "2025-07-10",
//       url: "/downloads/resubmission-form.pdf"
//     },
//     {
//       name: "Notification of REC Decision",
//       status: "Available",
//       dueDate: "2025-07-03",
//       url: "/downloads/rec-decision-letter.pdf"
//     }
//   ]
// };

// 3. MAJOR MODIFICATION
// const decision = {
//   status: "Major modification",
//   type: "Full Board Review",
//   date: "2025-07-03",
//   comments: "Major issues require attention: 1. Risk/benefit analysis is insufficient. 2. Consent form is missing required details. Please see the attached Reviewer Comments for the complete list. Submit revised protocol for full board review.",
//   nextSteps: [
//     "Revise your protocol to address all major concerns.",
//     "Update the consent form as detailed in the reviewer comments.",
//     "Upload all revised documents and complete the Resubmission Form."
//   ],
//   documents: [
//     {
//       name: "Reviewer Comments",
//       status: "Available",
//       dueDate: "2025-07-17",
//       url: "/downloads/major-reviewer-comments.pdf"
//     },
//     {
//       name: "Resubmission Form",
//       status: "Available",
//       dueDate: "2025-07-17",
//       url: "/downloads/resubmission-form.pdf"
//     },
//     {
//       name: "Notification of REC Decision",
//       status: "Available",
//       dueDate: "2025-07-03",
//       url: "/downloads/rec-decision-letter.pdf"
//     }
//   ]
// };

// 4. DISAPPROVED
// const decision = {
//   status: "Disapproved",
//   type: "Full Board Review",
//   date: "2025-07-03",
//   comments: "The protocol is disapproved for the following reasons: 1. Methodological flaws compromise participant safety. 2. The study design does not meet ethical standards.",
//   nextSteps: [
//     "Contact the REC Secretariat if you wish to seek clarification.",
//     "You may revise and submit a new protocol for consideration (if permitted)."
//   ],
//   documents: [
//     {
//       name: "Disapproval Letter",
//       status: "Available",
//       dueDate: "2025-07-03",
//       url: "/downloads/disapproval-letter.pdf"
//     },
//     {
//       name: "Reviewer Comments",
//       status: "Available",
//       dueDate: "2025-07-03",
//       url: "/downloads/disapproval-reviewer-comments.pdf"
//     }
//   ]
// };


export default function ProtocolDecision() {
  return <CustomDecisionAlert decision={decision} />;
}
