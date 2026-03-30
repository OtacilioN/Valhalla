// Domain entity types for Event

export interface Event {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  adminPassword: string;
  refereePassword: string;
  surpriseChallenge: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEventInput = {
  name: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  adminPassword: string;
  refereePassword: string;
  surpriseChallenge?: boolean;
};

export type UpdateEventInput = Partial<
  Omit<CreateEventInput, "adminPassword" | "refereePassword"> & {
    adminPassword?: string;
    refereePassword?: string;
    isActive?: boolean;
    surpriseChallenge?: boolean;
  }
>;
