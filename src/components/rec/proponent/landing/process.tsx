"use client"

import { Download, FileText, CheckCircle2, Users, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const Process = () => {
  const steps = [
    {
      number: 1,
      title: "Online Submission of Protocol Package",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>Prepare and submit a <strong>complete protocol package</strong> through the <strong>SPUP REC online application system</strong>.</p>
          
          <div>
            <p className="font-semibold mb-2">Pre-Submission Documents:</p>
            <ul className="space-y-1.5 list-disc list-inside ml-4 text-sm">
              <li><Link href="/forms/pre-documents/Form%2007C%20Informed%20Consent%20Form.docx" className="text-primary hover:underline">Form 07C – Informed Consent Form</Link> - Download and complete this form</li>
              <li><Link href="/forms/pre-documents/Form%2007B%20Adviser_s%20Certification%20Form.docx" className="text-primary hover:underline">Form 07B – Adviser&apos;s Certification Form</Link> - Required for student researchers</li>
              <li>Full Study Protocol</li>
              <li>Abstract</li>
              <li>Data Gathering Tools (questionnaires, interview guides, surveys, etc.)</li>
              <li>Curriculum Vitae of all researchers</li>
              <li>Minutes of Proposal Defense</li>
              <li><strong>Official Receipt / Proof of Payment for Ethics Review</strong></li>
            </ul>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="font-semibold mb-3 text-primary">Payment Information</p>
            <p className="text-sm mb-3">For online payments, use the following bank accounts:</p>
            <div className="space-y-2 text-sm mb-3">
              <div className="p-2 bg-background rounded border">
                <p className="font-medium">LBP Account No. <strong>0121-3376-90</strong></p>
              </div>
              <div className="p-2 bg-background rounded border">
                <p className="font-medium">BDO Account No. <strong>00274-000435-0</strong></p>
                <p className="text-xs text-muted-foreground mt-1">For GCash transfer, use the BDO Bank only.</p>
              </div>
              <div className="p-2 bg-background rounded border">
                <p className="font-medium">BPI Account No. <strong>8693-0892-13</strong></p>
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded border-l-4 border-l-primary">
              <p className="text-sm font-semibold mb-2">Important Payment Instructions:</p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                <li>Indicate <strong>name of the student/student number, course and &quot;REC Payment&quot;</strong> as reference</li>
                <li>Send a copy of <strong>deposit slip (validated)</strong> and also <strong>transfer confirmation</strong> for online transfer to: <Link href="mailto:ggacias@spup.edu.ph" className="text-primary hover:underline font-semibold">ggacias@spup.edu.ph</Link> to get your Official Receipt</li>
                <li>Include the <strong>Official Receipt</strong> in the protocol package you will submit</li>
                <li><strong>We will no longer accept a deposit slip as a proof of payment</strong> of ethics review</li>
              </ul>
            </div>
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">📌 Note for College Students:</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">An SPUP REC Code will be provided in your Notice of Acceptance, which must be presented to the BAO.</p>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-2">Submission Process:</p>
            <ol className="space-y-1.5 list-decimal list-inside ml-4 text-sm">
              <li><strong>Protocol Information</strong>: Complete the online application form</li>
              <li><strong>Protocol Documents</strong>: Upload all necessary documents</li>
              <li><strong>Review & Confirm</strong>: Review all submitted information before final submission</li>
            </ol>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm font-semibold mb-2">Label and version your files properly:</p>
            <ul className="text-sm space-y-1 list-disc list-inside ml-4">
              <li>Protocol – <em>Version 1, Date</em></li>
              <li>ICF – <em>Version 1, Date</em></li>
              <li>Questionnaire – <em>Version 1, Date</em></li>
            </ul>
          </div>

          <p className="text-sm">After online submission, you will receive a <strong>temporary protocol code</strong> (format: PENDING-YYYYMMDD-XXXXXX) for tracking purposes.</p>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span><strong>Processing Time:</strong> 1–2 days (Initial screening by REC Chair)</span>
          </div>
        </div>
      ),
    },
    {
      number: 2,
      title: "Administrative Screening and SPUP Code Assignment",
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <p>The <strong>REC Chairperson</strong> reviews your submission through the online system:</p>
          <ul className="space-y-1.5 list-disc list-inside ml-4">
            <li>Checks completeness of your documents</li>
            <li>Verifies correct versioning, signatures, and attachments</li>
            <li>Ensures consistency of protocol and instruments</li>
            <li>May request missing or corrected documents through the system</li>
          </ul>
          
          <p>If complete, the REC Chair:</p>
          <ul className="space-y-1.5 list-disc list-inside ml-4">
            <li>Assigns a <strong>SPUP REC Protocol Code</strong> (format: SPUP_YYYY_00000_SR/EX_XX)</li>
            <li>Classifies the review type (SR/EX)</li>
            <li>Records the submission in the electronic database</li>
            <li>Changes protocol status from &quot;pending&quot; to &quot;accepted&quot;</li>
          </ul>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span><strong>Processing Time:</strong> 1 day</span>
          </div>
        </div>
      ),
    },
    {
      number: 3,
      title: "Determination of Type of Ethics Review",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>The REC Chair conducts a preliminary assessment and assigns one of five review types:</p>
          
          <div className="space-y-3">
            <div className="p-4 border-l-4 border-l-primary bg-muted/30 rounded-r-lg">
              <p className="font-semibold">SR - Social/Behavioral Research</p>
              <p className="text-sm text-muted-foreground">Requires 3 reviewers (2x Protocol Review Assessment + 1x Informed Consent Assessment)</p>
            </div>
            <div className="p-4 border-l-4 border-l-primary bg-muted/30 rounded-r-lg">
              <p className="font-semibold">EX - Exempted from Review</p>
              <p className="text-sm text-muted-foreground mb-2">Requires 2 reviewers with exemption assessment. For minimal-risk studies using publicly available, de-identified data.</p>
              <p className="text-sm font-medium">Includes subtypes:</p>
              <ul className="text-sm text-muted-foreground ml-4 mt-1 space-y-1">
                <li>• <strong>Experimental Research</strong>: 2x IACUC Protocol Review Assessment</li>
                <li>• <strong>Documentary/Textual Analysis</strong>: 2x Checklist for Exemption Form Review</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span><strong>Processing Time:</strong> 1 day</span>
          </div>
        </div>
      ),
    },
    {
      number: 4,
      title: "Reviewer Assignment and Ethics Review",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>After a protocol is accepted and assigned a SPUP code, the <strong>REC Chair</strong> assigns reviewers based on the review type:</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-semibold mb-2">SR protocols:</p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                <li>3 reviewers assigned</li>
                <li>2 reviewers complete Protocol Review Assessment</li>
                <li>1 reviewer completes Informed Consent Assessment</li>
              </ul>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-semibold mb-2">EX (Exempted) protocols:</p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                <li>2 reviewers assigned</li>
                <li>For Experimental Research: IACUC Protocol Review Assessment</li>
                <li>For Documentary: Checklist for Exemption Form Review</li>
              </ul>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-2">Review Process:</p>
            <ol className="space-y-1.5 list-decimal list-inside ml-4 text-sm">
              <li><strong>Reviewer Assessment</strong> – Reviewers access the protocol through the online system and complete their assigned assessment forms</li>
              <li><strong>Review Period</strong> – Up to 3 weeks for expedited review, 6 weeks for full board review</li>
              <li><strong>Review Consolidation</strong> – REC Chair reviews all completed assessments</li>
              <li><strong>Decision Making</strong> – REC Chair makes decision based on reviewer recommendations</li>
            </ol>
          </div>

          <div>
            <p className="font-semibold mb-3">Possible Outcomes:</p>
            <div className="grid gap-3">
              <div className="p-3 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20 rounded-r">
                <p className="font-semibold text-green-700 dark:text-green-400">✅ Approved</p>
                <p className="text-sm text-muted-foreground">The research may proceed as submitted. Protocol status changes to &quot;approved&quot;. Certificate of Approval is generated.</p>
              </div>
              <div className="p-3 border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-r">
                <p className="font-semibold text-blue-700 dark:text-blue-400">🔄 Approved with Minor Revisions</p>
                <p className="text-sm text-muted-foreground">Approval granted with minor revisions required. Timeline for compliance is specified.</p>
              </div>
              <div className="p-3 border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 rounded-r">
                <p className="font-semibold text-yellow-700 dark:text-yellow-400">⚠️ Major Revisions / Deferred</p>
                <p className="text-sm text-muted-foreground">Significant ethical issues require major revision. Timeline for resubmission is specified.</p>
              </div>
              <div className="p-3 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20 rounded-r">
                <p className="font-semibold text-red-700 dark:text-red-400">❌ Disapproved</p>
                <p className="text-sm text-muted-foreground">Unresolvable ethical concerns or high risk identified. Detailed reason provided.</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span><strong>Total Expected Time:</strong> Approximately 3–6 weeks depending on review type and complexity</span>
          </div>
        </div>
      ),
    },
    {
      number: 5,
      title: "Resubmission (If Modifications Are Required)",
      icon: MessageSquare,
      content: (
        <div className="space-y-4">
          <p>If the REC requests revisions:</p>
          <ul className="space-y-1.5 list-disc list-inside ml-4">
            <li>Use <Link href="/forms/Form%2008A%20Protocol%20Resubmission%20Form.docx" className="text-primary hover:underline font-semibold">Form 08A – Protocol Resubmission Form</Link> - Download and complete this form</li>
            <li><strong>Bold + underline all changes</strong> in your revised documents</li>
            <li>Indicate page and line numbers where changes were made</li>
            <li>Use updated <strong>version number & date</strong></li>
            <li>Submit revised documents through the <strong>online system</strong> within the specified timeline</li>
          </ul>
          
          <p className="text-sm">Revisions are re-evaluated through:</p>
          <ul className="text-sm space-y-1 list-disc list-inside ml-4">
            <li><strong>Expedited review</strong> (minor/moderate changes)</li>
            <li><strong>Full Board</strong> (major changes)</li>
          </ul>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span><strong>Processing Time:</strong> 15 days (plus another 15 days grace period if needed)</span>
          </div>
        </div>
      ),
    },
    {
      number: 6,
      title: "Ethics Approval Release",
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <p>If approved, you will receive through the online system:</p>
          <ul className="space-y-1.5 list-disc list-inside ml-4">
            <li>Official <strong>SPUP REC Approval Letter</strong> (downloadable)</li>
            <li>Protocol & ICF version numbers</li>
            <li>Duration of approval</li>
            <li>Required frequency of progress reports</li>
            <li>Responsibilities after approval</li>
            <li><strong>Certificate of Approval</strong> (generated automatically)</li>
          </ul>
        </div>
      ),
    },
    {
      number: 7,
      title: "Post-Approval Requirements",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>Depending on the stage of your study, you must submit the following forms through the online system:</p>
          
          <div>
            <p className="font-semibold mb-3">Post-Approval Forms:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Form 09B – Progress Report Application Form</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/forms/post-documents/Form%2009B%20Progress%20Report%20Application%20Form.docx" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Form 10 – Protocol Amendment Application Form</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/forms/post-documents/Form%2010%20Protocol%20Ammendment%20Application%20Form.docx" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Form 11 – Study Protocol Deviation-Violation Report Form</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/forms/post-documents/Form%2011%20Study%20Protocol%20Deviation-Violation%20Report%20Form%20.docx" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Form 12 – Reportable Negative Event Report Form</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/forms/post-documents/Form%2012%20Reportable%20Negative%20Event%20Report%20Form%20.docx" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Form 13 – Continuing Review Application Form</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/forms/post-documents/Form%2013%20Continuing%20Review%20Application%20Form.docx" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Form 14A – Final Report Form</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/forms/post-documents/Form%2014A%20Final%20Report%20Form%20.docx" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-semibold text-primary mb-1">📌 Final Report Submission:</p>
            <p className="text-sm text-muted-foreground">Required <strong>within 8 weeks</strong> after the study ends</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full px-4 py-2 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="py-4 lg:py-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tighter font-regular mb-3">
            Research Ethics Review Process
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A step-by-step guide to submitting and reviewing research protocols through the SPUP REC online system.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 pb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            // Define section IDs for anchor links
            const sectionIds: Record<number, string> = {
              1: 'forms', // Step 1 uses 'forms' for forms link, also serves as submission section
              3: 'review-types',
              5: 'resubmissions',
              6: 'after-approval',
            };
            const sectionId = sectionIds[step.number];
            return (
              <div key={index} id={sectionId} className="relative scroll-mt-20">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="outline" className="text-sm font-semibold">
                        STEP {step.number}
                      </Badge>
                      <h2 className="text-xl sm:text-2xl font-semibold">{step.title}</h2>
                    </div>
                    <div className="text-muted-foreground space-y-2">
                      {step.content}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-border -z-10" />
                )}
              </div>
            );
          })}
        </div>

        {/* Important Notes */}
        <div className="py-4 border-t">
          <h3 className="text-xl font-semibold mb-3">Important Notes</h3>
          <ul className="space-y-2 text-muted-foreground list-disc list-inside ml-4">
            <li>All submissions must be made through the <strong className="text-foreground">online application system</strong> at the SPUP REC website</li>
            <li>Track your protocol status in real-time through your dashboard</li>
            <li>All forms are available for download from the forms section</li>
            <li>Ensure all documents are properly versioned and dated before submission</li>
            <li>Contact the REC at <strong className="text-foreground">rec@spup.edu.ph</strong> (CPRINT Office, Local 211) for any questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
