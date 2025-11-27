import { DocumentsType } from "./documents.types";
import { InformationType } from "./information.types";
import { MessagesType } from "./message.types";
import { SubmissionsType } from "./submissions.types";

export interface SubmissionBundle {
    submission: SubmissionsType;
    information: InformationType | null;
    documents: DocumentsType[];
    messages: MessagesType[];
}
