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
