"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Alert from "@/components/ui/Alert";
import { useRouter } from "next/navigation";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logInfo, logWarn, logError, logValidation } from "@/lib/logger";
import { trackPerformance } from "@/lib/performance";
import { UserType, VerificationStatus } from "@/types/enums";

export default function DoctorRegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    specialty: "",
    yearsOfExperience: "",
    education: "",
    bio: "",
    location: "",
    languages: "",
    consultationFee: ""
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }

  async function handleFileUpload(file: File, path: string): Promise<string> {
    const perf = trackPerformance(`upload-${path}`);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      return await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
            logInfo(`Upload progress for ${path}: ${progress}%`);
          },
          (err) => {
            logError(`Upload error for ${path}: ${err.message}`);
            perf.stop();
            reject(err);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            logInfo(`Upload complete for ${path}: ${url}`);
            perf.stop();
            resolve(url);
          }
        );
      });
    } catch (err: any) {
      logError(`File upload failed for ${path}: ${err.message}`);
      perf.stop();
      throw err;
    }
  }

  async function handleDoctorRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setError(null);
    setIsSubmitting(true);
    const perf = trackPerformance("registerDoctor");
    try {
      // Basic validation
      if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword || !form.licenseNumber || !form.specialty) {
        setError("Please fill in all required fields.");
        setIsSubmitting(false);
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        setIsSubmitting(false);
        return;
      }
      if (!licenseFile) {
        setError("Please upload your medical license document.");
        setIsSubmitting(false);
        return;
      }
      // Upload files if present (use timestamp for now; backend should move/rename after UID assignment)
      let profilePicUrl = null;
      let licenseDocUrl = null;
      let certUrl = null;
      const timestamp = Date.now();
      try {
        if (profilePicture) {
          profilePicUrl = await handleFileUpload(profilePicture, `doctors/tmp_${timestamp}_profile.jpg`);
        }
        if (licenseFile) {
          licenseDocUrl = await handleFileUpload(licenseFile, `doctors/tmp_${timestamp}_license.pdf`);
        }
        if (certificateFile) {
          certUrl = await handleFileUpload(certificateFile, `doctors/tmp_${timestamp}_certificate.pdf`);
        }
      } catch (uploadErr: any) {
        setError("File upload failed. Please try again.");
        logError("File upload failed:", uploadErr);
        setIsSubmitting(false);
        perf.stop();
        return;
      }
      // Prepare registration data
      const dataObject = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        userType: UserType.DOCTOR,
        specialty: form.specialty,
        licenseNumber: form.licenseNumber,
        yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience) : 0,
        education: form.education,
        bio: form.bio,
        location: form.location,
        languages: form.languages.split(',').map(lang => lang.trim()),
        consultationFee: form.consultationFee ? parseFloat(form.consultationFee) : 0,
        profilePictureUrl: profilePicUrl,
        licenseDocumentUrl: licenseDocUrl,
        certificateUrl: certUrl,
        verificationStatus: VerificationStatus.PENDING
      };
      logInfo("Doctor registration payload:", dataObject);
      // Call backend
      const functions = getFunctions();
      const registerUser = httpsCallable(functions, "registerUser");
      const result = await registerUser(dataObject);
      logInfo("Doctor registration result:", result);
      logValidation("6.5", "success", "Live Doctor Registration connected with uploads.");
      setFeedback("Registration successful! Your account is pending verification by an administrator. Redirecting...");
      setTimeout(() => {
        router.push("/auth/pending-verification");
      }, 2000);
    } catch (err: any) {
      logError("Doctor registration failed:", err);
      setError(err.message === "already-exists" ? "Email already registered." : "Registration failed.");
    } finally {
      setIsSubmitting(false);
      perf.stop();
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Doctor Registration</h1>
          <p className="mb-6 text-center text-gray-600 dark:text-gray-300">
            Join our healthcare network by providing your professional information.
            Your account will be verified by an administrator before you can start using the platform.
          </p>
          {error && <Alert variant="error" message={error} isVisible={!!error} className="mb-4" />}
          {feedback && <Alert variant="info" message={feedback} isVisible={!!feedback} className="mb-4" />}
          <form className="space-y-6" onSubmit={handleDoctorRegister}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name *" name="firstName" value={form.firstName} onChange={handleChange} required />
                  <Input label="Last Name *" name="lastName" value={form.lastName} onChange={handleChange} required />
                </div>
                <Input label="Email *" name="email" type="email" value={form.email} onChange={handleChange} required />
                <Input label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
                <Input label="Password *" name="password" type="password" value={form.password} onChange={handleChange} required />
                <Input label="Confirm Password *" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
                <div>
                  <label className="block text-sm font-medium mb-1">Profile Picture</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => handleFileChange(e, setProfilePicture)} 
                    className="block w-full text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Professional Information</h2>
                <Input label="Medical License Number *" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} required />
                <Select 
                  label="Specialty *"
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "Select specialty" },
                    { value: "Cardiology", label: "Cardiology" },
                    { value: "Dermatology", label: "Dermatology" },
                    { value: "Endocrinology", label: "Endocrinology" },
                    { value: "Family Medicine", label: "Family Medicine" },
                    { value: "Gastroenterology", label: "Gastroenterology" },
                    { value: "Internal Medicine", label: "Internal Medicine" },
                    { value: "Neurology", label: "Neurology" },
                    { value: "Obstetrics & Gynecology", label: "Obstetrics & Gynecology" },
                    { value: "Oncology", label: "Oncology" },
                    { value: "Ophthalmology", label: "Ophthalmology" },
                    { value: "Orthopedics", label: "Orthopedics" },
                    { value: "Pediatrics", label: "Pediatrics" },
                    { value: "Psychiatry", label: "Psychiatry" },
                    { value: "Radiology", label: "Radiology" },
                    { value: "Urology", label: "Urology" },
                    { value: "Other", label: "Other" }
                  ]}
                  required
                />
                <Input 
                  label="Years of Experience" 
                  name="yearsOfExperience" 
                  type="number" 
                  value={form.yearsOfExperience} 
                  onChange={handleChange} 
                  min="0" 
                  max="99" 
                />
                <Input label="Location" name="location" value={form.location} onChange={handleChange} placeholder="City, State/Province" />
                <Input 
                  label="Languages" 
                  name="languages" 
                  value={form.languages} 
                  onChange={handleChange} 
                  placeholder="English, Spanish, etc. (comma separated)" 
                />
                <Input 
                  label="Consultation Fee ($)" 
                  name="consultationFee" 
                  type="number" 
                  value={form.consultationFee} 
                  onChange={handleChange} 
                  min="0" 
                  step="0.01" 
                />
                <Textarea 
                  label="Education" 
                  name="education" 
                  value={form.education} 
                  onChange={handleChange} 
                  placeholder="Your education and training background" 
                  rows={2} 
                />
                <Textarea 
                  label="Bio" 
                  name="bio" 
                  value={form.bio} 
                  onChange={handleChange} 
                  placeholder="Tell us about yourself" 
                  rows={3} 
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Medical License Document *</label>
                  <input 
                    type="file" 
                    accept="application/pdf,image/*"
                    onChange={e => handleFileChange(e, setLicenseFile)}
                    className="block w-full text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Certificate (optional)</label>
                  <input 
                    type="file" 
                    accept="application/pdf,image/*"
                    onChange={e => handleFileChange(e, setCertificateFile)}
                    className="block w-full text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4">
              <Button
                type="submit"
                label={isSubmitting ? "Registering..." : "Register"}
                pageName="DoctorRegistration"
                className="w-full"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              />
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </form>
          <div className="mt-6 text-center">
            Already have an account? <Link href="/auth/login" className="text-primary font-semibold">Login</Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
