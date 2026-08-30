import type { DjangoVersionNumber } from "@/domain/firestore/version";

/** The settings a project is created from. */
export interface ProjectDraft {
  name: string;
  description: string;
  version: DjangoVersionNumber;
  htmx: boolean;
  channels: boolean;
}

export const emptyDraft: ProjectDraft = {
  name: "",
  description: "",
  version: 6,
  htmx: true,
  channels: false,
};
