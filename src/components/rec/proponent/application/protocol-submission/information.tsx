"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  X,
  User,
  MapPin,
  GraduationCap,
  FileText,
  Users,
  BookOpen,
  PhilippinePeso,
  CalendarDays,
} from "lucide-react";
import type { InformationType } from "@/types/information.types";
import { ValidationRule } from "@/types/validation.types";
import { informationFormValidation } from "@/lib/validation/form-validation";
import { useSubmissionContext } from "@/contexts/SubmissionContext";
import { ValidatedInput } from "@/components/ui/custom/validated-input";
import { ValidatedTextarea } from "@/components/ui/custom/validated-textarea";
import { ValidatedSelect } from "@/components/ui/custom/validated-select";
import { ValidatedRadioGroup } from "@/components/ui/custom/validated-radio-group";
import { ValidatedDateInput } from "@/components/ui/custom/validated-date-input";

const STUDY_LEVELS = [
  { value: "Undergraduate Thesis", label: "Undergraduate Thesis" },
  { value: "Master's Thesis", label: "Master's Thesis" },
  { value: "Doctoral Dissertation", label: "Doctoral Dissertation" },
  { value: "Faculty/Staff", label: "Faculty/Staff" },
  { value: "Funded Research", label: "Funded Research" },
  { value: "Others", label: "Others" },
];

const STUDY_TYPES = [
  { value: "Social/Behavioral", label: "Social/Behavioral" },
  { value: "Public Health Research", label: "Public Health Research" },
  { value: "Health Operations", label: "Health Operations" },
  { value: "Biomedical Studies", label: "Biomedical Studies" },
  { value: "Clinical Trials", label: "Clinical Trials" },
  { value: "Others", label: "Others" },
];

const STUDY_SITE_OPTIONS = [
  { value: "within", label: "Research within the University" },
  { value: "outside", label: "Research outside the University" },
];

const FUNDING_SOURCE_OPTIONS = [
  { value: "self_funded", label: "Self-funded" },
  { value: "institution_funded", label: "Institution-funded" },
  { value: "government_funded", label: "Government-funded" },
  { value: "scholarship", label: "Scholarship" },
  { value: "research_grant", label: "Research Grant" },
  { value: "pharmaceutical_company", label: "Pharmaceutical Company" },
  { value: "others", label: "Others" },
];

