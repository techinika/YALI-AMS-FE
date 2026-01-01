import { Cohort } from "./cohort";
import { Track } from "./track";

export interface Member {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  twitter: string;
  phoneNumber: string;
  whatsappNumber: string;
  genderName: string;
  nearestLandmark: string | null;
  residentDistrictId: string | null;
  residentCountryId: string | null;
  residentDistrict: ResidentDistrict;
  residentSectorId: string | null;
  state: State;
  residentCountry: Country;
  residentSector: ResidentSector;
  cohortId: number | null;
  cohort: Cohort;
  bio: string;
  gender: Gender;
  status: string;
  track: Track | null;
  organizationFoundedId: number | null;
  organizationFounded: Organization;
  positionInFounded: string | null;
  organizationEmployedId: number | null;
  organizationEmployed: Organization;
  positionInEmployed: string | null;
  password: string | null;
  role: Role;
  profileImage: ProfileImage;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  workingSector: WorkingSector;
  districtId: string;
  district: ResidentDistrict;
  country: Country;
  sectorId: string;
  state: State;
  sector: ResidentSector;
  website: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface Gender {
  id: string;
  name: string;
}

export interface ResidentDistrict {
  id: string;
  name: string;
}

export interface Country {
  id: string;
  name: string;
}

export interface State {
  id: string;
  name: string;
  countryCode: string;
}

export interface ResidentSector {
  id: string;
  name: string;
}

export interface ProfileImage {
  id: string;
  link: string;
  name: string;
}

export interface WorkingSector {
  id: string;
  name: string;
}

export const userStatusTypes = {
  DELETED: "deleted",
  INACTIVE: "inactive",
  ACTIVE: "active",
  INVITED: "invited",
};
