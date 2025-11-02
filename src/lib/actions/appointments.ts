// src/lib/actions/appointments.ts
"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";


import { prisma } from "../prisma";

/** normalize appointment for UI */
function transformAppointment(appointment: any) {
  return {
    ...appointment,
    patientName: `${appointment.user?.firstname || ""} ${appointment.user?.lastname || ""}`.trim(),
    patientEmail: appointment.user?.email || "",
    doctorName: appointment.doctor?.name || "",
    doctorImageUrl: appointment.doctor?.imageUrl || "",
    date: appointment.date ? new Date(appointment.date).toISOString().split("T")[0] : null,
    time: appointment.time ?? null,
  };
}

/** ensure a DB user exists for this Clerk userId (returns prisma.User) */
export async function createUserIfMissing(clerkId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (user) return user;

  // Fetch data from Clerk
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(clerkId);
  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
  const firstname = clerkUser.firstName ?? "";
  const lastname = clerkUser.lastName ?? "";

  try {
    user = await prisma.user.create({
      data: {
        clerkId,
        email,
        firstname,
        lastname,
      },
    });
  } catch (error: any) {
    // Handle "duplicate clerkId" error if two requests race
    if (error.code === "P2002") {
      user = await prisma.user.findUnique({ where: { clerkId } });
    } else {
      throw error;
    }
  }

  return user;
}

/** All appointments (admin-ish) */
export async function getAppointments() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: { select: { firstname: true, lastname: true, email: true } },
        doctor: { select: { name: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return appointments.map(transformAppointment);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments");
  }
}

/** Appointments for the current (authenticated) user */
export async function getUserAppointments() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("You must be logged in to view appointments");

    const user = await createUserIfMissing(userId);

    if (!user) throw new Error("User not found");

    const appointments = await prisma.appointment.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { firstname: true, lastname: true, email: true } },
        doctor: { select: { name: true, imageUrl: true } },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return appointments.map(transformAppointment);
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    throw new Error("Failed to fetch user appointments");
  }
}

/** Stats (total + completed) for current user */
export async function getUserAppointmentStats() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("You must be authenticated");

    const user = await createUserIfMissing(userId);

    if (!user) throw new Error("User not found");

    const [totalCount, completedCount] = await Promise.all([
      prisma.appointment.count({ where: { userId: user.id } }),
      prisma.appointment.count({ where: { userId: user.id, status: "COMPLETED" } }),
    ]);

    return {
      totalAppointments: totalCount,
      completedAppointments: completedCount,
    };
  } catch (error) {
    console.error("Error fetching user appointment stats:", error);
    return { totalAppointments: 0, completedAppointments: 0 };
  }
}


/// Get booked time slots for a doctor on a specific date
export async function getBookedTimeSlots(doctorId: string, date: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: new Date(date),
        status: {
          in: ["CONFIRMED", "COMPLETED"], // consider both confirmed and completed appointments as blocking
        },
      },
      select: { time: true },
    });

    return appointments.map((appointment) => appointment.time);
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    return []; // return empty array if there's an error
  }
}
interface BookAppointmentInput {
  doctorId: string;
  date: string;
  time: string;
  reason?: string;
}

export async function bookAppointment(input: BookAppointmentInput) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("You must be logged in to book an appointment");

    if (!input.doctorId || !input.date || !input.time) {
      throw new Error("Doctor, date, and time are required");
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error("User not found. Please ensure your account is properly set up.");

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        doctorId: input.doctorId,
        date: new Date(input.date),
        time: input.time,
        reason: input.reason || "General consultation",
        status: "CONFIRMED",
      },
      include: {
        user: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        doctor: { select: { name: true, imageUrl: true } },
      },
    });

    return transformAppointment(appointment);
  } catch (error) {
    console.error("Error booking appointment:", error);
    throw new Error("Failed to book appointment. Please try again later.");
  }
}
/* duplicate getUserAppointments removed — use the earlier exported implementation that includes createUserIfMissing */
// export async function updateAppointmentStatus(input: { id: string; status: AppointmentStatus }) {
//   try {
//     const appointment = await prisma.appointment.update({
//       where: { id: input.id },
//       data: { status: input.status },
//     });

//     return appointment;
//   } catch (error) {
//     console.error("Error updating appointment:", error);
//     throw new Error("Failed to update appointment");
//   }
// }

