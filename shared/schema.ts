import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "company", "admin"] }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

export const internships = pgTable("internships", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  location: text("location").notNull(),
  deadline: timestamp("deadline").notNull(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  internshipId: integer("internship_id").notNull(),
  studentId: integer("student_id").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
  appliedAt: timestamp("applied_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  email: true,
});

export const insertInternshipSchema = createInsertSchema(internships).pick({
  title: true,
  description: true,
  requirements: true,
  location: true,
  deadline: true,
});

export const insertApplicationSchema = createInsertSchema(applications).pick({
  internshipId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Internship = typeof internships.$inferSelect;
export type Application = typeof applications.$inferSelect;
