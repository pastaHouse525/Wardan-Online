import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  doctorNameAr: text("doctor_name_ar").notNull(),
  specialty: text("specialty"),
  clinicLocation: text("clinic_location"),
  whatsappNumber: text("whatsapp_number").notNull(),
  consultationFee: numeric("consultation_fee"),
  patientName: text("patient_name"),
  appointmentDate: text("appointment_date"),
  notes: text("notes"),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
