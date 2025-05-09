"use client"
import { useState, useRef, useEffect } from 'react'
import { useForm, FieldError, FieldErrorsImpl, Merge } from 'react-hook-form'
import axios from 'axios'
import organizations from '../config/organizations'
import { formSections, getFieldsForSection, getRequiredFieldsBySection, FieldDefinition } from '../config/fieldDefinitions'
import Link from 'next/link'
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

// Section divider component
const SectionDivider = ({ title }: { title: string }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
    <div className="h-1 w-20 bg-blue-500 rounded"></div>
  </div>
);

export default function GrantApplicationForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [draftSaved, setDraftSaved] = useState(false)
  const [draftSaving, setDraftSaving] = useState(false)
  const [readyToSubmit, setReadyToSubmit] = useState(false)
  
  // Define all section refs
  const sectionRefs = formSections.map(() => useRef<HTMLDivElement>(null));
  
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors }
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      organizations: []
    }
  });

  const isFLOSS = watch('free_open_source', false);
  const selectedOrgs = watch('organizations', []) as string[];
  
  // Get required fields based on selected organizations
  const requiredFieldsBySection = getRequiredFieldsBySection(selectedOrgs);
  
  // Next button handler
  const goToNextStep = async () => {
    // Check if current section fields are valid
    const currentRequiredFields = requiredFieldsBySection[currentStep] || [];
    const isStepValid = await trigger(currentRequiredFields);
    
    // For the first step, additionally check if at least one organization is selected
    if (currentStep === 0 && selectedOrgs.length === 0) {
      return; // Don't proceed if no organization is selected
    }
    
    if (isStepValid) {
      // Reset ready to submit when advancing to any step
      setReadyToSubmit(false);
      
      // Update step
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

  // Add a new useEffect to handle special behavior when moving to the Other Info step
  useEffect(() => {
    const lastStep = formSections.length - 1;
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
  }, [currentStep]);
  
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
    
    // Add custom client-side validation logic
    const validationErrors = validateAllFields();
    
    // Check if at least one organization with implemented workflow is selected
    if (!data.organizations.some((orgId: string) => organizations[orgId]?.workflowImplemented === true)) {
      validationErrors.organizations = "Please select at least one available organization";
    }
    
    // Check if there are any validation errors
    if (Object.keys(validationErrors).length > 0) {
      setError("Some required fields are missing or invalid. Please check the form and try again.");
      setDebugInfo({ validationErrors });
      setLoading(false);
      return;
    }
    
    try {
      console.log('Submitting form data:', data);
      
      // Filter out organizations that don't have workflows implemented
      const submittableOrgs = data.organizations.filter(
        (orgId: string) => organizations[orgId]?.workflowImplemented === true
      );
      
      const response = await axios.post('/api/submit', {
        organizations: submittableOrgs,
        application: data
      });
      
      console.log('API response:', response.data);
      
      if (response.data.success) {
        setSubmitted(true);
        // Store any debug info received
        if (response.data.data) {
          setDebugInfo(response.data.data);
        }
      } else {
        setError(response.data.message || 'Failed to submit application');
        if (response.data.error) {
          setDebugInfo(response.data.error);
        }
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.response?.data?.error || error.message || 'An error occurred');
      if (error.response?.data) {
        setDebugInfo(error.response.data);
      }
    } finally {
      setLoading(false);
    }
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
                  onClick={(e) => {
                    if (!isWorkflowReady) {
                      e.preventDefault();
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

  // Render form sections dynamically based on the selected organizations
  const renderFormSection = (sectionIndex: number) => {
    const section = formSections[sectionIndex];
    if (!section) return null;
    
    // Get fields for this section based on selected organizations
    const sectionFields = getFieldsForSection(section.id, selectedOrgs);
    
    // Special handling for organization selector
    if (section.id === 'organization') {
      return (
        <div ref={sectionRefs[sectionIndex]}>
          <SectionDivider title={section.label} />
          <OrganizationSelector />
        </div>
      );
    }
    
    // Skip sections with no fields for the selected organizations
    if (sectionFields.length === 0) {
      // If the current step has no fields, go to the previous step
      // This prevents landing on an empty step that would only show a submit button
      if (section.id === "other") {
        // Add a placeholder field so the section isn't empty
        return (
          <div ref={sectionRefs[sectionIndex]}>
            <SectionDivider title={section.label} />
            {/* Add a focus trap element that can capture focus but isn't interactive */}
            <div id="focus-trap" tabIndex={-1} style={{ outline: 'none' }}></div>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Please review your application and click submit when you're ready.
              </p>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={readyToSubmit}
                  onChange={() => setReadyToSubmit(!readyToSubmit)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">I have reviewed my application and I'm ready to submit</span>
              </label>
            </div>
          </div>
        );
      }
      return null;
    }
    
    return (
      <div ref={sectionRefs[sectionIndex]}>
        <SectionDivider title={section.label} />
        {section.id === "other" && (
          // Add a focus trap for the normal case too
          <div id="focus-trap" tabIndex={-1} style={{ outline: 'none' }}></div>
        )}
        
        {sectionFields.map(field => (
          <FormInput
            key={field.id}
            fieldDefinition={field}
            name={field.id}
            register={register}
            error={errors[field.id]}
            label={field.label}
          />
        ))}
      </div>
    );
  };

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
              <Link href="/" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors">
                Return to Home
              </Link>
              
              <button 
                onClick={() => window.print()}
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg shadow transition-colors"
              >
                Print Application
              </button>
            </div>
            
            {debugInfo && (
              <div className="mt-8 w-full">
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-700 mb-2">Submission Details:</h3>
                  <pre className="text-xs text-left overflow-auto p-2 bg-white border border-gray-200 rounded">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form 
      onSubmit={(e) => {
        // Check if we're on the last step - if so, require explicit confirmation
        if (currentStep === formSections.length - 1 && !window.confirm("Are you ready to submit your application?")) {
          e.preventDefault();
          return false;
        }
        // Otherwise, use the regular handler
        return handleSubmit(onSubmit)(e);
      }} 
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {formSections.map((section, index) => (
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
              width: `${(currentStep / (formSections.length - 1)) * 100}%` 
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
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between items-center">
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
                disabled={loading || !isFLOSS || selectedOrgs.filter(id => organizations[id]?.workflowImplemented).length === 0 || (currentStep === formSections.length - 1 && !readyToSubmit)}
                className={`py-4 px-6 text-lg rounded-lg font-medium transition-all duration-200 shadow-sm flex items-center justify-center ${
                  isFLOSS && selectedOrgs.filter(id => organizations[id]?.workflowImplemented).length > 0 && (currentStep !== formSections.length - 1 || readyToSubmit)
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
    </form>
  );
} 