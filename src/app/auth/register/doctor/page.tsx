"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { mockRegisterUser } from "@/lib/mockApiService";
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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback("Registering doctor...");
    setIsSubmitting(true);
    
    // Basic validation
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword || !form.licenseNumber || !form.specialty) {
      setFeedback("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }
    
    if (form.password !== form.confirmPassword) {
      setFeedback("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }
    
    if (!licenseFile) {
      setFeedback("Please upload your medical license document.");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const result = await mockRegisterUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
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
        // Files would be uploaded to storage in a real app
        profilePictureUrl: profilePicture ? URL.createObjectURL(profilePicture) : null,
        licenseDocumentUrl: licenseFile ? URL.createObjectURL(licenseFile) : null,
        certificateUrl: certificateFile ? URL.createObjectURL(certificateFile) : null,
        verificationStatus: VerificationStatus.PENDING
      } as any);
      
      setFeedback("Registration successful! Your account is pending verification by an administrator. Redirecting to verification status page...");
      
      setTimeout(() => {
        window.location.href = "/auth/pending-verification";
      }, 2000);
    } catch (err: any) {
      setFeedback(err.message === "already-exists" ? "Email already registered." : "Registration failed.");
    } finally {
      setIsSubmitting(false);
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
          
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  label="Professional Bio" 
                  name="bio" 
                  value={form.bio} 
                  onChange={handleChange}
                  placeholder="Brief description of your practice and expertise" 
                  rows={2} 
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Verification Documents</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Please upload the following documents for verification. Your account will remain in "Pending Verification" status until an administrator reviews and approves these documents.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Medical License Document *</label>
                  <input 
                    type="file" 
                    accept="application/pdf,image/*" 
                    onChange={e => handleFileChange(e, setLicenseFile)} 
                    className="block w-full text-gray-900 dark:text-gray-100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">PDF or image of your valid medical license</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Board Certification</label>
                  <input 
                    type="file" 
                    accept="application/pdf,image/*" 
                    onChange={e => handleFileChange(e, setCertificateFile)} 
                    className="block w-full text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">PDF or image of your specialty certification (optional)</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input 
                  id="terms" 
                  type="checkbox" 
                  required 
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  I agree to the <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link> and <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>
                </label>
              </div>
              
              <Button 
                type="submit" 
                label="Register as Doctor"
                pageName="DoctorRegistration"
                className="w-full" 
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register as Doctor"}
              </Button>
            </div>
          </form>
          
          {feedback && (
            <div className={`mt-4 p-3 rounded text-center ${feedback.includes("successful") ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>
              {feedback}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Already have an account? Sign in</Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
