export const PROTOCOLS = {
    "submissions": {
      "SUBM-001": {
        "submission": {
          "id": "SUBM-001",
          "title": "Assessment of Liver Profile Among SPUP Non-Teaching Employees",
          "dateSubmitted": "2025-07-02T09:30:00Z",
          "status": "Under Review",
          "proponentId": "PRO-001",
          "protocolCode": "SPUP-REC-2025-001",
          "type": "Initial Review"
        },
        "information": {
          "id": "INFO-001",
          "researchDesign": "Descriptive Cross-sectional Study",
          "targetPopulation": "Non-teaching employees of SPUP",
          "objectives": [
            "Assess liver health profile",
            "Identify risk factors associated with abnormal liver profile"
          ],
          "keywords": ["Liver", "SPUP", "Non-teaching", "Health"]
        },
        "documents": [
          {
            "id": "DOC-001",
            "name": "Research Protocol.pdf",
            "type": "Protocol",
            "url": "https://storage.googleapis.com/bucket/DOC-001.pdf",
            "uploadedAt": "2025-07-02T09:35:00Z"
          },
          {
            "id": "DOC-002",
            "name": "Informed Consent.pdf",
            "type": "Consent Form",
            "url": "https://storage.googleapis.com/bucket/DOC-002.pdf",
            "uploadedAt": "2025-07-02T09:36:00Z"
          }
        ],
        "messages": [
          {
            "id": "MSG-001",
            "senderId": "PRO-001",
            "content": "Submitted initial documents for review.",
            "sentAt": "2025-07-02T09:37:00Z"
          },
          {
            "id": "MSG-002",
            "senderId": "ADMIN-001",
            "content": "Received. Will assign to reviewers soon.",
            "sentAt": "2025-07-02T10:00:00Z"
          }
        ],
        "reviews": {
          "REV-001": {
            "id": "REV-001",
            "reviewerId": "REVWR-123",
            "formType": "Initial Review",
            "dateReviewed": "2025-07-03T10:15:00Z",
            "ratings": {
              "scientificValidity": 4,
              "ethicalConsideration": 5,
              "completeness": 4
            },
            "comments": "Protocol is generally complete. Minor revisions suggested in the methodology section.",
            "filledForm": {
              "question1": "Yes",
              "question2": "No",
              "question3": "Minor Revision Needed"
            },
            "status": "Completed"
          }
        }
      }
    },
    "proponents": {
      "PRO-001": {
        "id": "PRO-001",
        "name": "Maria Santos",
        "email": "maria.santos@spup.edu.ph",
        "department": "Health Sciences"
      }
    }
  };
