import { Router } from "express";
import { query, queryOne } from "../lib/db";

const router = Router();

function mapAppointment(r: Record<string, unknown>) {
  return {
    id: r.id,
    doctorNameAr: r.doctor_name_ar,
    specialty: r.specialty ?? null,
    clinicLocation: r.clinic_location ?? null,
    consultationFee: r.consultation_fee ? Number(r.consultation_fee) : null,
    whatsappNumber: r.whatsapp_number,
    patientName: r.patient_name ?? null,
    appointmentDate: r.appointment_date ?? null,
    notes: r.notes ?? null,
    status: r.status,
    createdAt: r.created_at,
  };
}

router.get("/appointments", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM appointments ORDER BY created_at DESC"
    );
    res.json(rows.map(mapAppointment));
  } catch (err) {
    req.log.error({ err }, "Failed to list appointments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/appointments", async (req, res) => {
  try {
    const {
      doctorNameAr, whatsappNumber, specialty, clinicLocation,
      consultationFee, patientName, appointmentDate, notes,
    } = req.body;
    if (!doctorNameAr || !whatsappNumber) {
      return res.status(400).json({ error: "doctorNameAr and whatsappNumber are required" });
    }

    const row = await queryOne(
      `INSERT INTO appointments
        (doctor_name_ar, whatsapp_number, specialty, clinic_location,
         consultation_fee, patient_name, appointment_date, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'available')
       RETURNING *`,
      [
        doctorNameAr, whatsappNumber,
        specialty ?? null, clinicLocation ?? null,
        consultationFee ? Number(consultationFee) : null,
        patientName ?? null, appointmentDate ?? null, notes ?? null,
      ]
    );
    if (!row) throw new Error("Insert returned no row");
    res.status(201).json(mapAppointment(row));
  } catch (err) {
    req.log.error({ err }, "Failed to create appointment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
