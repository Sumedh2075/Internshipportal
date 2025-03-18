import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertInternshipSchema, insertApplicationSchema } from "@shared/schema";

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
      const internship = await storage.createInternship({
        ...data,
        companyId: req.user.id,
      });
      res.status(201).json(internship);
    } catch (error: any) {
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

  // Application routes
  app.post("/api/applications", checkRole("student"), async (req, res) => {
    const data = insertApplicationSchema.parse(req.body);
    const application = await storage.createApplication({
      ...data,
      studentId: req.user.id,
    });
    res.status(201).json(application);
  });

  app.get("/api/applications/student", checkRole("student"), async (req, res) => {
    const applications = await storage.getApplicationsByStudent(req.user.id);
    res.json(applications);
  });

  app.get("/api/applications/internship/:id", checkRole("company"), async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}