export const SubmissionInformation = () => {
  const {
    formData,
    updateField,
    getFieldValue,
    addCoResearcher,
    removeCoResearcher,
    updateCoResearcher,
    isFormValid,
    validateAllFields,
    registerFieldValidation,
    unregisterFieldValidation,
    handleFieldValidation,
  } = useSubmissionContext();

  // Conditional field checks
  const pharmaSelected =
    getFieldValue("source_of_funding.selected") === "pharmaceutical_company";
  const outsideSelected = getFieldValue("study_site.location") === "outside";
  const othersSelected =
    getFieldValue("source_of_funding.selected") === "others";

  return (
    <>
      <form className="space-y-8 mt-5">
        {/* --- GENERAL INFORMATION CARD --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              General Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Protocol Title */}
            <ValidatedInput
              label="Protocol Title"
              value={getFieldValue("general_information.protocol_title") || ""}
              onChange={(value) =>
                updateField("general_information.protocol_title", value)
              }
              validationRules={
                informationFormValidation["general_information.protocol_title"]
                  ?.rules
              }
              placeholder="Enter the complete title of your research protocol"
              format="title-case"
              required
              fieldPath="general_information.protocol_title"
              registerValidation={registerFieldValidation}
              unregisterValidation={unregisterFieldValidation}
              onValidationChange={(isValid, errors) =>
                handleFieldValidation("general_information.protocol_title", isValid, errors)
              }
            />

            {/* Principal Investigator & Co-Researchers */}
            <div className="flex gap-2 items-start w-full">
              <div className="flex-grow">
                <ValidatedInput
                  label="Principal Investigator"
                  value={
                    getFieldValue(
                      "general_information.principal_investigator.name"
                    ) || ""
                  }
                  onChange={(value) =>
                    updateField(
                      "general_information.principal_investigator.name",
                      value
                    )
                  }
                  validationRules={
                    informationFormValidation[
                      "general_information.principal_investigator.name"
                    ]?.rules
                  }
                  placeholder="Full name"
                  format="proper-case"
                  required
                  fieldPath="general_information.principal_investigator.name"
                  registerValidation={registerFieldValidation}
                  unregisterValidation={unregisterFieldValidation}
                  onValidationChange={(isValid, errors) =>
                    handleFieldValidation("general_information.principal_investigator.name", isValid, errors)
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCoResearcher}
                className="whitespace-nowrap mt-[30px]" // adjust this to align properly with input
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Add Co-Researcher</span>
              </Button>
            </div>

            {/* Co-Researchers */}
            {getFieldValue("general_information.co_researchers")?.length >
              0 && (
              <div className="flex flex-col gap-2 border-l border-gray-200 pl-3 ml-3">
                {getFieldValue("general_information.co_researchers").map(
                  (researcher: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <ValidatedInput
                        label={`Co-Researcher ${index + 1}`}
                        value={researcher.name || ""}
                        onChange={(value) => updateCoResearcher(index, value)}
                        placeholder="Co-Researcher name"
                        format="proper-case"
                        required
                        className="flex-grow items-center"
                        fieldPath={`general_information.co_researchers.${index}.name`}
                        registerValidation={registerFieldValidation}
                        unregisterValidation={unregisterFieldValidation}
                        onValidationChange={(isValid, errors) =>
                          handleFieldValidation(`general_information.co_researchers.${index}.name`, isValid, errors)
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCoResearcher(index)}
                        className="whitespace-nowrap mt-[24px]"
                      >
                        <X className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Address & Contact - side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                label="Address"
                value={
                  getFieldValue(
                    "general_information.principal_investigator.address"
                  ) || ""
                }
                onChange={(value) =>
                  updateField(
                    "general_information.principal_investigator.address",
                    value
                  )
                }
                validationRules={
                  informationFormValidation[
                    "general_information.principal_investigator.address"
                  ]?.rules
                }
                placeholder="Complete address"
                format="proper-case"
                required
                fieldPath="general_information.principal_investigator.address"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("general_information.principal_investigator.address", isValid, errors)
                }
              />
              <ValidatedInput
                label="Contact Number"
                value={
                  getFieldValue(
                    "general_information.principal_investigator.contact_number"
                  ) || ""
                }
                onChange={(value) =>
                  updateField(
                    "general_information.principal_investigator.contact_number",
                    value
                  )
                }
                validationRules={
                  informationFormValidation[
                    "general_information.principal_investigator.contact_number"
                  ]?.rules
                }
                placeholder="Phone/mobile number"
                format="phone"
                required
                fieldPath="general_information.principal_investigator.contact_number"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("general_information.principal_investigator.contact_number", isValid, errors)
                }
              />
            </div>

            {/* Position, Email, Adviser */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ValidatedInput
                label="Position/Institution"
                value={
                  getFieldValue(
                    "general_information.principal_investigator.position_institution"
                  ) || ""
                }
                onChange={(value) =>
                  updateField(
                    "general_information.principal_investigator.position_institution",
                    value
                  )
                }
                validationRules={
                  informationFormValidation[
                    "general_information.principal_investigator.position_institution"
                  ]?.rules
                }
                placeholder="Position and institution"
                format="proper-case"
                required
                fieldPath="general_information.principal_investigator.position_institution"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("general_information.principal_investigator.position_institution", isValid, errors)
                }
              />
              <ValidatedInput
                label="Email"
                type="email"
                value={
                  getFieldValue(
                    "general_information.principal_investigator.email"
                  ) || ""
                }
                onChange={(value) =>
                  updateField(
                    "general_information.principal_investigator.email",
                    value
                  )
                }
                validationRules={
                  informationFormValidation[
                    "general_information.principal_investigator.email"
                  ]?.rules
                }
                placeholder="Email address"
                required
                fieldPath="general_information.principal_investigator.email"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("general_information.principal_investigator.email", isValid, errors)
                }
              />
              <ValidatedInput
                label="Adviser"
                value={getFieldValue("general_information.adviser.name") || ""}
                onChange={(value) =>
                  updateField("general_information.adviser.name", value)
                }
                validationRules={
                  informationFormValidation["general_information.adviser.name"]
                    ?.rules
                }
                placeholder="Adviser name"
                format="proper-case"
                required
                fieldPath="general_information.adviser.name"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("general_information.adviser.name", isValid, errors)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* --- STUDY DETAILS CARD --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Study Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Study Level, Study Type, Study Site */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Study Level */}
              <ValidatedSelect
                label="Nature of Study"
                value={getFieldValue("nature_and_type_of_study.level") || ""}
                onChange={(value) =>
                  updateField("nature_and_type_of_study.level", value)
                }
                validationRules={
                  informationFormValidation["nature_and_type_of_study.level"]
                    ?.rules
                }
                options={STUDY_LEVELS}
                placeholder="Select study level"
                required
                fieldPath="nature_and_type_of_study.level"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("nature_and_type_of_study.level", isValid, errors)
                }
              />

              {/* Study Type */}
              <ValidatedSelect
                label="Type of Study"
                value={getFieldValue("nature_and_type_of_study.type") || ""}
                onChange={(value) =>
                  updateField("nature_and_type_of_study.type", value)
                }
                validationRules={
                  informationFormValidation["nature_and_type_of_study.type"]
                    ?.rules
                }
                options={STUDY_TYPES}
                placeholder="Select study type"
                required
                fieldPath="nature_and_type_of_study.type"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("nature_and_type_of_study.type", isValid, errors)
                }
              />

              {/* Study Site */}
              <div className="space-y-3">
                <ValidatedRadioGroup
                  label="Study Site"
                  value={getFieldValue("study_site.location") || "within"}
                  onChange={(value) =>
                    updateField("study_site.location", value)
                  }
                  validationRules={
                    informationFormValidation["study_site.location"]?.rules
                  }
                  options={STUDY_SITE_OPTIONS}
                  required
                  fieldPath="study_site.location"
                  registerValidation={registerFieldValidation}
                  unregisterValidation={unregisterFieldValidation}
                  onValidationChange={(isValid, errors) =>
                    handleFieldValidation("study_site.location", isValid, errors)
                  }
                />
                {outsideSelected && (
                  <ValidatedInput
                    label="Outside Location"
                    value={getFieldValue("study_site.outside_specify") || ""}
                    onChange={(value) =>
                      updateField("study_site.outside_specify", value)
                    }
                    placeholder="Specify location outside university"
                    required
                    fieldPath="study_site.outside_specify"
                    registerValidation={registerFieldValidation}
                    unregisterValidation={unregisterFieldValidation}
                    onValidationChange={(isValid, errors) =>
                      handleFieldValidation("study_site.outside_specify", isValid, errors)
                    }
                  />
                )}
              </div>
            </div>

            {/* Source of Funding */}
            <div className="space-y-4">
              <ValidatedRadioGroup
                label="Source of Funding"
                value={
                  getFieldValue("source_of_funding.selected") || "self_funded"
                }
                onChange={(value) =>
                  updateField("source_of_funding.selected", value)
                }
                validationRules={
                  informationFormValidation["source_of_funding.selected"]?.rules
                }
                options={FUNDING_SOURCE_OPTIONS}
                orientation="horizontal"
                required
                fieldPath="source_of_funding.selected"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("source_of_funding.selected", isValid, errors)
                }
              />

              {/* Conditional inputs */}
              {pharmaSelected && (
                <ValidatedInput
                  label="Pharmaceutical Company"
                  value={
                    getFieldValue(
                      "source_of_funding.pharmaceutical_company_specify"
                    ) || ""
                  }
                  onChange={(value) =>
                    updateField(
                      "source_of_funding.pharmaceutical_company_specify",
                      value
                    )
                  }
                  placeholder="Specify pharmaceutical company"
                  required
                  fieldPath="source_of_funding.pharmaceutical_company_specify"
                  registerValidation={registerFieldValidation}
                  unregisterValidation={unregisterFieldValidation}
                  onValidationChange={(isValid, errors) =>
                    handleFieldValidation("source_of_funding.pharmaceutical_company_specify", isValid, errors)
                  }
                />
              )}
              {othersSelected && (
                <ValidatedInput
                  label="Other Funding Source"
                  value={
                    getFieldValue("source_of_funding.others_specify") || ""
                  }
                  onChange={(value) =>
                    updateField("source_of_funding.others_specify", value)
                  }
                  placeholder="Specify other funding sources"
                  required
                  fieldPath="source_of_funding.others_specify"
                  registerValidation={registerFieldValidation}
                  unregisterValidation={unregisterFieldValidation}
                  onValidationChange={(isValid, errors) =>
                    handleFieldValidation("source_of_funding.others_specify", isValid, errors)
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* --- DURATION & PARTICIPANTS CARD --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Duration & Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Start & End Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedDateInput
                label="Start Date"
                value={getFieldValue("duration_of_study.start_date") || ""}
                onChange={(value) =>
                  updateField("duration_of_study.start_date", value)
                }
                validationRules={
                  informationFormValidation["duration_of_study.start_date"]
                    ?.rules
                }
                required
                fieldPath="duration_of_study.start_date"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("duration_of_study.start_date", isValid, errors)
                }
              />
              <ValidatedDateInput
                label="End Date"
                value={getFieldValue("duration_of_study.end_date") || ""}
                onChange={(value) =>
                  updateField("duration_of_study.end_date", value)
                }
                validationRules={
                  informationFormValidation["duration_of_study.end_date"]?.rules
                }
                minDate={
                  getFieldValue("duration_of_study.start_date") || undefined
                }
                required
                fieldPath="duration_of_study.end_date"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("duration_of_study.end_date", isValid, errors)
                }
              />
            </div>

            {/* Participants */}
            <div className="flex flex-col gap-6">
              <ValidatedInput
                label="Number of Participants"
                type="number"
                value={
                  getFieldValue("participants.number_of_participants") !== null
                    ? getFieldValue("participants.number_of_participants")?.toString() || ""
                    : ""
                }
                onChange={(value) => {
                  const numValue = value.trim() === "" ? null : parseInt(value, 10);
                  updateField("participants.number_of_participants", numValue);
                }}
                validationRules={
                  informationFormValidation[
                    "participants.number_of_participants"
                  ]?.rules
                }
                placeholder="Enter number of participants"
                required
                fieldPath="participants.number_of_participants"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("participants.number_of_participants", isValid, errors)
                }
              />
              <ValidatedTextarea
                label="Type and Description"
                value={getFieldValue("participants.type_and_description") || ""}
                onChange={(value) =>
                  updateField("participants.type_and_description", value)
                }
                validationRules={
                  informationFormValidation["participants.type_and_description"]
                    ?.rules
                }
                placeholder="Describe the type and characteristics of participants"
                rows={3}
                required
                fieldPath="participants.type_and_description"
                registerValidation={registerFieldValidation}
                unregisterValidation={unregisterFieldValidation}
                onValidationChange={(isValid, errors) =>
                  handleFieldValidation("participants.type_and_description", isValid, errors)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* --- PRE-SUBMISSION STATUS CARD --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Pre-submission Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-row justify-center gap-20">
            {/* Technical Review Question */}
            <ValidatedRadioGroup
              label="Has the research undergone technical review/proposal defense?"
              value={
                getFieldValue("technical_review_completed") == null
                  ? ""
                  : String(getFieldValue("technical_review_completed"))
              }
              onChange={(value) =>
                updateField("technical_review_completed", value === "true")
              }
              validationRules={
                informationFormValidation["technical_review_completed"]?.rules
              }
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" }
              ]}
              orientation="horizontal"
              required
              fieldPath="technical_review_completed"
              registerValidation={registerFieldValidation}
              unregisterValidation={unregisterFieldValidation}
              onValidationChange={(isValid, errors) =>
                handleFieldValidation("technical_review_completed", isValid, errors)
              }
            />

            {/* Other Committee Question */}
            <ValidatedRadioGroup
              label="Has the research been submitted to another research ethics committee?"
              value={
                getFieldValue("submitted_to_other_committee") == null
                  ? ""
                  : String(getFieldValue("submitted_to_other_committee"))
              }
              onChange={(value) =>
                updateField("submitted_to_other_committee", value === "true")
              }
              validationRules={
                informationFormValidation["submitted_to_other_committee"]?.rules
              }
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" }
              ]}
              orientation="horizontal"
              required
              fieldPath="submitted_to_other_committee"
              registerValidation={registerFieldValidation}
              unregisterValidation={unregisterFieldValidation}
              onValidationChange={(isValid, errors) =>
                handleFieldValidation("submitted_to_other_committee", isValid, errors)
              }
            />
          </CardContent>
        </Card>

        {/* --- BRIEF DESCRIPTION CARD --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Brief Description of Study
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ValidatedTextarea
              label="Study Description"
              value={getFieldValue("brief_description_of_study") || ""}
              onChange={(value) =>
                updateField("brief_description_of_study", value)
              }
              validationRules={
                informationFormValidation["brief_description_of_study"]?.rules
              }
              placeholder="Provide a brief but comprehensive description of your study"
              rows={5}
              maxLength={1000}
              showCharCount
              required
              fieldPath="brief_description_of_study"
              registerValidation={registerFieldValidation}
              unregisterValidation={unregisterFieldValidation}
              onValidationChange={(isValid, errors) =>
                handleFieldValidation("brief_description_of_study", isValid, errors)
              }
            />
          </CardContent>
        </Card>
      </form>
    </>
  );
};
