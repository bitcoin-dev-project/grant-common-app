"use client"
import { useState, useRef, useEffect } from 'react'
import { useForm, UseFormRegister } from 'react-hook-form'
import axios from 'axios'
import organizations from '../config/organizations'
import Link from 'next/link'
import Image from 'next/image'

type FormData = {
  organizations: string[];
  project_name: string;
  email: string;
  your_name: string;
  main_focus: string;
  short_description: string;
  potential_impact: string;
  website?: string;
  github?: string;
  personal_github?: string;
  free_open_source: boolean;
  license: string;
  duration: string;
  timelines: string;
  commitment: string;
  proposed_budget: string;
  has_received_funding: boolean;
  what_funding?: string;
  are_you_lead: boolean;
  other_lead?: string;
  other_contact?: string;
  references: string;
  bios?: string;
  years_experience?: string;
  anything_else?: string;
  project_focus?: string;
  name?: string;
  pseudonym?: string;
  detailed_description?: string;
  hrf_mission_relation?: string;
  why_fund?: string;
  measure_success?: string;
  project_links?: string;
  is_open_source?: string;
  annual_budget?: string;
  funding_amount?: string;
  funding_usage?: string;
  prior_funding?: string;
  social_media?: string;
}

// Define option type for select inputs
interface SelectOption {
  value: string;
  label: string;
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

// Define the debug info type
type DebugInfo = {
  validationErrors?: Record<string, string>;
  status?: number;
  data?: unknown;
  message?: string;
};

export default function GrantApplicationForm({ preselectedOrgs }: { preselectedOrgs?: string[] }) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [draftSaved, setDraftSaved] = useState(false)
  const [draftSaving, setDraftSaving] = useState(false)
  
