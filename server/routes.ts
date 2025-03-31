import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertInternshipSchema, insertApplicationSchema } from "@shared/schema";

interface AuthenticatedUser {
  id: number;
  role: string;
  username: string;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Middleware to check role
  const checkRole = (role: string) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== role) return res.sendStatus(403);
    next();
  };

  // Internship routes
  app.get("/api/internships", async (req, res) => {
    const internships = await storage.getInternships();
    res.json(internships);
  });

  app.post("/api/internships", checkRole("company"), async (req, res) => {
    if (!req.user) {
      return res.sendStatus(401);
    }

    try {
      const data = insertInternshipSchema.parse(req.body);
      // Convert dates to ISO string format
      const internship = await storage.createInternship({
        ...data,
        companyId: req.user.id,
        startDate: data.startDate,
        endDate: data.endDate,
      });
      res.status(201).json(internship);
    } catch (error: any) {
      console.error("Error creating internship:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/internships/company", checkRole("company"), async (req, res) => {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const internships = await storage.getInternshipsByCompany(req.user.id);
    res.json(internships);
  });

  app.patch("/api/internships/:id", checkRole("company"), async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      // Get the internship to verify ownership
      const internshipId = parseInt(req.params.id);
      const internship = await storage.getInternship(internshipId);
      
      if (!internship) {
        return res.status(404).json({ message: "Internship not found" });
      }
      
      // Check if the current user is the owner of this internship
      if (internship.companyId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to edit this internship" });
      }
      
      const data = req.body;
      // Format dates if they exist in the update
      const formattedData: any = { ...data };
      
      // We're already using string dates in SQLite
      
      const updatedInternship = await storage.updateInternship(internshipId, formattedData);
      res.json(updatedInternship);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/internships/:id", checkRole("company"), async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      // Get the internship to verify ownership
      const internshipId = parseInt(req.params.id);
      const internship = await storage.getInternship(internshipId);
      
      if (!internship) {
        return res.status(404).json({ message: "Internship not found" });
      }
      
      // Check if the current user is the owner of this internship
      if (internship.companyId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this internship" });
      }
      
      await storage.deleteInternship(internshipId);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Application routes
  app.post("/api/applications", checkRole("student"), async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    const data = insertApplicationSchema.parse(req.body);
    const application = await storage.createApplication({
      ...data,
      studentId: req.user.id,
    });
    res.status(201).json(application);
  });

  app.get("/api/applications/student", checkRole("student"), async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const applications = await storage.getApplicationsByStudent(req.user.id);
    res.json(applications);
  });

  app.get("/api/applications/internship/:id", checkRole("company"), async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const applications = await storage.getApplicationsByInternship(parseInt(req.params.id));
    res.json(applications);
  });

  app.patch("/api/applications/:id/status", checkRole("company"), async (req, res) => {
    const { status } = req.body;
    if (status !== "accepted" && status !== "rejected") {
      return res.status(400).send("Invalid status");
    }

    const application = await storage.updateApplicationStatus(parseInt(req.params.id), status);
    res.json(application);
  });

  // Admin routes
  app.get("/api/admin/users", checkRole("admin"), async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.delete("/api/admin/users/:id", checkRole("admin"), async (req, res) => {
    await storage.deleteUser(parseInt(req.params.id));
    res.sendStatus(204);
  });

  app.patch("/api/admin/users/:id", checkRole("admin"), async (req, res) => {
    const user = await storage.updateUser(parseInt(req.params.id), req.body);
    res.json(user);
  });

  app.get("/api/admin/applications/export", checkRole("admin"), async (req, res) => {
    const applications = await storage.getAllApplications();
    const xlsx = require('xlsx');

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(applications);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Applications');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.xlsx');

    const buffer = xlsx.write(workbook, { type: 'buffer' });
    res.send(buffer);
  });

  // Admin internship management routes
  app.delete("/api/admin/internships/:id", checkRole("admin"), async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      await storage.deleteInternship(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/internships/:id", checkRole("admin"), async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const data = req.body;
      const internship = await storage.updateInternship(parseInt(req.params.id), data);
      res.json(internship);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}