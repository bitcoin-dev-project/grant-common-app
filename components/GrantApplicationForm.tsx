"use client"
import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import ReCAPTCHA from 'react-google-recaptcha'
import axios from 'axios'
import organizations from '../config/organizations'
import { formSections, getFieldsForSection, getRequiredFieldsBySection } from '../config/fieldDefinitions'
import SmartLink from './SmartLink'
import Image from 'next/image'
import FormInput from './FormInput'

type FormData = Record<string, any>;

interface DebugInfo {
  validationErrors?: Record<string, string>;
  [key: string]: unknown;
}

// Add this helper function at the top level, before the component definition
function formatFieldName(field: string): string {
  // Convert camelCase or snake_case to Title Case with spaces
  return field
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Add this helper function to focus an element by name
function focusElementByName(name: string) {
  setTimeout(() => {
    const element = document.getElementsByName(name)[0];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  }, 100);
}

// Section divider component
const SectionDivider = ({ title }: { title: string }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
    <div className="h-1 w-20 bg-blue-500 rounded"></div>
  </div>
);

// Field value with type information
interface ReviewField {
  label: string;
  value: any;
  id: string;
  type?: string;
}

// Section with its fields
interface ReviewSection {
  title: string;
  id: string;
  fields: ReviewField[];
}

interface SubmissionProgress {
  phase: 'idle' | 'preparing' | 'submitting' | 'completed';
  message: string;
  organizations: { 
    id: string; 
    name: string; 
    status: 'pending' | 'processing' | 'success' | 'error'; 
    message?: string 
  }[];
  currentOrgIndex: number;
  startTime: number;
}

export default function GrantApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [partiallySubmitted, setPartiallySubmitted] = useState(false);
  const [submissionResults, setSubmissionResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showWelcomeStep, setShowWelcomeStep] = useState(false);
  const [showFilesWarning, setShowFilesWarning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [submissionProgress, setSubmissionProgress] = useState<SubmissionProgress>({
    phase: 'idle',
    message: '',
    organizations: [],
    currentOrgIndex: 0,
    startTime: 0
  });

  // Client-side only state to prevent hydration issues
  const [isClient, setIsClient] = useState(false);

  // Set client flag after hydration to prevent SSR mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add reCAPTCHA ref
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  // Create refs properly, not in a callback
  const sectionRefs = useRef<Array<HTMLDivElement | null>>(Array(formSections.length).fill(null));
  
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
    reset
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      organizations: []
    }
  });

  const selectedOrgs = watch('organizations', []) as string[];
  
  // Get required fields based on selected organizations
  const requiredFieldsBySection = getRequiredFieldsBySection(selectedOrgs);
  
  // Get visible sections based on selected organizations
  const visibleSections = formSections.filter(section => {
    // Organization section is always visible
    if (section.id === 'organization') return true;
    
    // For other sections, check if they have any fields
    const sectionFields = getFieldsForSection(section.id, selectedOrgs);
    
    // Special case for "other" section - always show it for the review step
    if (section.id === 'other') return true;
    
    return sectionFields.length > 0;
  });
  
  // Check if there's a saved draft (client-side only)
  useEffect(() => {
    if (!isClient) return; // Only run on client side
    
    const savedDraft = localStorage.getItem('grantApplicationDraft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        if (draftData) {
          setHasSavedDraft(true);
          setShowWelcomeStep(true);
        }
      } catch (e) {
        console.error('Error checking for saved draft', e);
      }
    }
  }, [isClient]);
  
  // Load saved draft data if available
  const loadSavedDraft = useCallback(() => {
    const savedDraft = localStorage.getItem('grantApplicationDraft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        // Reset form with saved data
        if (draftData) {
          const { lastStep, hadFiles, ...formData } = draftData;
          
          // Restore the form data
          reset(formData);
          
          // Restore the last step if it's valid
          if (typeof lastStep === 'number' && lastStep >= 0) {
            setCurrentStep(lastStep);
          } else {
            setCurrentStep(0);
          }
          
          // Set the flag to show the draft loaded notification
          setHasSavedDraft(true);
          setTimeout(() => setHasSavedDraft(false), 5000); // Hide after 5 seconds
          
          // Hide welcome step
          setShowWelcomeStep(false);
          
          // Show files warning only if the draft previously had files
          if (hadFiles) {
            setShowFilesWarning(true);
          }
          
          console.log('Restored saved draft data');
        }
      } catch (e) {
        console.error('Error loading draft', e);
      }
    }
  }, [reset]);
  
  // Start a new application
  const startNewApplication = useCallback(() => {
    // Reset the form to initial state
    reset({
      organizations: []
    });
    
    // Reset to the first step
    setCurrentStep(0);
    
    // Hide welcome step
    setShowWelcomeStep(false);
  }, [reset]);
  
  // Next button handler
  const goToNextStep = async () => {
    // Check if current section fields are valid
    const currentSection = visibleSections[currentStep];
    const currentRequiredFields = requiredFieldsBySection[formSections.findIndex(s => s.id === currentSection.id)] || [];
    const isStepValid = await trigger(currentRequiredFields);
    
    // For the first step, additionally check if at least one organization is selected
    if (currentStep === 0 && selectedOrgs.length === 0) {
      return; // Don't proceed if no organization is selected
    }
    
    if (isStepValid) {
      // Update step
      setCurrentStep(prev => Math.min(prev + 1, visibleSections.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Previous button handler
  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Direct navigation to a specific step
  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add a new useEffect to handle special behavior when moving to the Other Info step
  useEffect(() => {
    const lastStep = visibleSections.length - 1;
    if (currentStep === lastStep) {
      // When navigating to the last step ("Other Info"), ensure no button has focus
      // This prevents accidental submission via Enter key
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      
      // Focus on a non-interactive element to prevent auto-focus on submit button
      const focusTrap = document.getElementById('focus-trap');
      if (focusTrap) {
        focusTrap.focus();
      }
      
      // Add a key event handler to disable Enter key form submission
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          return false;
        }
      };
      
      // Add the event listener to the form or document
      document.addEventListener('keydown', handleKeyDown);
      
      // Clean up when leaving the step
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [currentStep, visibleSections]);
  
  // Save current form data as draft - memoize with useCallback
  const saveDraft = useCallback(() => {
    setDraftSaving(true);
    
    try {
      const formData = watch();
      
      // Create a copy of form data without files (files can't be serialized to JSON)
      const draftData: Record<string, any> = {};
      
      Object.entries(formData).forEach(([key, value]) => {
        // Skip FileList objects as they can't be serialized
        if (typeof FileList !== 'undefined' && value instanceof FileList) {
          // Don't include files in draft
          return;
        }
        draftData[key] = value;
      });
      
      // Track if there were files when saving this draft
      const hadFiles = typeof FileList !== 'undefined' 
        ? Object.values(formData).some(value => value instanceof FileList && value.length > 0)
        : false;
      
      localStorage.setItem('grantApplicationDraft', JSON.stringify({
        ...draftData,
        lastStep: currentStep,
        hadFiles: hadFiles
      }));
      
      setTimeout(() => {
        setDraftSaved(true);
        setDraftSaving(false);
        
        // Reset the saved message after a few seconds
        setTimeout(() => {
          setDraftSaved(false);
        }, 3000);
      }, 600);
    } catch (e) {
      console.error('Error saving draft', e);
      setDraftSaving(false);
    }
  }, [currentStep, watch]);
  
  // Auto-save draft every minute (client-side only)
  useEffect(() => {
    // Don't auto-save if we're on the welcome step or not on client
    if (showWelcomeStep || !isClient) return;
    
    const autoSaveInterval = setInterval(() => {
      const formData = watch();
      // Only save if there's meaningful data (at least one organization selected)
      if (formData.organizations && formData.organizations.length > 0) {
        saveDraft();
      }
    }, 60000); // Auto-save every minute
    
    return () => clearInterval(autoSaveInterval);
  }, [showWelcomeStep, isClient, saveDraft, watch]);

  // Add a validateAllFields function to check all required fields
  const validateAllFields = () => {
    const data = watch();
    const missingFields: Record<string, string> = {};
    
    // Check all required fields for selected organizations
    Object.entries(requiredFieldsBySection).forEach(([, fieldList]) => {
      fieldList.forEach(field => {
        if (field === 'organizations') {
          if (!data.organizations || data.organizations.length === 0) {
            missingFields.organizations = "Please select at least one organization";
          }
        } else if (!data[field]) {
          missingFields[field] = "This field is required";
        }
      });
    });
    
    return missingFields;
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    // Initialize progress tracking
    const submittableOrgs = (data.organizations as string[]).filter((orgId: string) => 
      organizations[orgId]?.workflowImplemented === true
    );
    
    setSubmissionProgress({
      phase: 'preparing',
      message: 'Preparing your application...',
      organizations: submittableOrgs.map(orgId => ({
        id: orgId,
        name: organizations[orgId]?.name || orgId,
        status: 'pending'
      })),
      currentOrgIndex: 0,
      startTime: Date.now()
    });

    // Auto-scroll to top when processing starts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Simulate preparation phase
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmissionProgress(prev => ({
      ...prev,
      phase: 'submitting',
      message: 'Starting submission process...'
    }));

    // Simulate processing each organization one by one with better visual feedback
    const simulateRealTimeProgress = async () => {
      for (let i = 0; i < submittableOrgs.length; i++) {
        const orgId = submittableOrgs[i];
        const orgName = organizations[orgId]?.name || orgId;
        
        // Set current org as processing
        setSubmissionProgress(prev => ({
          ...prev,
          currentOrgIndex: i,
          message: `Processing ${orgName}...`,
          organizations: prev.organizations.map((org, index) => ({
            ...org,
            status: index === i ? 'processing' : index < i ? org.status : 'pending'
          }))
        }));
        
        // Simulate processing time (3-5 seconds per org for visual feedback)
        await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
        
        // We'll update with real results later, for now just mark as processing complete
        setSubmissionProgress(prev => ({
          ...prev,
          organizations: prev.organizations.map((org, index) => ({
            ...org,
            status: index === i ? 'success' : org.status, // Temporarily mark as success
            message: index === i ? 'Processing complete' : org.message
          }))
        }));
        
        // Short pause to show the result before moving to next
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setSubmissionProgress(prev => ({
        ...prev,
        phase: 'completed',
        message: 'All organizations processed! Getting final results...'
      }));
    };

    // Start the visual progress (just show processing state)
    const progressSimulation = simulateRealTimeProgress();

    try {
      // Actual form submission logic (unchanged)
      const formData = new FormData();
      
      // Add recaptcha token
      if (recaptchaToken) {
        formData.append('recaptchaToken', recaptchaToken);
      } else {
        setError('Please complete the reCAPTCHA verification');
        setLoading(false);
        return;
      }
      
      // Add organizations separately to ensure only valid ones are submitted
      submittableOrgs.forEach((orgId) => {
        formData.append('organizations', orgId);
      });
      
      // Add all other form fields to the FormData object
      Object.entries(data).forEach(([key, value]) => {
        // Skip organizations as we've already handled them
        if (key === 'organizations') return;
        
        // Handle file uploads
        if (value instanceof FileList && value.length > 0) {
          formData.append(key, value[0]);
        } else if (Array.isArray(value)) {
          // Handle other arrays
          value.forEach(item => formData.append(key, item));
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
      
      // Submit the form
      const response = await axios.post('/api/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Wait for progress simulation to complete
      await progressSimulation;
      
      console.log('API response:', response.data);
      
      // Update progress with real results from backend
      if (response.data.submissionSummary) {
        setSubmissionProgress(prev => ({
          ...prev,
          phase: 'completed',
          message: 'Processing complete!',
          organizations: prev.organizations.map(org => {
            const realResult = response.data.submissionSummary.organizationResults.find(
              (result: any) => result.organizationId === org.id
            );
            return {
              ...org,
              status: realResult ? (realResult.success ? 'success' : 'error') : 'error',
              message: realResult ? realResult.message : 'No response received'
            };
          })
        }));
      }
      
      if (response.data.success) {
        setSubmitted(true);
        // Store any debug info received
        if (response.data.data) {
          setDebugInfo(response.data.data);
        }
        
        // Clear the saved draft when form is successfully submitted
        localStorage.removeItem('grantApplicationDraft');
        
        // Reset form state to prevent data from staying if user navigates back
        reset({
          organizations: []
        });
        setCurrentStep(0);
      } else if (response.data.submissionSummary?.isPartialSuccess) {
        // Show partial success page instead of error
        setPartiallySubmitted(true);
        setSubmissionResults(response.data);
        
        // Clear the saved draft for partial success too
        localStorage.removeItem('grantApplicationDraft');
        
        // Reset form state for partial success too
        reset({
          organizations: []
        });
        setCurrentStep(0);
      } else {
        // Only show error if completely failed
        setError(response.data.message || 'Failed to submit application');
        if (response.data.error || response.data.data) {
          setDebugInfo(response.data.error || response.data.data);
        }
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Update progress to show all as failed if API call fails
      setSubmissionProgress(prev => ({
        ...prev,
        phase: 'completed',
        message: 'Submission failed',
        organizations: prev.organizations.map(org => ({
          ...org,
          status: 'error',
          message: 'Submission failed due to network error'
        }))
      }));
      
      setError(error.response?.data?.error || error.message || 'An error occurred');
      if (error.response?.data) {
        setDebugInfo(error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle reCAPTCHA change
  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  // Filter active organizations
  const activeOrgs = Object.values(organizations).filter(org => org.active);

  // Create a custom checkbox component for organization selection
  const OrganizationSelector = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5">
          {activeOrgs.map(org => {
            const isWorkflowReady = org.workflowImplemented === true;
            
            return (
              <div 
                key={org.id} 
                className={`relative rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                  selectedOrgs.includes(org.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : !isWorkflowReady
                      ? 'border-gray-200 bg-gray-50 opacity-90'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <label 
                  className="flex cursor-pointer"
                  onClick={(_) => {
                    if (!isWorkflowReady) {
                      _.preventDefault();
                    }
                  }}
                >
                  {org.logo && (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center p-4 bg-white">
                      <div className="relative w-full h-full">
                        <Image
                          src={org.logo}
                          alt={`${org.name} logo`}
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-grow p-5">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          value={org.id}
                          disabled={!isWorkflowReady}
                          {...register('organizations', { 
                            required: "Please select at least one organization",
                            validate: (value) => value.length > 0 || "Please select at least one organization"
                          })}
                          className={`h-5 w-5 rounded border-gray-300 mr-3 focus:ring-blue-500 ${
                            !isWorkflowReady ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'
                          }`}
                        />
                        <span className="font-semibold text-lg text-gray-900">{org.name}</span>
                      </div>
                      
                      {!isWorkflowReady && (
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full ml-2">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{org.description}</p>
                    
                    {isWorkflowReady && org.website && (
                      <a 
                        href={org.website} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit website
                        <svg className="inline-block h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                      </a>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>
        
        {errors.organizations && (
          <div className="mt-2 flex items-start text-red-600">
            <svg className="h-5 w-5 flex-shrink-0 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">{typeof errors.organizations.message === 'string' ? errors.organizations.message : "Please select at least one organization"}</p>
          </div>
        )}
        
        {selectedOrgs.some((orgId: string) => organizations[orgId]?.workflowImplemented === false) && (
          <p className="mt-3 text-xs text-gray-500 italic">
            Note: Organizations marked with &quot;Coming Soon&quot; are coming soon and will not receive your application yet.
          </p>
        )}
      </div>
    );
  };

  // Generate review summary of all form data
  const generateReviewSummary = (): ReviewSection[] => {
    const formData = watch();
    const sections: ReviewSection[] = [];
    
    // Loop through all visible sections and their fields
    formSections.forEach(section => {
      // Skip organization section as we'll handle it specially
      if (section.id === 'organization') return;
      
      // Get fields for this section
      const sectionFields = getFieldsForSection(section.id, selectedOrgs);
      if (sectionFields.length === 0) return;
      
      const fieldsWithValues = sectionFields
        .filter(field => formData[field.id] !== undefined && formData[field.id] !== '')
        .map(field => ({
          label: field.label,
          value: formData[field.id],
          id: field.id,
          type: field.type
        }));
      
      if (fieldsWithValues.length > 0) {
        sections.push({
          title: section.label,
          id: section.id,
          fields: fieldsWithValues
        });
      }
    });
    
    return sections;
  };
  
  // Render field value based on type
  const renderFieldValue = (field: ReviewField) => {
    const { value, type } = field;
    
    if (value === undefined || value === null || value === '') {
      return <em className="text-gray-500">Not provided</em>;
    }
    
    // Handle arrays (like for checkboxes)
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // Handle file uploads
    if (type === 'file') {
      if (value instanceof FileList && value.length > 0) {
        return <span className="text-blue-600">{value[0].name}</span>;
      }
      return <em className="text-gray-500">No file selected</em>;
    }
    
    // Handle select fields - try to get the label
    if (type === 'select') {
      // Find the field definition to get options
      const fieldDef = formSections
        .flatMap(s => getFieldsForSection(s.id, selectedOrgs))
        .find(f => f.id === field.id);
      
      if (fieldDef?.options) {
        const option = fieldDef.options.find(opt => opt.value === value);
        if (option) return option.label;
      }
      return value;
    }
    
    // Long text fields
    if (type === 'textarea' && typeof value === 'string') {
      if (value.length > 100) {
        return (
          <div className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-sm overflow-y-auto max-h-32">
            {value}
          </div>
        );
      }
    }
    
    // Default for simple values
    return value.toString();
  };

  // Render form sections dynamically based on the selected organizations
  const renderFormSection = (sectionIndex: number) => {
    const section = visibleSections[sectionIndex];
    if (!section) return null;
    
    // Get fields for this section based on selected organizations
    const sectionFields = getFieldsForSection(section.id, selectedOrgs);
    
    // Special handling for organization selector
    if (section.id === 'organization') {
      return (
        <div ref={(el) => { sectionRefs.current[sectionIndex] = el; }}>
          <SectionDivider title={section.label} />
          <OrganizationSelector />
        </div>
      );
    }
    
    // Special handling for the "other" section (final review)
    if (section.id === "other") {
      // Get the review summary
      const reviewSummaries = generateReviewSummary();
      
      return (
        <div ref={(el) => { sectionRefs.current[sectionIndex] = el; }}>
          <SectionDivider title="Review Your Application" />
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Please review all the information below to make sure it is correct before submitting your application.
            </p>
            
            {/* Organizations */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                Selected Organizations
              </h3>
              <div className="pl-4">
                <ul className="list-disc space-y-1 text-gray-700">
                  {selectedOrgs.map(orgId => {
                    const org = organizations[orgId];
                    return (
                      <li key={orgId} className="flex items-center">
                        <span>{org.name}</span>
                        {!org.workflowImplemented && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            
            {/* Display each section */}
            {reviewSummaries.map(section => (
              <div key={section.id} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  {section.title}
                </h3>
                <div className="space-y-4 pl-4">
                  {section.fields.map(field => (
                    <div key={field.id} className="flex flex-col sm:flex-row">
                      <div className="font-medium text-gray-700 sm:w-1/3 mb-1 sm:mb-0">
                        {field.label}
                      </div>
                      <div className="sm:w-2/3 text-gray-800">
                        {renderFieldValue(field)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Special handling for the "verification" section (final step)
    if (section.id === "verification") {
      // Add a placeholder field so the section isn't empty
      return (
        <div ref={(el) => { sectionRefs.current[sectionIndex] = el; }}>
          <SectionDivider title={section.label} />
          {/* Add a focus trap element that can capture focus but isn't interactive */}
          <div id="focus-trap" tabIndex={-1} style={{ outline: 'none' }}></div>
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Please complete the verification question below and review your application before submitting.
            </p>
          </div>
          
          {/* Render any fields for the verification section */}
          {sectionFields.length > 0 && (
            <div className="mt-6">
              {sectionFields.map(field => (
                <FormInput
                  key={field.id}
                  fieldDefinition={field}
                  name={field.id}
                  register={register}
                  error={errors[field.id]}
                  label={field.label}
                  selectedOrgs={selectedOrgs}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // For regular sections with fields
    return (
      <div ref={(el) => { sectionRefs.current[sectionIndex] = el; }}>
        <SectionDivider title={section.label} />
        
        {sectionFields.map(field => (
          <FormInput
            key={field.id}
            fieldDefinition={field}
            name={field.id}
            register={register}
            error={errors[field.id]}
            label={field.label}
            selectedOrgs={selectedOrgs}
          />
        ))}
      </div>
    );
  };

  // Discard the current draft and reset the form
  const discardDraft = useCallback(() => {
    if (window.confirm('Are you sure you want to discard your draft? This action cannot be undone.')) {
      // Remove from localStorage
      localStorage.removeItem('grantApplicationDraft');
      
      // Reset the form to initial state
      reset({
        organizations: []
      });
      
      // Reset to the first step
      setCurrentStep(0);
      
      // Show notification
      setDraftSaved(false);
      setDraftSaving(false);
      setHasSavedDraft(false);
      
      // If on welcome screen, hide it
      if (showWelcomeStep) {
        setShowWelcomeStep(false);
      }
    }
  }, [reset, showWelcomeStep]);

  // Check if there's currently a draft saved (client-side only)
  const checkForSavedDraft = useCallback(() => {
    if (!isClient) return false; // Only run on client side
    try {
      const savedDraft = localStorage.getItem('grantApplicationDraft');
      return savedDraft && JSON.parse(savedDraft) 
        && JSON.parse(savedDraft).organizations 
        && JSON.parse(savedDraft).organizations.length > 0;
    } catch {
      return false;
    }
  }, [isClient]);

  // Check if there are files in the form that won't be saved in draft
  const checkForFiles = useCallback(() => {
    if (!isClient || typeof FileList === 'undefined') return false;
    const formData = watch();
    return Object.values(formData).some(value => value instanceof FileList && value.length > 0);
  }, [watch, isClient]);

  // Navigation Buttons
  const renderNavigationButtons = () => {
    const hasDraft = checkForSavedDraft();
    const hasFiles = checkForFiles();
    
    return (
      <div className="mt-8 flex flex-col space-y-4">
        {/* reCAPTCHA - only show on the final step */}
        {currentStep === visibleSections.length - 1 && (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center max-w-md">
              <p className="text-sm text-gray-600 mb-4">
                By completing the verification below, you confirm that you have reviewed your application and are ready to submit it.
              </p>
            </div>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
              onChange={handleRecaptchaChange}
              onExpired={() => setRecaptchaToken(null)}
              onError={() => setRecaptchaToken(null)}
            />
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={saveDraft}
              disabled={draftSaving}
              className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
            >
              {draftSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : draftSaved ? (
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Saved!
                </span>
              ) : (
                <span>Save Draft</span>
              )}
            </button>
            
            {/* Discard Draft button - only shown when there's a draft */}
            {hasDraft && (
              <button
                type="button"
                onClick={discardDraft}
                className="py-2 px-4 text-sm text-red-600 hover:text-red-800 hover:underline flex items-center"
              >
                <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Discard Draft
              </button>
            )}
            
            {currentStep < visibleSections.length - 1 ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="py-3 px-6 rounded-lg font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md flex items-center justify-center"
              >
                Next Step
                <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || selectedOrgs.filter(id => organizations[id]?.workflowImplemented).length === 0 || (currentStep === visibleSections.length - 1 && !recaptchaToken)}
                className={`py-4 px-6 text-lg rounded-lg font-medium transition-all duration-200 shadow-sm flex items-center justify-center ${
                  selectedOrgs.filter(id => organizations[id]?.workflowImplemented).length > 0 && (currentStep !== visibleSections.length - 1 || recaptchaToken)
                    ? loading 
                      ? 'bg-blue-400 text-white cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md transform hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span>Submit Application</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render welcome step for users with saved drafts
  const renderWelcomeStep = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
          <p className="text-gray-600">
            We noticed you have a saved draft application. Would you like to continue where you left off or start a new application?
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={loadSavedDraft}
            className="py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Continue Saved Application
          </button>
          
          <button
            type="button"
            onClick={startNewApplication}
            className="py-4 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg shadow transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Start New Application
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
          <button
            type="button"
            onClick={discardDraft}
            className="text-sm text-red-600 hover:text-red-800 hover:underline flex items-center"
          >
            <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Discard Saved Draft
          </button>
        </div>
      </div>
    );
  };

  // Enhanced full-page processing screen with sequential organization processing
  const renderFullPageProcessing = () => {
    // Only show during active processing
    if (!loading || submissionProgress.phase === 'idle') return null;
    
    const timeElapsed = isClient && submissionProgress.startTime 
      ? Math.floor((Date.now() - submissionProgress.startTime) / 1000)
      : 0;
    
    const completedCount = submissionProgress.organizations.filter(org => 
      org.status === 'success' || org.status === 'error'
    ).length;
    
    const progressPercentage = submissionProgress.organizations.length > 0 
      ? (completedCount / submissionProgress.organizations.length) * 100 
      : 0;

    const currentOrgIndex = submissionProgress.currentOrgIndex;
    const currentOrg = submissionProgress.organizations[currentOrgIndex];

    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500 min-h-[500px]">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {submissionProgress.phase === 'preparing' && '⚙️ Preparing Your Application'}
              {submissionProgress.phase === 'submitting' && '🚀 Submitting Your Application'}
              {submissionProgress.phase === 'completed' && '✨ Processing Complete!'}
            </h2>
            
            <p className="text-lg text-gray-600 mb-4">{submissionProgress.message}</p>
            
            {/* Overall Progress Bar */}
            <div className="max-w-md mx-auto mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Progress</span>
                <span>{completedCount}/{submissionProgress.organizations.length} organizations • {Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-4 rounded-full transition-all duration-1000 ease-out shadow-md"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Organizations Processing List */}
          <div className="space-y-3 mb-6">
            {submissionProgress.organizations.map((org, index) => {
              const isCurrent = currentOrgIndex === index;
              const isCompleted = org.status === 'success' || org.status === 'error';
              const isPending = org.status === 'pending';
              const isProcessing = org.status === 'processing';
              
              return (
                <div 
                  key={org.id} 
                  className={`relative flex items-center p-4 rounded-lg border-2 transition-all duration-700 transform ${
                    isProcessing ? 'border-blue-300 bg-blue-50 scale-102 shadow-lg ring-2 ring-blue-100' :
                    org.status === 'success' ? 'border-green-300 bg-green-50 scale-101 shadow-md' :
                    org.status === 'error' ? 'border-red-300 bg-red-50 scale-101 shadow-md' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Current Processing Indicator */}
                  {isCurrent && isProcessing && (
                    <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-12 bg-blue-500 rounded-full animate-pulse shadow-md"></div>
                  )}
                  
                  {/* Status Icon */}
                  <div className={`w-12 h-12 rounded-full mr-4 flex items-center justify-center transition-all duration-500 ${
                    org.status === 'success' ? 'bg-green-500 shadow-md' :
                    org.status === 'error' ? 'bg-red-500 shadow-md' :
                    org.status === 'processing' ? 'bg-blue-500 shadow-md' :
                    'bg-gray-300'
                  }`}>
                    {org.status === 'success' && (
                      <svg className="w-6 h-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                    {org.status === 'error' && (
                      <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    )}
                    {org.status === 'processing' && (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {org.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                    )}
                  </div>
                  
                  {/* Organization Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`text-lg font-semibold transition-all duration-300 ${
                          isCurrent && isProcessing ? 'text-blue-700' :
                          org.status === 'success' ? 'text-green-700' :
                          org.status === 'error' ? 'text-red-700' :
                          'text-gray-600'
                        }`}>
                          {org.name}
                        </h3>
                        
                        <div className={`text-sm font-medium mt-1 transition-all duration-300 ${
                          org.status === 'success' ? 'text-green-600' :
                          org.status === 'error' ? 'text-red-600' :
                          org.status === 'processing' ? 'text-blue-600' :
                          'text-gray-500'
                        }`}>
                          {org.status === 'pending' && (
                            <span className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                              Waiting in queue...
                            </span>
                          )}
                          {org.status === 'processing' && (
                            <span className="flex items-center">
                              <span className="flex mr-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce mr-1 [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce mr-1 [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                              </span>
                              <span className="animate-pulse">Processing submission...</span>
                            </span>
                          )}
                          {org.status === 'success' && (
                            <span className="flex items-center">
                              <span className="text-green-500 mr-2">✅</span>
                              Successfully submitted
                            </span>
                          )}
                          {org.status === 'error' && (
                            <span className="flex items-center">
                              <span className="text-red-500 mr-2">❌</span>
                              Submission failed
                            </span>
                          )}
                        </div>
                        
                        {org.message && isCompleted && (
                          <p className="text-xs text-gray-600 mt-1 bg-white px-2 py-1 rounded-full inline-block">
                            {org.message}
                          </p>
                        )}
                      </div>
                      
                      {/* Position indicator */}
                      <div className="text-right">
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                          isCurrent && isProcessing ? 'bg-blue-200 text-blue-800' :
                          isCompleted ? 'bg-gray-200 text-gray-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {index + 1} of {submissionProgress.organizations.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Footer Information */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div>
                <p className="text-xs text-gray-500">Time Elapsed</p>
                <p className="text-sm font-semibold text-gray-700">{timeElapsed}s</p>
              </div>
              
              <div>
                {submissionProgress.phase === 'submitting' && (
                  <div className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
                    💡 Processing each organization sequentially for maximum reliability
                  </div>
                )}
                
                {submissionProgress.phase === 'completed' && (
                  <div className="text-xs text-green-600 bg-green-50 rounded-lg p-2">
                    🎉 All submissions processed! Preparing final results...
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Estimated Time Remaining</p>
                <p className="text-sm font-semibold text-gray-700">
                  {submissionProgress.phase === 'completed' ? '0s' : 
                   `~${Math.max(0, (submissionProgress.organizations.length - completedCount) * 4)}s`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If currently processing, show only the processing screen
  if (loading && submissionProgress.phase !== 'idle') {
    return renderFullPageProcessing();
  }

  // If the form has been partially submitted, show the partial success message
  if (partiallySubmitted && submissionResults) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg p-8 border-t-4 border-yellow-500">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-yellow-100 p-3 mb-4">
              <svg className="h-12 w-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Partial Submission Complete</h2>
            
            <p className="text-lg text-gray-600 mb-6">
              Your application was submitted to <span className="font-semibold text-green-600">{submissionResults.submissionSummary.successful}</span> of <span className="font-semibold">{submissionResults.submissionSummary.total}</span> organizations.
            </p>
            
            {/* Show detailed results */}
            <div className="w-full max-w-2xl space-y-3 mb-6">
              {submissionResults.submissionSummary.organizationResults.map((orgResult: any) => (
                <div key={orgResult.organizationId} className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  orgResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center">
                    <div className={`rounded-full p-1 mr-3 ${
                      orgResult.success ? 'bg-green-200' : 'bg-red-200'
                    }`}>
                      {orgResult.success ? (
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{orgResult.organizationName}</span>
                      {!orgResult.success && orgResult.error && (
                        <p className="text-xs text-red-600 mt-1">{orgResult.error}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${orgResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {orgResult.success ? 'Submitted' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              {submissionResults.submissionSummary.failed > 0 && (
                <p className="text-sm text-gray-600 mb-4">
                  Don&apos;t worry! You can resubmit to the failed organizations separately if needed. Most organizations accept multiple applications.
                </p>
              )}
              
              <div className="flex gap-4 justify-center">
                <SmartLink href="/" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Return to Home
                </SmartLink>
                <button 
                  onClick={() => window.print()}
                  className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Print Application
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If the form has been submitted successfully, show the success message
  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg p-8 border-t-4 border-green-500">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
            
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your application. We have received your submission and will review it shortly.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <SmartLink href="/" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors">
                Return to Home
              </SmartLink>
              
              <button 
                onClick={() => window.print()}
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg shadow transition-colors"
              >
                Print Application
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If there's a saved draft and we should show the welcome step
  if (showWelcomeStep && hasSavedDraft) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {renderWelcomeStep()}
      </div>
    );
  }

  return (
    <form 
      onSubmit={(e) => {
        // Use the regular handler without confirmation
        return handleSubmit(onSubmit)(e);
      }} 
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Draft loaded notification */}
      {hasSavedDraft && (
        <div className="flex items-center p-4 mb-6 text-sm text-blue-800 rounded-lg bg-blue-50" role="alert">
          <svg className="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd"></path>
          </svg>
          <span className="font-medium">Your draft has been loaded.</span> You can continue where you left off.
        </div>
      )}
      
      {/* Files warning notification */}
      {showFilesWarning && (
        <div className="flex items-center p-4 mb-6 text-sm text-amber-800 rounded-lg bg-amber-50 border border-amber-200" role="alert">
          <svg className="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          <div>
            <span className="font-medium">Files not restored:</span> Your draft has been loaded, but any uploaded files were not saved and will need to be re-uploaded.
          </div>
          <button 
            type="button"
            onClick={() => setShowFilesWarning(false)}
            className="ml-auto -mx-1.5 -my-1.5 bg-amber-50 text-amber-500 rounded-lg focus:ring-2 focus:ring-amber-400 p-1.5 hover:bg-amber-100 inline-flex h-8 w-8"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
      )}
      
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {visibleSections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              onClick={() => goToStep(index)}
              disabled={index > currentStep}
              className={`flex flex-col items-center ${
                index <= currentStep
                  ? 'text-blue-600 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className={`flex items-center justify-center h-8 w-8 rounded-full mb-1 ${
                index < currentStep
                  ? 'bg-blue-600 text-white'
                  : index === currentStep
                    ? 'border-2 border-blue-600 text-blue-600'
                    : 'border-2 border-gray-300 text-gray-400'
              }`}>
                {index < currentStep ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="text-xs hidden sm:block">{section.label}</span>
            </button>
          ))}
        </div>
        
        <div className="relative mt-2">
          <div className="absolute top-1/2 transform -translate-y-1/2 h-0.5 w-full bg-gray-200"></div>
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-300"
            style={{ 
              width: `${(currentStep / (visibleSections.length - 1)) * 100}%` 
            }}
          ></div>
        </div>
      </div>
      
      {/* Form Sections */}
      <div className="bg-white shadow-lg rounded-lg p-8">
        {/* Current Section */}
        {renderFormSection(currentStep)}
        
        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                
                {debugInfo?.validationErrors && (
                  <div className="mt-4 bg-white p-4 rounded-md border border-red-100">
                    <h4 className="font-medium text-red-800 mb-2">Please correct the following fields:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                      {Object.entries(debugInfo.validationErrors).map(([field, message]) => (
                        <li key={field}>
                          <button 
                            type="button"
                            onClick={() => {
                              // Navigate to the appropriate step based on the field
                              for (let i = 0; i < formSections.length; i++) {
                                const section = formSections[i];
                                const sectionFields = getFieldsForSection(section.id, selectedOrgs);
                                
                                // Check if the field is in the current section
                                if (sectionFields.some(f => f.id === field)) {
                                  goToStep(i);
                                  // Use the helper function instead of inline
                                  focusElementByName(field);
                                  break;
                                }
                              }
                            }}
                            className="text-red-700 hover:text-red-900 underline"
                          >
                            {formatFieldName(field)}: {message}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        {renderNavigationButtons()}
      </div>
    </form>
  );
} 