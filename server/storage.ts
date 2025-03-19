import { User, InsertUser, Internship, Application } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import Database from "better-sqlite3";

const MemoryStore = createMemoryStore(session);

const db = new Database("db.sqlite");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT
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
      "INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?) RETURNING *"
    ).get(insertUser.username, insertUser.password, insertUser.role, insertUser.name ?? null) as User;
    return result;
  }

  async createInternship(data: Omit<Internship, "id">): Promise<Internship> {
    const result = db.prepare(
      "INSERT INTO internships (title, description, requirements, location, companyId, startDate, endDate) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
    ).get(data.title, data.description, data.requirements, data.location, data.companyId, data.startDate, data.endDate) as Internship;
    return result;
  }

  async getInternships(): Promise<Internship[]> {
    return db.prepare("SELECT * FROM internships").all() as Internship[];
  }

  async getInternshipsByCompany(companyId: number): Promise<Internship[]> {
    return db.prepare("SELECT * FROM internships WHERE companyId = ?").all(companyId) as Internship[];
  }

  async getInternship(id: number): Promise<Internship | undefined> {
    return db.prepare("SELECT * FROM internships WHERE id = ?").get(id) as Internship | undefined;
  }

  async createApplication(data: Omit<Application, "id" | "appliedAt" | "status">): Promise<Application> {
    const result = db.prepare(
      "INSERT INTO applications (internshipId, studentId, resumeUrl, appliedAt, status) VALUES (?, ?, ?, datetime('now'), 'pending') RETURNING *"
    ).get(data.internshipId, data.studentId, data.resumeUrl) as Application;
    return result;
  }

  async getApplicationsByStudent(studentId: number): Promise<Application[]> {
    return db.prepare("SELECT * FROM applications WHERE studentId = ?").all(studentId) as Application[];
  }

  async getApplicationsByInternship(internshipId: number): Promise<Application[]> {
    return db.prepare("SELECT * FROM applications WHERE internshipId = ?").all(internshipId) as Application[];
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

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
      const result = db.prepare("UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role) WHERE id = ? RETURNING *").get(data.name, data.role, id) as User | undefined;
      return result;
  }


  async getAllApplications(): Promise<Application[]> {
    return db.prepare("SELECT * FROM applications").all() as Application[];
  }
}

export const storage = new SqliteStorage();