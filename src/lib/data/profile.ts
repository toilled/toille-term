import profileData from "../../content/profile/profile.json";

export interface Skill {
  name: string;
  icon: string;
  link: string;
}

export interface SkillCategory {
  category: string;
  skills: Skill[];
}

export interface ExperienceItem {
  period: string;
  badge: string;
  badgeTone: "cyan" | "pink" | "purple" | "yellow";
  title: string;
  description: string;
}

export interface EducationItem {
  period: string;
  badge: string;
  badgeTone: "cyan" | "pink" | "purple" | "yellow";
  degree: string;
  institution: string;
  description: string;
}

export interface Profile {
  identity: {
    name: string;
    handle: string;
    role: string;
    jobTitle: string;
    company: string;
    education: string;
    credential: string;
    experienceYears: string;
    location: string;
    engineeringFocus: string;
    workPreference: string;
    social: {
      github: string;
      youtube: string;
    };
  };
  skills: SkillCategory[];
  experience: ExperienceItem[];
  education: EducationItem[];
}

export const PROFILE: Profile = profileData as Profile;