  // Define all section refs
  const organizationRef = useRef<HTMLDivElement>(null)
  const projectDetailsRef = useRef<HTMLDivElement>(null)
  const sourceCodeRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const budgetRef = useRef<HTMLDivElement>(null)
  const applicantRef = useRef<HTMLDivElement>(null)
  const referencesRef = useRef<HTMLDivElement>(null)
  const otherInfoRef = useRef<HTMLDivElement>(null)
  
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      organizations: preselectedOrgs || [],
      project_name: "",
      email: "",
      your_name: "",
      main_focus: "",
      short_description: "",
      potential_impact: "",
      website: "",
      github: "",
      personal_github: "",
      free_open_source: false,
      license: "",
      duration: "",
      timelines: "",
      commitment: "",
      proposed_budget: "",
      has_received_funding: false,
      what_funding: "",
      are_you_lead: false,
      other_lead: "",
      other_contact: "",
      references: "",
      bios: "",
      years_experience: "",
      anything_else: "",
      project_focus: "",
      name: "",
      pseudonym: "",
      detailed_description: "",
      hrf_mission_relation: "",
      why_fund: "",
      measure_success: "",
      project_links: "",
      is_open_source: "",
      annual_budget: "",
      funding_amount: "",
      funding_usage: "",
      prior_funding: "",
      social_media: ""
    },
  });

  const isFLOSS = watch('free_open_source', false)
  const selectedOrgs = watch('organizations', [])
  
  // Check if specific organizations are selected
  const isHRFSelected = selectedOrgs.includes('hrf')
  const isOpenSatsSelected = selectedOrgs.includes('opensats')
  
  // Define form sections
  const formSections = [
    { id: "organization", label: "Organization", ref: organizationRef },
    { id: "project", label: "Project Details", ref: projectDetailsRef },
    { id: "source", label: "Source Code", ref: sourceCodeRef },
    { id: "timeline", label: "Timeline", ref: timelineRef },
    { id: "budget", label: "Budget", ref: budgetRef },
    { id: "applicant", label: "Applicant", ref: applicantRef },
    { id: "references", label: "References", ref: referencesRef },
    { id: "other", label: "Other Info", ref: otherInfoRef }
  ];
  
  // Required fields by section and organization
  const requiredFieldsBySection = {
    0: ['organizations'],
    1: isOpenSatsSelected 
       ? ['main_focus', 'project_name', 'short_description', 'potential_impact'] 
       : isHRFSelected 
         ? ['project_focus', 'project_name', 'detailed_description', 'short_description'] 
         : ['project_name'],
    2: isOpenSatsSelected 
       ? ['free_open_source', 'license'] 
       : isHRFSelected 
         ? ['is_open_source', 'project_links'] 
         : [],
    3: isOpenSatsSelected 
       ? ['duration', 'timelines', 'commitment'] 
       : [],
    4: isOpenSatsSelected 
       ? ['proposed_budget'] 
       : isHRFSelected 
         ? ['annual_budget', 'funding_amount', 'funding_usage', 'prior_funding'] 
         : [],
    5: isOpenSatsSelected 
       ? ['your_name', 'email'] 
       : isHRFSelected 
         ? ['name', 'email', 'pseudonym', 'social_media'] 
         : ['email'],
    6: isOpenSatsSelected || isHRFSelected ? ['references'] : [],
    7: []
  };
  
  // Next button handler
  const goToNextStep = async () => {
    // Check if current section fields are valid
    const currentRequiredFields = requiredFieldsBySection[currentStep as keyof typeof requiredFieldsBySection];
    const isStepValid = await trigger(currentRequiredFields as (keyof FormData)[]);
    
    // For the first step, additionally check if at least one organization is selected
    if (currentStep === 0 && selectedOrgs.length === 0) {
      return; // Don't proceed if no organization is selected
    }
    
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, formSections.length - 1));
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

  // Load saved draft data if available
  useEffect(() => {
    const savedDraft = localStorage.getItem('grantApplicationDraft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        // Reset form with saved data
        // Note: In a real implementation, you would use the reset method from useForm
        console.log('Found saved draft', draftData);
      } catch (e) {
        console.error('Error loading draft', e);
      }
    }
  }, []);
  
  // Save current form data as draft
  const saveDraft = () => {
    setDraftSaving(true);
    
    try {
      const formData = watch();
      localStorage.setItem('grantApplicationDraft', JSON.stringify({
        ...formData,
        lastStep: currentStep
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
  };

  // Add a validateAllFields function to check all required fields
  const validateAllFields = () => {
    const data = watch();
    const missingFields: Record<string, string> = {};
    
    // Check all required fields
    Object.entries(requiredFieldsBySection).forEach(([, fieldList]) => {
      fieldList.forEach(field => {
        const key = field as keyof FormData;
        
        if (key === 'organizations') {
          if (!data.organizations || data.organizations.length === 0) {
            missingFields.organizations = "Please select at least one organization";
          }
        } else if (!data[key]) {
          missingFields[key] = "This field is required";
        }
      });
    });
    
    return missingFields;
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    setDebugInfo(null)
    
    try {
      console.log('Submitting form data:', data);
      
      // Prepare submission results for all selected organizations
      const submissionResults: Record<string, any> = {}
      let hasError = false
      
      // Submit to each selected organization
      for (const orgId of data.organizations) {
        if (organizations[orgId]?.workflowImplemented) {
          try {
            const response = await axios.post('/api/submit', {
              organizations: [orgId],
              application: data
            })
            
            console.log(`API response for ${orgId}:`, response.data);
            
            if (response.data.success) {
              submissionResults[orgId] = { success: true, data: response.data.data };
            } else {
              submissionResults[orgId] = { success: false, error: response.data.error || response.data.message };
              hasError = true;
            }
          } catch (error: any) {
            console.error(`Error submitting to ${orgId}:`, error);
            submissionResults[orgId] = { 
              success: false, 
              error: error.response?.data?.error || error.message || 'An error occurred' 
            };
            hasError = true;
          }
        }
      }
      
      // Set the overall submission status
      if (hasError) {
        setError('There were issues with one or more organization submissions');
        setDebugInfo(submissionResults);
      } else {
        setSubmitted(true);
        setDebugInfo(submissionResults);
      }
    } catch (error: any) {
      console.error('Error in form submission:', error);
      setError(error.message || 'An unexpected error occurred');
      if (error.response?.data) {
        setDebugInfo(error.response.data);
      }
    } finally {
      setLoading(false);
    }
  }

  // FormInput component props type
  interface FormInputProps {
    label: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    register: UseFormRegister<FormData>;
    name: keyof FormData;
    error?: {
      message?: string;
    };
    description?: string;
    options?: SelectOption[] | null;
  }

  // Create a custom input component for consistent styling
  const FormInput = ({ 
    label, 
    required = false, 
    type = "text", 
    placeholder = "", 
    register, 
    name, 
    error, 
    description, 
    options = null 
  }: FormInputProps) => {
    const inputClasses = "w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-3 focus:outline-none bg-white text-gray-900";
    const [charCount, setCharCount] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    
    // Character limits for different textarea types
    const getCharLimit = () => {
      if (name === 'short_description') return 2000;
      if (name === 'potential_impact') return 2000;
      if (name === 'timelines') return 1500;
      if (name === 'proposed_budget') return 1500;
      if (name === 'references') return 1000;
      if (name === 'bios') return 1000;
      if (name === 'anything_else') return 1000;
      return 1000; // Default
    };
    
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
    };
    
    return (
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <label className="block text-gray-800 font-medium text-base">
            {label} {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {type === "textarea" && (
            <span className={`text-xs ${charCount > getCharLimit() ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              {charCount}/{getCharLimit()} characters
            </span>
          )}
        </div>
        
        {description && (
          <p className="text-gray-600 text-sm mb-3">{description}</p>
        )}
        
        {options ? (
          <div className="relative">
            <select 
              className={`${inputClasses} appearance-none pr-10 ${
                error ? 'border-red-500 bg-red-50 focus:ring-red-200' : 
                isFocused ? 'border-blue-500 focus:ring-blue-100' : 
                'border-gray-300 hover:border-gray-400'
              }`} 
              {...register(name, { required })}
              aria-invalid={error ? "true" : "false"}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            >
              {options.map((option: SelectOption) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        ) : type === "textarea" ? (
          <div className="relative">
            <textarea 
              className={`${inputClasses} min-h-[120px] ${
                error ? 'border-red-500 bg-red-50 focus:ring-red-200' : 
                isFocused ? 'border-blue-500 focus:ring-blue-100' : 
                'border-gray-300 hover:border-gray-400'
              }`} 
              rows={5}
              placeholder={placeholder}
              maxLength={getCharLimit() + 100} // Allow a small buffer over the limit
              {...register(name, { 
                required, 
                maxLength: getCharLimit() + 100,
                onChange: handleTextareaChange
              })}
              aria-invalid={error ? "true" : "false"}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            ></textarea>
            {charCount > getCharLimit() && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-md">
                Limit exceeded
              </div>
            )}
          </div>
        ) : type === "checkbox" ? (
          <div className={`flex items-center p-3 rounded-lg border transition-colors ${
            error ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}>
            <input
              type="checkbox"
              id={`checkbox-${name}`}
              className={`h-5 w-5 rounded border-gray-300 transition-colors ${
                error ? 'text-red-600 focus:ring-red-500' : 'text-blue-600 focus:ring-blue-500'
              }`}
              {...register(name, { required })}
              aria-invalid={error ? "true" : "false"}
            />
            <label htmlFor={`checkbox-${name}`} className="ml-3 text-gray-700 cursor-pointer">{placeholder || label}</label>
          </div>
        ) : (
          <input 
            type={type} 
            className={`${inputClasses} ${
              error ? 'border-red-500 bg-red-50 focus:ring-red-200' : 
              isFocused ? 'border-blue-500 focus:ring-blue-100' : 
              'border-gray-300 hover:border-gray-400'
            }`} 
            placeholder={placeholder}
            {...register(name, { required: required })}
            aria-invalid={error ? "true" : "false"}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        )}
        
        {error && (
          <div className="mt-2 flex items-start text-red-600">
            <svg className="h-5 w-5 flex-shrink-0 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">{error.message || "This field is required"}</p>
          </div>
        )}
      </div>
    );
  };

  const SectionDivider = ({ title }: { title: string }) => (
    <div className="mb-8 mt-12">
      <div className="flex items-center">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <div className="ml-4 flex-grow h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
      </div>
    </div>
  );

  // Get active organizations for the dropdown
  const activeOrgs = Object.values(organizations).filter(org => org.active);
  
  // Options for dropdown fields
  const focusOptions = [
    { value: "", label: "(Choose One)" },
    { value: "core", label: "Bitcoin Core" },
    { value: "education", label: "Education" },
    { value: "layer1", label: "Layer1 / Bitcoin" },
    { value: "layer2", label: "Layer2 / Lightning" },
    { value: "eCash", label: "Layer3 / eCash" },
    { value: "nostr", label: "Nostr" },
    { value: "other", label: "Other" }
  ];
  
  const durationOptions = [
    { value: "12 months", label: "12 months" },
    { value: "9 months", label: "9 months" },
    { value: "6 months", label: "6 months" },
    { value: "3 months", label: "3 months" },
    { value: "Other", label: "Other (please elaborate below)" }
  ];
  
  const commitmentOptions = [
    { value: "100%", label: "100% - Full Time" },
    { value: "75%", label: "75% - Part Time" },
    { value: "50%", label: "50% - Part Time" },
    { value: "25%", label: "25% - Side Project" }
  ];

  // The progress tracker component
  const ProgressTracker = () => {
    return (
      <div className="py-4 px-2 mb-8 bg-white rounded-lg shadow-sm">
        <div className="relative flex items-center justify-between max-w-full overflow-x-auto hide-scrollbar pb-2">
          {/* Progress bar */}
          <div className="absolute h-1 bg-gray-200 top-4 left-0 right-0 z-0"></div>
          <div 
            className="absolute h-1 bg-blue-500 top-4 left-0 z-0 transition-all duration-300"
            style={{ width: `${(currentStep / (formSections.length - 1)) * 100}%` }}
          ></div>
          
          {/* Step indicators */}
          {formSections.map((section, index) => (
            <div 
              key={section.id} 
              className={`relative z-10 flex flex-col items-center px-2 min-w-fit ${
                index === currentStep 
                  ? 'text-blue-600' 
                  : index < currentStep 
                    ? 'text-blue-600' 
                    : 'text-gray-400'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  // Only allow navigation to completed steps or current step
                  if (index <= currentStep) {
                    goToStep(index);
                  }
                }}
                className={`flex items-center justify-center h-8 w-8 rounded-full mb-1 transition-colors ${
                  index === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : index < currentStep
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                } ${index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                disabled={index > currentStep}
              >
                {index < currentStep ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>
              <span className="text-xs whitespace-nowrap">{section.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Create a custom checkbox component for organization selection
  const OrganizationSelector = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5">
          {activeOrgs.map(org => {
            const isWorkflowReady = org.workflowImplemented !== false;
            
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
                <label className={`flex items-center ${!isWorkflowReady ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="flex-shrink-0 w-24 h-24 flex items-center justify-center bg-white border-r border-gray-200 p-3">
                    {org.logo ? (
                      <Image 
                        src={org.logo} 
                        alt={`${org.name} logo`} 
                        className="max-h-full max-w-full object-contain"
                        width={80}
                        height={80}
                        onError={(e) => {
                          // On error, replace with org initial
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.classList.add('bg-blue-100');
                            e.currentTarget.parentElement.innerHTML = `<span class="text-blue-700 text-3xl font-bold">${org.name.charAt(0)}</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="text-blue-700 text-3xl font-bold">{org.name.charAt(0)}</span>
                    )}
                  </div>
                  
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
            <p className="text-sm">{errors.organizations.message || "Please select at least one organization"}</p>
          </div>
        )}
        
        {selectedOrgs.some(orgId => organizations[orgId]?.workflowImplemented === false) && (
          <p className="mt-3 text-xs text-gray-500 italic">
            Note: Organizations marked with &quot;Coming Soon&quot; are coming soon and will not receive your application yet.
          </p>
        )}
      </div>
    );
  };

  // Set preselected organizations on mount if provided
  useEffect(() => {
    if (preselectedOrgs && preselectedOrgs.length > 0) {
      setValue('organizations', preselectedOrgs);
    }
  }, [preselectedOrgs, setValue]);

  if (submitted) {
    return (
      <div className="bg-green-50 p-8 rounded-lg border border-green-200 shadow-sm animate-fadeIn">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-green-800 mb-4">Application Submitted!</h2>
          <div className="h-1 w-16 bg-green-500 mx-auto mb-4 rounded-full"></div>
        </div>
        
        <div className="space-y-4 text-center">
          <p className="text-green-800 text-lg">
            Thank you for submitting your grant application. We have received your information and 
            will review it as soon as possible.
          </p>
          <p className="text-green-700">
            A confirmation email has been sent to the email address you provided. You may be contacted 
            during the review process if additional information is needed.
          </p>
          
          <div className="mt-8 pt-6 border-t border-green-200">
            <Link href="/" className="inline-flex items-center text-green-700 hover:text-green-900 font-medium transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Return to Home
            </Link>
          </div>
        </div>
        
        {debugInfo && (
          <div className="mt-8 p-4 bg-white rounded-md border border-green-200 overflow-auto max-h-60">
            <details>
              <summary className="font-medium text-green-800 cursor-pointer hover:underline mb-2">Response Details (Debug)</summary>
              <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto">
      <ProgressTracker />
      
      {/* Organization Selection - Step 0 */}
      {currentStep === 0 && (
        <div ref={organizationRef}>
          <SectionDivider title="Organization Selection" />
          
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <label className="block text-gray-800 font-medium text-base">
                Choose Organization <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <p className="text-gray-600 text-sm mb-4">Select one or more organizations to apply to. Organizations marked with &quot;Coming Soon&quot; will be available in the future.</p>
            
            <OrganizationSelector />
          </div>
        </div>
      )}

      {/* Project Details - Step 1 */}
      {currentStep === 1 && (
        <div ref={projectDetailsRef}>
          <SectionDivider title="Project Details" />
          
          {/* Focus field - show either OpenSats or HRF version but not both */}
          {(isOpenSatsSelected || isHRFSelected) && (
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <label className="block text-gray-800 font-medium text-base">
                  {isHRFSelected && !isOpenSatsSelected 
                    ? "What is your project area of focus?" 
                    : "Main Focus"} <span className="text-red-500 ml-1">*</span>
                </label>
                
                {/* Show organization indicators for HRF-specific field */}
                {isHRFSelected && !isOpenSatsSelected && (
                  <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                    <span className="font-medium mr-1">HRF</span>
                    {organizations.hrf.logo && (
                      <Image 
                        src={organizations.hrf.logo} 
                        alt="HRF logo" 
                        width={16} 
                        height={16} 
                        className="inline-block"
                      />
                    )}
                  </div>
                )}
                
                {/* Show organization indicators for OpenSats-specific field */}
                {isOpenSatsSelected && !isHRFSelected && (
                  <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                    <span className="font-medium mr-1">OpenSats</span>
                    {organizations.opensats.logo && (
                      <Image 
                        src={organizations.opensats.logo} 
                        alt="OpenSats logo" 
                        width={16} 
                        height={16} 
                        className="inline-block"
                      />
                    )}
                  </div>
                )}
                
                {/* Show multiple organizations if both selected */}
                {isOpenSatsSelected && isHRFSelected && (
                  <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                    <span className="font-medium mr-1">Required by</span>
                    <div className="flex space-x-1">
                      {organizations.opensats.logo && (
                        <Image 
                          src={organizations.opensats.logo} 
                          alt="OpenSats logo" 
                          width={16} 
                          height={16} 
                          className="inline-block"
                        />
                      )}
                      {organizations.hrf.logo && (
                        <Image 
                          src={organizations.hrf.logo} 
                          alt="HRF logo" 
                          width={16} 
                          height={16} 
                          className="inline-block"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-3">
                {isHRFSelected && !isOpenSatsSelected
                  ? "" 
                  : "In which area will your project have the most impact?"}
              </p>
              
              {isHRFSelected && !isOpenSatsSelected ? (
                <div className="relative">
                  <select 
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-3 focus:outline-none bg-white text-gray-900 appearance-none pr-10 ${
                      errors.project_focus ? 'border-red-500 bg-red-50 focus:ring-red-200' : 
                      'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                    {...register("project_focus", { required: true })}
                    aria-invalid={errors.project_focus ? "true" : "false"}
                  >
                    <option value="">Select an option</option>
                    <option value="Lightning Network">Lightning Network</option>
                    <option value="Bitcoin Core">Bitcoin Core</option>
                    <option value="Nostr">Nostr</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-3 focus:outline-none bg-white text-gray-900 appearance-none pr-10 ${
                      errors.main_focus ? 'border-red-500 bg-red-50 focus:ring-red-200' : 
                      'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                    {...register("main_focus", { required: true })}
                    aria-invalid={errors.main_focus ? "true" : "false"}
                  >
                    <option value="">(Choose One)</option>
                    <option value="core">Bitcoin Core</option>
                    <option value="education">Education</option>
                    <option value="layer1">Layer1 / Bitcoin</option>
                    <option value="layer2">Layer2 / Lightning</option>
                    <option value="eCash">Layer3 / eCash</option>
                    <option value="nostr">Nostr</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              
              {((errors.main_focus && isOpenSatsSelected) || (errors.project_focus && isHRFSelected)) && (
                <div className="mt-2 flex items-start text-red-600">
                  <svg className="h-5 w-5 flex-shrink-0 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">This field is required</p>
                </div>
              )}
            </div>
          )}
          
          {/* Project Name - common field for both orgs */}
          <FormInput
            label={isHRFSelected && !isOpenSatsSelected ? "What is your project name?" : "Project Name"}
            description={!isHRFSelected ? "The name of the project. Abbreviations are fine too." : ""}
            required={true}
            register={register}
            name="project_name"
            error={errors.project_name}
          />
          
          {/* Detailed description - HRF only */}
          {isHRFSelected && (
            <div className="relative">
              <FormInput
                label="Please provide a detailed project description."
                required={isHRFSelected}
                type="textarea"
                register={register}
                name="detailed_description"
                placeholder="Provide a comprehensive description of your project, including its purpose, functionality, and implementation details."
                error={errors.detailed_description}
              />
              {/* HRF indicator */}
              <div className="absolute top-0 right-0 flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                <span className="font-medium mr-1">HRF</span>
                {organizations.hrf.logo && (
                  <Image 
                    src={organizations.hrf.logo} 
                    alt="HRF logo" 
                    width={16} 
                    height={16} 
                    className="inline-block"
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Short description - common field with different labels */}
          <FormInput
            label={isHRFSelected && !isOpenSatsSelected
              ? "Please provide a short project description in 1-2 sentences." 
              : "Project Description"}
            description={isHRFSelected && !isOpenSatsSelected
              ? "This will help us understand and explain your project in a concise manner" 
              : "A great description will help us to evaluate your project more quickly."}
            required={true}
            type="textarea"
            register={register}
            name="short_description"
            error={errors.short_description}
            placeholder="Provide a clear and concise description of your project, including its purpose, who it serves, and what problem it solves."
          />
          
          {/* Potential Impact - OpenSats only */}
          {isOpenSatsSelected && (
            <div className="relative">
              <FormInput
                label="Potential Impact"
                description="Why is this project important to Bitcoin or the broader free and open-source community?"
                required={isOpenSatsSelected}
                type="textarea"
                register={register}
                name="potential_impact"
                error={errors.potential_impact}
                placeholder="Describe how your project will benefit the Bitcoin ecosystem or open-source community. Include potential use cases, user base, and long-term impact."
              />
              {/* OpenSats indicator */}
              <div className="absolute top-0 right-0 flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                <span className="font-medium mr-1">OpenSats</span>
                {organizations.opensats.logo && (
                  <Image 
                    src={organizations.opensats.logo} 
                    alt="OpenSats logo" 
                    width={16} 
                    height={16} 
                    className="inline-block"
                  />
                )}
              </div>
            </div>
          )}
          
          {/* HRF specific fields */}
          {isHRFSelected && (
            <>
              <div className="relative">
                <FormInput
                  label="How does your project relate to HRF's mission?"
                  required={isHRFSelected}
                  type="textarea"
                  register={register}
                  name="hrf_mission_relation"
                  placeholder="Explain how your project aligns with HRF's mission of promoting human rights and civil liberties"
                  error={errors.hrf_mission_relation}
                />
                {/* HRF indicator */}
                <div className="absolute top-0 right-0 flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                  <span className="font-medium mr-1">HRF</span>
                  {organizations.hrf.logo && (
                    <Image 
                      src={organizations.hrf.logo} 
                      alt="HRF logo" 
                      width={16} 
                      height={16} 
                      className="inline-block"
                    />
                  )}
                </div>
              </div>
              
              <div className="relative">
                <FormInput
                  label="Why should HRF fund your project?"
                  required={isHRFSelected}
                  type="textarea"
                  register={register}
                  name="why_fund"
                  placeholder="Explain the impact and importance of your project and why it deserves funding"
                  error={errors.why_fund}
                />
                {/* HRF indicator */}
                <div className="absolute top-0 right-0 flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                  <span className="font-medium mr-1">HRF</span>
                  {organizations.hrf.logo && (
                    <Image 
                      src={organizations.hrf.logo} 
                      alt="HRF logo" 
                      width={16} 
                      height={16} 
                      className="inline-block"
                    />
                  )}
                </div>
              </div>
              
              <div className="relative">
                <FormInput
                  label="How do you measure success of your project?"
                  required={isHRFSelected}
                  type="textarea"
                  register={register}
                  name="measure_success"
                  placeholder="Describe the metrics, milestones, or outcomes that will indicate your project's success"
                  error={errors.measure_success}
                />
                {/* HRF indicator */}
                <div className="absolute top-0 right-0 flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                  <span className="font-medium mr-1">HRF</span>
                  {organizations.hrf.logo && (
                    <Image 
                      src={organizations.hrf.logo} 
                      alt="HRF logo" 
                      width={16} 
                      height={16} 
                      className="inline-block"
                    />
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Website - OpenSats only */}
          {isOpenSatsSelected && (
            <div className="relative">
              <FormInput
                label="Project Website"
                description="If you have a website or a project page, please provide the URL."
                register={register}
                name="website"
                placeholder="https://"
                error={errors.website}
              />
              {/* OpenSats indicator */}
              <div className="absolute top-0 right-0 flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                <span className="font-medium mr-1">OpenSats</span>
                {organizations.opensats.logo && (
                  <Image 
                    src={organizations.opensats.logo} 
                    alt="OpenSats logo" 
                    width={16} 
                    height={16} 
                    className="inline-block"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Source Code - Step 2 */}
      {currentStep === 2 && (
        <div ref={sourceCodeRef}>
          <SectionDivider title="Source Code" />
          
          {/* GitHub repository - we combine both OpenSats and HRF versions */}
          {(isOpenSatsSelected || isHRFSelected) && (
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <label className="block text-gray-800 font-medium text-base">
                  {isHRFSelected && !isOpenSatsSelected 
                    ? "Please list your project Github, project social media accounts, and project websites if applicable" 
                    : "Repository Information"}
                </label>
                
                {/* Show organization indicators */}
                <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                  <span className="font-medium mr-1">
                    {isOpenSatsSelected && isHRFSelected 
                      ? "Required by" 
                      : isHRFSelected 
                        ? "HRF" 
                        : "OpenSats"}
                  </span>
                  <div className="flex space-x-1">
                    {isOpenSatsSelected && organizations.opensats.logo && (
                      <Image 
                        src={organizations.opensats.logo} 
                        alt="OpenSats logo" 
                        width={16} 
                        height={16} 
                        className="inline-block"
                      />
                    )}
                    {isHRFSelected && organizations.hrf.logo && (
                      <Image 
                        src={organizations.hrf.logo} 
                        alt="HRF logo" 
                        width={16} 
                        height={16} 
                        className="inline-block"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {!isHRFSelected || isOpenSatsSelected ? (
                // OpenSats version - simple text input
                <input 
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-3 focus:outline-none bg-white text-gray-900 ${
                    errors.github ? 'border-red-500 bg-red-50 focus:ring-red-200' : 
                    'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                  {...register("github")}
                  aria-invalid={errors.github ? "true" : "false"}
                  placeholder="https://github.com/your-project"
                />
              ) : (
                // HRF version - textarea for multiple links
                <textarea 
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-3 focus:outline-none bg-white text-gray-900 min-h-[120px] ${
                    errors.project_links ? 'border-red-500 bg-red-50 focus:ring-red-200' : 
                    'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                  {...register("project_links")}
                  aria-invalid={errors.project_links ? "true" : "false"}
                  placeholder="GitHub: https://github.com/your-project&#10;Website: https://your-project.com&#10;Twitter: @yourproject"
                  rows={5}
                ></textarea>
              )}
              
              {((errors.github && isOpenSatsSelected) || (errors.project_links && isHRFSelected)) && (
                <div className="mt-2 flex items-start text-red-600">
                  <svg className="h-5 w-5 flex-shrink-0 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">This field is required</p>
                </div>
              )}
            </div>
          )}
          
          {/* Open Source status - combine both org versions */}
          {(isOpenSatsSelected || isHRFSelected) && (
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <label className="block text-gray-800 font-medium text-base">
                  Is the project Free and Open Source? <span className="text-red-500 ml-1">*</span>
                </label>
                
                {/* Show organization indicators */}
                <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                  <span className="font-medium mr-1">
                    {isOpenSatsSelected && isHRFSelected 
                      ? "Required by" 
                      : isHRFSelected 
                        ? "HRF" 
                        : "OpenSats"}
                  </span>
                  <div className="flex space-x-1">
                    {isOpenSatsSelected && organizations.opensats.logo && (
                      <Image 
                        src={organizations.opensats.logo} 
                        alt="OpenSats logo" 
                        width={16} 
                        height={16} 
                        className="inline-block"
                      />
                    )}
                    {isHRFSelected && organizations.hrf.logo && (
                      <Image 
                        src={organizations.hrf.logo} 
                        alt="HRF logo" 
                        width={16} 
                        height={16} 
                        className="inline-block"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {!isHRFSelected || isOpenSatsSelected ? (
                // OpenSats version - checkbox
                <div className={`flex items-center p-3 rounded-lg border transition-colors ${
                  errors.free_open_source ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}>
                  <input
                    type="checkbox"
                    id="checkbox-free_open_source"
                    className={`h-5 w-5 rounded border-gray-300 transition-colors ${
                      errors.free_open_source ? 'text-red-600 focus:ring-red-500' : 'text-blue-600 focus:ring-blue-500'
                    }`}
                    {...register("free_open_source", { required: isOpenSatsSelected })}
                    aria-invalid={errors.free_open_source ? "true" : "false"}
                  />
                  <label htmlFor="checkbox-free_open_source" className="ml-3 text-gray-700 cursor-pointer">
                    Yes, this project is Free and Open Source
                  </label>
                </div>
              ) : (
                // HRF version - dropdown
                <div className="relative">
                  <select 
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-3 focus:outline-none bg-white text-gray-900 appearance-none pr-10 ${
                      errors.is_open_source ? 'border-red-500 bg-red-50 focus:ring-red-200' : 
                      'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                    {...register("is_open_source", { required: isHRFSelected })}
                    aria-invalid={errors.is_open_source ? "true" : "false"}
                  >
                    <option value="">Select an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="N/A">N/A</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              
              {((errors.free_open_source && isOpenSatsSelected) || (errors.is_open_source && isHRFSelected)) && (
                <div className="mt-2 flex items-start text-red-600">
                  <svg className="h-5 w-5 flex-shrink-0 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">This field is required</p>
                </div>
              )}
            </div>
          )}
          
          {/* License field - OpenSats only */}
          {isOpenSatsSelected && (
            <div className="relative">
              <FormInput
                label="Open-Source License"
                description="Projects must have a proper open-source license & educational materials must be available to the public under a free and open license."
                required={isOpenSatsSelected}
                register={register}
                name="license"
                error={errors.license}
              />
              {/* OpenSats indicator */}
              <div className="absolute top-0 right-0 flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                <span className="font-medium mr-1">OpenSats</span>
                {organizations.opensats.logo && (
                  <Image 
                    src={organizations.opensats.logo} 
                    alt="OpenSats logo" 
                    width={16} 
                    height={16} 
                    className="inline-block"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline - Step 3 */}
      {currentStep === 3 && (
        <div ref={timelineRef}>
          <SectionDivider title="Project Timeline" />
          
          <FormInput
            label="Duration"
            description="Duration of grant you are applying for"
            required={true}
            register={register}
            name="duration"
            error={errors.duration}
            options={durationOptions}
          />
          
          <FormInput
            label="Project Timeline and Potential Milestones"
            description="This will help us evaluate overall scope and potential grant duration."
            required={true}
            type="textarea"
            register={register}
            name="timelines"
            error={errors.timelines}
            placeholder="List key milestones with estimated completion dates. For example: &apos;Month 1: Research phase completed&apos;, &apos;Month 3: Alpha version released&apos;, etc."
          />
          
          <FormInput
            label="Time Commitment"
            description="How much time are you going to commit to the project?"
            required={true}
            register={register}
            name="commitment"
            error={errors.commitment}
            options={commitmentOptions}
          />
        </div>
      )}

      {/* Budget - Step 4 */}
      {currentStep === 4 && (
        <div ref={budgetRef}>
          <SectionDivider title="Project Budget" />
          
          {isOpenSatsSelected && (
            <>
              <FormInput
                label="Costs & Proposed Budget"
                description="Current or estimated costs of the project. Please submit a proposed budget (in USD) around how much funding you are requesting and how it will be used."
                required={isOpenSatsSelected}
                type="textarea"
                register={register}
                name="proposed_budget"
                error={errors.proposed_budget}
                placeholder="Break down your budget needs in detail (e.g., development costs, hardware, hosting, etc.). Specify how much funding you are requesting in USD and provide justification for each expense."
              />
              
              <FormInput
                label="Has this project received any prior funding?"
                type="checkbox"
                register={register}
                name="has_received_funding"
                error={errors.has_received_funding}
              />
              
              <FormInput
                label="If so, please describe."
                register={register}
                name="what_funding"
                error={errors.what_funding}
              />
            </>
          )}
          
          {isHRFSelected && (
            <>
              <FormInput
                label="What is your annual project budget?"
                register={register}
                name="annual_budget"
                placeholder="e.g., $50,000"
                error={errors.annual_budget}
                required={isHRFSelected}
              />
              
              <FormInput
                label="How much funding are you hoping to secure with this BDF Grant?"
                required={isHRFSelected}
                register={register}
                name="funding_amount"
                placeholder="e.g., $10,000"
                error={errors.funding_amount}
              />
              
              <FormInput
                label="Please describe what funding will be used towards."
                required={isHRFSelected}
                type="textarea"
                register={register}
                name="funding_usage"
                placeholder="Provide a breakdown of how you plan to use the grant funding"
                error={errors.funding_usage}
              />
              
              <FormInput
                label="Has this project received any prior funding? If yes, please describe."
                type="textarea"
                register={register}
                name="prior_funding"
                placeholder="List any previous funding sources and amounts"
                error={errors.prior_funding}
                required={isHRFSelected}
              />
            </>
          )}
        </div>
      )}

      {/* Applicant Details - Step 5 */}
      {currentStep === 5 && (
        <div ref={applicantRef}>
          <SectionDivider title="Applicant Details" />
          
          {isOpenSatsSelected && (
            <FormInput
              label="Your Name"
              description="Feel free to use your nym."
              required={isOpenSatsSelected}
              register={register}
              name="your_name"
              placeholder="John Doe"
              error={errors.your_name}
            />
          )}
          
          {isHRFSelected && (
            <>
              <FormInput
                label="What is your name?"
                description="Please let us know the name you want use to use for public reference."
                required={isHRFSelected}
                register={register}
                name="name"
                placeholder="Enter your name"
                error={errors.name}
              />
              
              <FormInput
                label="Do you use/prefer a pseudonym?"
                register={register}
                name="pseudonym"
                options={[
                  { value: "Yes", label: "Yes" },
                  { value: "No", label: "No" }
                ]}
                error={errors.pseudonym}
                description="If you select No, we will use your real name in public reference to the grant."
                required={isHRFSelected}
              />
            </>
          )}
          
          <FormInput
            label="Email"
            required={true}
            type="email"
            register={register}
            name="email"
            placeholder="satoshin@gmx.com"
            error={errors.email}
          />
          
          {isHRFSelected && (
            <FormInput
              label="What are your social media handles?"
              type="textarea"
              register={register}
              name="social_media"
              placeholder="Twitter: @yourhandle\nNostr: npub...\nOther platforms..."
              error={errors.social_media}
            />
          )}
          
          {isOpenSatsSelected && (
            <>
              <FormInput
                label="Are you the Project Lead / Lead Contributor?"
                type="checkbox"
                register={register}
                name="are_you_lead"
                error={errors.are_you_lead}
              />
              
              <FormInput
                label="If someone else, please list the project's Lead Contributor or Maintainer"
                register={register}
                name="other_lead"
                error={errors.other_lead}
              />
              
              <FormInput
                label="Personal Github (or similar, if applicable)"
                register={register}
                name="personal_github"
                error={errors.personal_github}
              />
              
              <FormInput
                label="Other Contact Details (if applicable)"
                description="Please list any other relevant contact details you are comfortable sharing in case we need to reach out with questions. These could include nostr pubkeys, social media handles, etc."
                type="textarea"
                register={register}
                name="other_contact"
                error={errors.other_contact}
              />
            </>
          )}
        </div>
      )}

      {/* References - Step 6 */}
      {currentStep === 6 && (
        <div ref={referencesRef}>
          <SectionDivider title="References" />
          
          <FormInput
            label={isHRFSelected 
              ? "Please list the name + email of two references we can contact regarding your project." 
              : "References"}
            description={isHRFSelected 
              ? "Alternatively have references email letters of recommendation to bdf@hrf.org with your project name + the reference's name" 
              : "Please provide names and contact information for people familiar with your work who can vouch for your skills and reliability."}
            required={isOpenSatsSelected || isHRFSelected}
            type="textarea"
            register={register}
            name="references"
            error={errors.references}
            placeholder="1. Name: John Doe\n   Email: john@example.com\n\n2. Name: Jane Smith\n   Email: jane@example.com"
          />
          
          {isOpenSatsSelected && (
            <>
              <FormInput
                label="Team Members' Bios"
                description="Short biographies of key contributors to the project. Include relevant experience and skills."
                type="textarea"
                register={register}
                name="bios"
                error={errors.bios}
              />
              
              <FormInput
                label="Years of Experience"
                description="How many years have you been working in this field or on similar projects?"
                register={register}
                name="years_experience"
                error={errors.years_experience}
              />
            </>
          )}
        </div>
      )}

      {/* Other Info - Step 7 */}
      {currentStep === 7 && (
        <div ref={otherInfoRef}>
          <SectionDivider title="Anything Else We Should Know?" />
          
          <FormInput
            label={isHRFSelected 
              ? "Feel free to provide any other information you would like us to know." 
              : "Feel free to share whatever else might be important."}
            type="textarea"
            register={register}
            name={isHRFSelected ? "additional_info" as keyof FormData : "anything_else"}
            error={isHRFSelected ? (errors as any).additional_info : errors.anything_else}
          />
          
          <div className="mt-6 mb-8 p-5 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-gray-600 text-sm">
                {selectedOrgs.length > 1 
                  ? "You've selected multiple organizations. Your application will be submitted to each organization you've selected." 
                  : "Each organization has its own grant agreement and terms. By submitting this application, you agree to the terms and conditions of the selected organization."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step navigation buttons */}
      <div className="mt-8 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex space-x-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={goToPreviousStep}
              className="py-3 px-6 rounded-lg font-medium transition-all duration-200 border border-gray-300 flex justify-center items-center bg-white text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
          )}
          
          <button
            type="button"
            onClick={saveDraft}
            disabled={draftSaving}
            className={`py-3 px-6 rounded-lg font-medium transition-all duration-200 border border-gray-300 flex justify-center items-center ${
              draftSaving 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : draftSaved
                  ? 'bg-green-50 text-green-700 border-green-300' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {draftSaving ? (
              <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : draftSaved ? (
              <>
                <svg className="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Saved
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
                Save
              </>
            )}
          </button>
        </div>
        
        {/* Next or Submit button */}
        {currentStep < formSections.length - 1 ? (
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
            disabled={loading || !isFLOSS || selectedOrgs.filter(id => organizations[id]?.workflowImplemented).length === 0}
            className={`py-4 px-6 text-lg rounded-lg font-medium transition-all duration-200 shadow-sm flex items-center justify-center ${
              isFLOSS && selectedOrgs.filter(id => organizations[id]?.workflowImplemented).length > 0
                ? loading 
                  ? 'bg-blue-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </div>
            ) : (
              <>
                Submit Application
                <svg className="inline-block ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 bg-red-50 p-6 rounded-lg border border-red-200 text-red-800 animate-fadeIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 w-full">
              <h3 className="text-lg font-medium text-red-800">Submission Error</h3>
              <p className="mt-2 text-red-700">{error}</p>

              {/* Display validation errors if present */}
              {debugInfo && debugInfo.validationErrors && (
                <div className="mt-4 bg-white p-4 rounded-md border border-red-100">
                  <h4 className="font-medium text-red-800 mb-2">Please correct the following fields:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                    {Object.entries(debugInfo.validationErrors).map(([field, message]) => (
                      <li key={field}>
                        <button 
                          type="button"
                          onClick={() => {
                            // Navigate to the appropriate step based on the field
                            for (let i = 0; i < Object.keys(requiredFieldsBySection).length; i++) {
                              const stepFields = requiredFieldsBySection[i as keyof typeof requiredFieldsBySection];
                              // Check if the field is in the current step's required fields
                              const fieldKey = field as keyof FormData;
                              if (stepFields.some(f => f === fieldKey)) {
                                goToStep(i);
                                // Wait for render then focus the field
                                setTimeout(() => {
                                  const element = document.getElementsByName(field)[0];
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    element.focus();
                                  }
                                }, 100);
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
              
              {/* Show other debug info if present */}
              {debugInfo && !debugInfo.validationErrors && (
                <details className="mt-4">
                  <summary className="text-sm font-medium text-red-800 cursor-pointer hover:underline">Technical Details</summary>
                  <div className="mt-2 p-4 bg-white rounded-md border border-red-100 overflow-auto max-h-60">
                    <pre className="text-xs text-gray-700">{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
} 