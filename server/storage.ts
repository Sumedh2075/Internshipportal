import { User, InsertUser, Internship, Application } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createInternship(internship: Omit<Internship, "id">): Promise<Internship>;
  getInternships(): Promise<Internship[]>;
  getInternshipsByCompany(companyId: number): Promise<Internship[]>;
  getInternship(id: number): Promise<Internship | undefined>;
  
  createApplication(application: Omit<Application, "id" | "appliedAt" | "status">): Promise<Application>;
  getApplicationsByStudent(studentId: number): Promise<Application[]>;
  getApplicationsByInternship(internshipId: number): Promise<Application[]>;
  updateApplicationStatus(id: number, status: "accepted" | "rejected"): Promise<Application>;
  
  updateUserPassword(id: number, hashedPassword: string): Promise<User>; // Added method signature
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private internships: Map<number, Internship>;
  private applications: Map<number, Application>;
  private currentUserId: number;
  private currentInternshipId: number;
  private currentApplicationId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.internships = new Map();
    this.applications = new Map();
    this.currentUserId = 1;
    this.currentInternshipId = 1;
    this.currentApplicationId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createInternship(data: Omit<Internship, "id">): Promise<Internship> {
    const id = this.currentInternshipId++;
    const internship = { 
      ...data,
      id,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    };
    this.internships.set(id, internship);
    return internship;
  }

  async getInternships(): Promise<Internship[]> {
    return Array.from(this.internships.values());
  }

  async getInternshipsByCompany(companyId: number): Promise<Internship[]> {
    return Array.from(this.internships.values()).filter(
      (internship) => internship.companyId === companyId
    );
  }

  async getInternship(id: number): Promise<Internship | undefined> {
    return this.internships.get(id);
  }

  async createApplication(data: Omit<Application, "id" | "appliedAt" | "status">): Promise<Application> {
    const id = this.currentApplicationId++;
    const application = {
      ...data,
      id,
      status: "pending" as const,
      appliedAt: new Date(),
    };
    this.applications.set(id, application);
    return application;
  }

  async getApplicationsByStudent(studentId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.studentId === studentId
    );
  }

  async getApplicationsByInternship(internshipId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.internshipId === internshipId
    );
  }

  async updateApplicationStatus(id: number, status: "accepted" | "rejected"): Promise<Application> {
    const application = this.applications.get(id);
    if (!application) throw new Error("Application not found");
    
    const updated = { ...application, status };
    this.applications.set(id, updated);
    return updated;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User> { // Added method implementation
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, password: hashedPassword };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();