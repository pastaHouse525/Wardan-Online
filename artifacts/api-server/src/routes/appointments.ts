import { Router } from "express";
import { getServerSupabase, mapAppointment, type SupabaseAppointment } from "../lib/supabase";

const router = Router();

router.get("/appointments", async (req, res) => {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json((data as SupabaseAppointment[]).map(mapAppointment));
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

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        doctor_name_ar: doctorNameAr,
        whatsapp_number: whatsappNumber,
        specialty: specialty ?? null,
        clinic_location: clinicLocation ?? null,
        consultation_fee: consultationFee ? Number(consultationFee) : null,
        patient_name: patientName ?? null,
        appointment_date: appointmentDate ?? null,
        notes: notes ?? null,
        status: "available",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapAppointment(data as SupabaseAppointment));
  } catch (err) {
    req.log.error({ err }, "Failed to create appointment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
