import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "company", "admin"] }).notNull(),
  name: text("name"),  // Made optional
  email: text("email").notNull(),
});

export const internships = pgTable("internships", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  location: text("location").notNull(),
  startDate: text("start_date").notNull(), // Using text instead of timestamp for SQLite compatibility
  endDate: text("end_date").notNull(),     // Using text instead of timestamp for SQLite compatibility
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  internshipId: integer("internship_id").notNull(),
  studentId: integer("student_id").notNull(),
  resumeUrl: text("resume_url").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
  appliedAt: timestamp("applied_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    password: true,
    role: true,
    email: true,
  })
  .extend({
    name: z.string().optional(),
    username: z.string().optional(),
    studentId: z.string().optional(),
  });

export const insertInternshipSchema = createInsertSchema(internships)
  .pick({
    title: true,
    description: true,
    requirements: true,
    location: true,
  })
  .extend({
    startDate: z.string(),
    endDate: z.string(),
  });

export const insertApplicationSchema = createInsertSchema(applications).pick({
  internshipId: true,
  resumeUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Internship = typeof internships.$inferSelect;
export type Application = typeof applications.$inferSelect;