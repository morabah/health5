"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { loadDoctorProfilePublic } from '@/data/doctorLoaders';
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import EmptyState from "@/components/ui/EmptyState";
import ApiModeIndicator from "@/components/ui/ApiModeIndicator";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/helpers";
import { 
  MapPinIcon, 
  GlobeAltIcon, 
  BriefcaseIcon, 
  CurrencyDollarIcon,
  UserIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  specialty: string;
  experience: number;
  location: string;
  languages: string[];
  fee: number;
  available: boolean;
  profilePicUrl: string;
  bio: string;
  education: string;
  services: string[];
  reviews: { reviewer: string; comment: string; rating: number }[];
  userId: string;
}

type TabKey = "bio" | "education" | "services" | "reviews";

export default function DoctorProfilePage() {
  const { doctorId } = useParams() as { doctorId: string };
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("bio");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchDoctor() {
      setLoading(true);
      try {
        const data = await loadDoctorProfilePublic(doctorId);
        
        // Ensure doctor name is properly formatted
        if (data) {
          if (!data.name || data.name.trim() === '') {
            data.name = `Dr. ${data.firstName || ''} ${data.lastName || ''}`.trim();
            
            if (data.name.trim() === '') {
              data.name = `Doctor (ID: ${data.userId.substring(0, 8)})`;
            }
          }
        }
        
        setDoctor(data);
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        setDoctor(null);
        toast.error("Could not load doctor profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  const handleBookAppointment = () => {
    if (!user) {
      toast.error("Please log in to book an appointment");
      router.push('/auth/login');
      return;
    }
    
    if (doctor) {
      router.push(`/main/book-appointment/${doctor.id}`);
      toast.success("Navigating to booking page...");
    }
  };

  const goBack = () => {
    router.push('/main/find-doctors');
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (!doctor?.reviews || doctor.reviews.length === 0) return null;
    
    const sum = doctor.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / doctor.reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading doctor profile...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!doctor) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <EmptyState
              title="Doctor not found"
              message="The doctor profile you are looking for does not exist or is unavailable."
              action={
                <Button onClick={goBack} variant="primary" label="Go Back" pageName="DoctorProfilePage">
                  Back to Find Doctors
                </Button>
              }
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={goBack}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Doctor Profile</h1>
          </div>
          <ApiModeIndicator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Doctor Information Sidebar */}
          <div className="md:col-span-4">
            <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="absolute top-4 right-4">
                  {doctor.available ? (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200">
                      Available
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-red-200">
                      Unavailable
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-16 left-6">
                  <img
                    src={doctor.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0D8ABC&color=fff&size=128`}
                    alt={doctor.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0D8ABC&color=fff&size=128`;
                    }}
                  />
                </div>
              </div>
              
              <div className="p-6 pt-20">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {doctor.name}
                </h2>
                
                <div className="flex items-center mt-1 text-sm text-blue-600 dark:text-blue-400 mb-4">
                  <BriefcaseIcon className="w-4 h-4 mr-2" />
                  <span>{doctor.specialty || 'General Practice'}</span>
                </div>
                
                <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <MapPinIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                    <span>{doctor.location || 'Location not specified'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <UserIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                    <span>{doctor.experience || 0} years of experience</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <GlobeAltIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                    <span>{doctor.languages?.join(', ') || 'English'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <CurrencyDollarIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                    <span>Consultation fee: ${doctor.fee}</span>
                  </div>
                  
                  {calculateAverageRating() && (
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <StarIcon className="w-5 h-5 mr-3 text-yellow-500" />
                      <span className="text-yellow-500 font-medium">{calculateAverageRating()}</span>
                      <span className="text-gray-500 ml-1">({doctor.reviews?.length || 0} reviews)</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-8">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    onClick={handleBookAppointment}
                    disabled={!doctor.available}
                    label={doctor.available ? "Book Appointment" : "Currently Unavailable"}
                    pageName="DoctorProfilePage"
                  >
                    {doctor.available ? "Book Appointment" : "Currently Unavailable"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Doctor Profile Content Section */}
          <div className="md:col-span-8">
            <Card className="border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                  <nav className="flex space-x-6" aria-label="Tabs">
                    <button
                      onClick={() => setTab("bio")}
                      className={`pb-3 px-1 ${tab === "bio" 
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
                    >
                      <div className="flex items-center">
                        <UserIcon className="w-5 h-5 mr-2" />
                        <span className="font-medium">About</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setTab("education")}
                      className={`pb-3 px-1 ${tab === "education" 
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
                    >
                      <div className="flex items-center">
                        <AcademicCapIcon className="w-5 h-5 mr-2" />
                        <span className="font-medium">Education</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setTab("services")}
                      className={`pb-3 px-1 ${tab === "services" 
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
                    >
                      <div className="flex items-center">
                        <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
                        <span className="font-medium">Services</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setTab("reviews")}
                      className={`pb-3 px-1 ${tab === "reviews" 
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
                    >
                      <div className="flex items-center">
                        <StarIcon className="w-5 h-5 mr-2" />
                        <span className="font-medium">Reviews</span>
                      </div>
                    </button>
                  </nav>
                </div>
                
                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {/* Bio Tab */}
                  {tab === "bio" && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About {doctor.name}</h3>
                      <div className="prose prose-blue max-w-none dark:prose-invert">
                        {doctor.bio ? (
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{doctor.bio}</p>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 italic">No biography information available.</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Education Tab */}
                  {tab === "education" && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Education & Training</h3>
                      {doctor.education ? (
                        <div className="prose prose-blue max-w-none dark:prose-invert">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{doctor.education}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No education information provided.</p>
                      )}
                    </div>
                  )}
                  
                  {/* Services Tab */}
                  {tab === "services" && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Services Offered</h3>
                      {doctor.services && doctor.services.length > 0 ? (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {doctor.services.map((service, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-1 text-blue-600 mr-3">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                              <span className="text-gray-700 dark:text-gray-300">{service}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No services listed.</p>
                      )}
                    </div>
                  )}
                  
                  {/* Reviews Tab */}
                  {tab === "reviews" && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Patient Reviews</h3>
                        {calculateAverageRating() && (
                          <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                            <StarIcon className="w-5 h-5 text-yellow-500 mr-2" />
                            <span className="text-gray-800 dark:text-gray-100 font-medium">{calculateAverageRating()}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">({doctor.reviews?.length || 0})</span>
                          </div>
                        )}
                      </div>
                      
                      {doctor.reviews && doctor.reviews.length > 0 ? (
                        <div className="space-y-4">
                          {doctor.reviews.map((review, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900 dark:text-white">{review.reviewer}</div>
                                <div className="flex items-center">
                                  <span className="text-yellow-500 mr-1">{review.rating}</span>
                                  <StarIcon className="w-4 h-4 text-yellow-500" />
                                </div>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                            <StarIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Be the first to leave a review after your appointment.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
