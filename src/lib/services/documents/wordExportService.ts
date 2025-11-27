export async function buildReviewerSummaryDocx(data: {
  title: string;
  spupCode?: string;
  reviewers: Array<{ reviewer: string; formType: string; status: string; answers: Array<{ key: string; value: string }> }>
}): Promise<Blob> {
  // Dynamically import docx to avoid type resolution issues at build/lint time
  const docx: any = await import('docx');
  const { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, TextRun } = docx;
  const sections: any[] = [];

  sections.push({
    properties: {},
    children: [
      new Paragraph({ text: 'Consolidated Reviewer Assessments', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: data.title, heading: HeadingLevel.HEADING_1 }),
      data.spupCode ? new Paragraph({ text: `SPUP REC Code: ${data.spupCode}` }) : new Paragraph(''),
      new Paragraph(''),
    ],
  });

  data.reviewers.forEach((r, idx) => {
    sections[0].children.push(new Paragraph({ text: `${idx + 1}. ${r.reviewer} — ${r.formType} (${r.status})`, heading: HeadingLevel.HEADING_2 }));

    // Build a simple two-column table of answers
    const rows: any[] = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Field', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Response', bold: true })] })] }),
        ],
      }),
    ];

    r.answers.slice(0, 50).forEach((a) => {
      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(a.key)] }),
            new TableCell({ children: [new Paragraph(a.value)] }),
          ],
        })
      );
    });

    sections[0].children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      })
    );
    sections[0].children.push(new Paragraph(''));
  });

  const doc = new Document({ sections });
  const blob = await Packer.toBlob(doc);
  return blob;
}


