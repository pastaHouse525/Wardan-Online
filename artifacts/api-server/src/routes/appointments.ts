import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/appointments", async (req, res) => {
  try {
    const appointments = await db
      .select()
      .from(appointmentsTable)
      .orderBy(desc(appointmentsTable.createdAt));

    res.json(appointments.map(a => ({
      ...a,
      consultationFee: a.consultationFee ? Number(a.consultationFee) : null,
      createdAt: a.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list appointments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/appointments", async (req, res) => {
  try {
    const { doctorNameAr, whatsappNumber, specialty, clinicLocation, consultationFee, patientName, appointmentDate, notes } = req.body;
    if (!doctorNameAr || !whatsappNumber) {
      return res.status(400).json({ error: "doctorNameAr and whatsappNumber are required" });
    }

    const [appointment] = await db.insert(appointmentsTable).values({
      doctorNameAr,
      whatsappNumber,
      specialty: specialty ?? null,
      clinicLocation: clinicLocation ?? null,
      consultationFee: consultationFee ? String(consultationFee) : null,
      patientName: patientName ?? null,
      appointmentDate: appointmentDate ?? null,
      notes: notes ?? null,
      status: "available",
    }).returning();

    res.status(201).json({
      ...appointment,
      consultationFee: appointment.consultationFee ? Number(appointment.consultationFee) : null,
      createdAt: appointment.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create appointment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
