import { User, InsertUser, Internship, Application } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import Database from "better-sqlite3";

// Define the IStorage interface
interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  createInternship(data: Omit<Internship, "id">): Promise<Internship>;
  getInternships(): Promise<Internship[]>;
  getInternshipsByCompany(companyId: number): Promise<Internship[]>;
  getInternship(id: number): Promise<Internship | undefined>;
  createApplication(data: Omit<Application, "id" | "appliedAt" | "status">): Promise<Application>;
  getApplicationsByStudent(studentId: number): Promise<(Application & { internshipTitle?: string })[]>;
  getApplicationsByInternship(internshipId: number): Promise<(Application & { studentName?: string })[]>;
  updateApplicationStatus(id: number, status: "accepted" | "rejected"): Promise<Application>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User>;
  updateInternship(id: number, data: Partial<Omit<Internship, "id">>): Promise<Internship>;
  deleteInternship(id: number): Promise<void>;
  deleteApplication(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  getAllApplications(): Promise<(Application & { internshipTitle?: string, studentName?: string })[]>;
};

const MemoryStore = createMemoryStore(session);

const db = new Database("db.sqlite");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    email TEXT
  );

  CREATE TABLE IF NOT EXISTS internships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    requirements TEXT,
    location TEXT,
    companyId INTEGER,
    startDate TEXT,
    endDate TEXT
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internshipId INTEGER,
    studentId INTEGER,
    status TEXT DEFAULT 'pending',
    resumeUrl TEXT,
    appliedAt TEXT
  );
`);

export class SqliteStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = db.prepare(
      "INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?) RETURNING *"
    ).get(insertUser.username, insertUser.password, insertUser.role, insertUser.name ?? null, insertUser.email) as User;
    return result;
  }

  async createInternship(data: Omit<Internship, "id">): Promise<Internship> {
    const result = db.prepare(
      "INSERT INTO internships (title, description, requirements, location, companyId, startDate, endDate) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
    ).get(data.title, data.description, data.requirements, data.location, data.companyId, data.startDate, data.endDate) as Internship;
    return result;
  }

  async getInternships(): Promise<(Internship & { companyName?: string })[]> {
    return db.prepare(`
      SELECT i.*, u.username as companyName 
      FROM internships i
      LEFT JOIN users u ON i.companyId = u.id
    `).all() as (Internship & { companyName?: string })[];
  }

  async getInternshipsByCompany(companyId: number): Promise<(Internship & { companyName?: string })[]> {
    try {
      const result = db.prepare(`
        SELECT i.*, u.username as companyName 
        FROM internships i
        LEFT JOIN users u ON i.companyId = u.id
        WHERE i.companyId = ?
      `).all(companyId) as (Internship & { companyName?: string })[];
      
      return result || [];
    } catch (error) {
      console.error("Error getting internships by company:", error);
      return [];
    }
  }

  async getInternship(id: number): Promise<(Internship & { companyName?: string }) | undefined> {
    try {
      return db.prepare(`
        SELECT i.*, u.username as companyName 
        FROM internships i
        LEFT JOIN users u ON i.companyId = u.id
        WHERE i.id = ?
      `).get(id) as (Internship & { companyName?: string }) | undefined;
    } catch (error) {
      console.error("Error getting internship by ID:", error);
      return undefined;
    }
  }

  async createApplication(data: Omit<Application, "id" | "appliedAt" | "status">): Promise<Application> {
    const result = db.prepare(
      "INSERT INTO applications (internshipId, studentId, resumeUrl, appliedAt, status) VALUES (?, ?, ?, datetime('now'), 'pending') RETURNING *"
    ).get(data.internshipId, data.studentId, data.resumeUrl) as Application;
    return result;
  }

  async getApplicationsByStudent(studentId: number): Promise<(Application & { internshipTitle?: string })[]> {
    return db.prepare(`
      SELECT a.*, i.title as internshipTitle
      FROM applications a
      LEFT JOIN internships i ON a.internshipId = i.id
      WHERE a.studentId = ?
    `).all(studentId) as (Application & { internshipTitle?: string })[];
  }

  async getApplicationsByInternship(internshipId: number): Promise<(Application & { studentName?: string })[]> {
    return db.prepare(`
      SELECT a.*, u.username as studentName
      FROM applications a
      LEFT JOIN users u ON a.studentId = u.id
      WHERE a.internshipId = ?
    `).all(internshipId) as (Application & { studentName?: string })[];
  }

  async updateApplicationStatus(id: number, status: "accepted" | "rejected"): Promise<Application> {
    const result = db.prepare(
      "UPDATE applications SET status = ? WHERE id = ? RETURNING *"
    ).get(status, id) as Application;
    return result;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User> {
    const result = db.prepare(
      "UPDATE users SET password = ? WHERE id = ? RETURNING *"
    ).get(hashedPassword, id) as User;
    return result;
  }

  async updateInternship(id: number, data: Partial<Omit<Internship, "id">>): Promise<Internship> {
    const current = await this.getInternship(id);
    if (!current) throw new Error("Internship not found");

    const updates = { ...current, ...data };
    const result = db.prepare(
      "UPDATE internships SET title = ?, description = ?, requirements = ?, location = ?, startDate = ?, endDate = ? WHERE id = ? RETURNING *"
    ).get(updates.title, updates.description, updates.requirements, updates.location, updates.startDate, updates.endDate, id) as Internship;
    return result;
  }

  async deleteInternship(id: number): Promise<void> {
    db.prepare("DELETE FROM internships WHERE id = ?").run(id);
  }

  async getAllUsers(): Promise<User[]> {
    return db.prepare("SELECT * FROM users").all() as User[];
  }

  async deleteUser(id: number): Promise<void> {
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  }

  async deleteApplication(id: number): Promise<void> {
    try {
      db.prepare("DELETE FROM applications WHERE id = ?").run(id);
    } catch (error) {
      console.error("Error deleting application:", error);
      throw new Error("Failed to delete application");
    }
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
      const result = db.prepare("UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), email = COALESCE(?, email) WHERE id = ? RETURNING *").get(data.name, data.role, data.email, id) as User | undefined;
      return result;
  }


  async getAllApplications(): Promise<(Application & { internshipTitle?: string, studentName?: string })[]> {
    return db.prepare(`
      SELECT a.*, i.title as internshipTitle, u.username as studentName
      FROM applications a
      LEFT JOIN internships i ON a.internshipId = i.id
      LEFT JOIN users u ON a.studentId = u.id
    `).all() as (Application & { internshipTitle?: string, studentName?: string })[];
  }
}

export const storage = new SqliteStorage();