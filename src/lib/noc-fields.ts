// Shared NOC/NTBO field-building logic for the live two-panel preview in permit
// intake. Kept separate from noc-auto.ts / ntbo-auto.ts (which build the same
// forms from the persisted PermitRow after submission) so the intake wizard can
// preview the exact document that generation will produce from the same
// in-progress form state, without waiting for a permit row to exist.

import { FLORIDIAN_FIRM } from "@/lib/floridian-firm";
import type { NOCFields, NTBOFields } from "@/lib/private-provider-forms";

export type NOCFilerType = "gc" | "owner_builder";

export type NOCFieldsInput = {
  propertyAddress: string;
  parcelTaxId: string;
  legalDescription: string;
  filerType: NOCFilerType;
  ownerName: string;
  ownerAddress: string;
  contractorName: string;
  contractorAddress: string;
  contractorLicense: string;
  contractorPhone: string;
  lenderName: string;
  lenderAddress: string;
  suretyBondAmount: string;
  designeeName: string;
  designeeAddress: string;
  improvementDescription: string;
};

/** Cleard is the private provider / surety on record for every NOC it files. */
export const NOC_SURETY = {
  name: FLORIDIAN_FIRM.firmName,
  address: `${FLORIDIAN_FIRM.addressLine1}, ${FLORIDIAN_FIRM.addressLine2}`,
};

export function buildNOCFields(input: NOCFieldsInput): NOCFields {
  const isOwnerBuilder = input.filerType === "owner_builder";
  return {
    propertyAddress: input.propertyAddress,
    parcelTaxId: input.parcelTaxId,
    legalDescription: input.legalDescription,
    ownerName: input.ownerName,
    ownerAddress: input.ownerAddress,
    // Florida allows an owner acting as their own contractor (§489.103(7)) to
    // file as Owner-Builder instead of naming a licensed contractor.
    contractorName: isOwnerBuilder
      ? `${input.ownerName || "Owner"} (Owner-Builder)`
      : input.contractorName,
    contractorAddress: isOwnerBuilder ? input.ownerAddress : input.contractorAddress,
    contractorLicense: isOwnerBuilder ? "N/A — Owner-Builder" : input.contractorLicense,
    contractorPhone: input.contractorPhone,
    lenderName: input.lenderName,
    lenderAddress: input.lenderAddress,
    suretyName: NOC_SURETY.name,
    suretyAddress: NOC_SURETY.address,
    suretyBondAmount: input.suretyBondAmount,
    designProfessional: input.designeeName,
    designProfessionalAddress: input.designeeAddress,
    improvementDescription: input.improvementDescription,
  };
}

export type NTBOFieldsInput = {
  projectName: string;
  parcelTaxId: string;
};

export function buildNTBOFields(input: NTBOFieldsInput): NTBOFields {
  return {
    projectName: input.projectName,
    parcelTaxId: input.parcelTaxId,
    services: { plansReview: true, inspections: true },
    signatoryType: FLORIDIAN_FIRM.signatoryType,
    firmName: FLORIDIAN_FIRM.firmName,
    privateProvider: FLORIDIAN_FIRM.privateProvider,
    addressLine1: FLORIDIAN_FIRM.addressLine1,
    addressLine2: FLORIDIAN_FIRM.addressLine2,
    telephone: FLORIDIAN_FIRM.telephone,
    email: FLORIDIAN_FIRM.email,
    licenseNumber: FLORIDIAN_FIRM.licenseNumber,
    printNameCorporation: FLORIDIAN_FIRM.printNameCorporation,
    representativeName: FLORIDIAN_FIRM.representativeName,
  };
}
