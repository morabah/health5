"use strict";
/**
 * Defines core enumeration types used throughout the application.
 *
 * These enums provide type-safe status values for user roles, doctor verification, and appointment lifecycle management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentStatus = exports.VerificationStatus = exports.UserType = void 0;
/**
 * Enumerates the core user roles in the system.
 * - PATIENT: End user booking appointments.
 * - DOCTOR: Medical professional providing services.
 * - ADMIN: System administrator with elevated privileges.
 */
var UserType;
(function (UserType) {
    UserType["PATIENT"] = "PATIENT";
    UserType["DOCTOR"] = "DOCTOR";
    UserType["ADMIN"] = "ADMIN";
})(UserType || (exports.UserType = UserType = {}));
/**
 * Enumerates possible verification states for doctors.
 * - PENDING: Awaiting review by admin.
 * - VERIFIED: Approved and can provide services.
 * - REJECTED: Application denied by admin.
 */
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["APPROVED"] = "approved";
    VerificationStatus["REJECTED"] = "rejected";
    VerificationStatus["MORE_INFO_REQUIRED"] = "more_info_required";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
/**
 * Enumerates the lifecycle states of an appointment.
 * - PENDING: Awaiting confirmation by doctor.
 * - CONFIRMED: Accepted by doctor and scheduled.
 * - SCHEDULED: Confirmed and added to calendar.
 * - CANCELLED: Cancelled without specifying which party cancelled.
 * - CANCELLED_BY_PATIENT: Explicitly cancelled by patient.
 * - CANCELLED_BY_DOCTOR: Explicitly cancelled by doctor.
 * - COMPLETED: Appointment has taken place and is finished.
 * - NO_SHOW: Patient did not attend the scheduled appointment.
 * - RESCHEDULED: Appointment has been rescheduled to a new time.
 */
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "PENDING";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["SCHEDULED"] = "SCHEDULED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["CANCELLED_BY_PATIENT"] = "CANCELLED_BY_PATIENT";
    AppointmentStatus["CANCELLED_BY_DOCTOR"] = "CANCELLED_BY_DOCTOR";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
    AppointmentStatus["RESCHEDULED"] = "RESCHEDULED";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
