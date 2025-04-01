"use client"
import { useState } from 'react'
import { useForm, UseFormRegister } from 'react-hook-form'
import axios from 'axios'
import organizations from '../config/organizations'

type FormData = {
  organization: string;
  project_name: string;
  your_name: string;
  email: string;
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
}

// Define option type for select inputs
interface SelectOption {
  value: string;
  label: string;
}

export default function GrantApplicationForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormData>()

  const isFLOSS = watch('free_open_source', false)
  const selectedOrg = watch('organization', 'opensats')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    setDebugInfo(null)
    
    try {
      console.log('Submitting form data:', data);
      
      const response = await axios.post('/api/submit', {
        organization: data.organization,
        application: {
          ...data,
        }
      })
      
      console.log('API response:', response.data);
      
      if (response.data.success) {
        setSubmitted(true)
        // Store any debug info received
        if (response.data.data) {
          setDebugInfo(response.data.data)
        }
      } else {
        setError(response.data.message || 'Failed to submit application')
        if (response.data.error) {
          setDebugInfo(response.data.error)
        }
      }
    } catch (err: unknown) {
      const error = err as Error & { response?: { status?: number; data?: unknown } }
      console.error('Error submitting form:', error)
      setError('Failed to submit application. Please try again later.')
      
      // Capture any error response details for debugging
      if (error.response) {
        setDebugInfo({
          status: error.response.status,
          data: error.response.data
        })
      } else {
        setDebugInfo({ message: error.message })
      }
    } finally {
      setLoading(false)
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
    const inputClasses = "w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white text-gray-900";
    
    return (
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {description && <p className="text-gray-500 text-sm mb-2">{description}</p>}
        
        {options ? (
          <select 
            className={`${inputClasses} ${error ? 'border-red-500' : 'border-gray-300'}`} 
            {...register(name, { required })}
          >
            {options.map((option: SelectOption) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea 
            className={`${inputClasses} ${error ? 'border-red-500' : 'border-gray-300'}`} 
            rows={4}
            placeholder={placeholder}
            {...register(name, { required })}
          ></textarea>
        ) : type === "checkbox" ? (
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
              {...register(name, { required })}
            />
            <span className="ml-2 text-gray-700">{placeholder}</span>
          </div>
        ) : (
          <input 
            type={type} 
            className={`${inputClasses} ${error ? 'border-red-500' : 'border-gray-300'}`} 
            placeholder={placeholder}
            {...register(name, { required: required })}
          />
        )}
        
        {error && <p className="mt-1 text-red-500 text-sm">{error.message || "This field is required"}</p>}
      </div>
    );
  };

  const SectionDivider = ({ title }: { title: string }) => (
    <div className="mb-8 mt-12">
      <h2 className="text-xl font-bold text-gray-800 pb-2 border-b border-gray-200">{title}</h2>
    </div>
  );

  if (submitted) {
    return (
      <div className="bg-green-50 p-8 rounded-lg border-l-4 border-green-500">
        <div className="flex items-center mb-4">
          <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <h2 className="text-2xl font-bold text-green-800">Application Submitted!</h2>
        </div>
        <p className="text-green-700 mb-6">
          Thank you for submitting your grant application. We have received your information and 
          will review it as soon as possible. You may be contacted during the review process.
        </p>
        
        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200 overflow-auto max-h-60">
            <h3 className="font-bold text-gray-700 mb-2">Response Details (Debug):</h3>
            <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    )
  }

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto">
      <SectionDivider title="Organization Selection" />
      
      <FormInput
        label="Choose Organization"
        required={true}
        register={register}
        name="organization"
        error={errors.organization}
        options={activeOrgs.map(org => ({ value: org.id, label: org.name }))}
      />

      {/* Organization description */}
      {selectedOrg && organizations[selectedOrg] && (
        <div className="mb-8 p-4 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-gray-700 mb-2">{organizations[selectedOrg].description}</p>
          <a 
            href={organizations[selectedOrg].website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center"
          >
            Visit {organizations[selectedOrg].name} website
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
        </div>
      )}

      <SectionDivider title="Project Details" />
      
      <FormInput
        label="Main Focus"
        description="In which area will your project have the most impact?"
        required={true}
        register={register}
        name="main_focus"
        error={errors.main_focus}
        options={focusOptions}
      />
      
      <FormInput
        label="Project Name"
        description="The name of the project. Abbreviations are fine too."
        required={true}
        register={register}
        name="project_name"
        error={errors.project_name}
      />
      
      <FormInput
        label="Project Description"
        description="A great description will help us to evaluate your project more quickly."
        required={true}
        type="textarea"
        register={register}
        name="short_description"
        error={errors.short_description}
      />
      
      <FormInput
        label="Potential Impact"
        description="Why is this project important to Bitcoin or the broader free and open-source community?"
        required={true}
        type="textarea"
        register={register}
        name="potential_impact"
        error={errors.potential_impact}
      />
      
      <FormInput
        label="Project Website"
        description="If you have a website or a project page, please provide the URL."
        register={register}
        name="website"
        placeholder="https://"
        error={errors.website}
      />

      <SectionDivider title="Source Code" />
      
      <FormInput
        label="Repository (GitHub or similar, if applicable)"
        register={register}
        name="github"
        error={errors.github}
      />
      
      <FormInput
        label="Is the project free and open-source?"
        required={true}
        type="checkbox"
        register={register}
        name="free_open_source"
        error={errors.free_open_source}
        placeholder=""
      />
      
      <FormInput
        label="Open-Source License"
        description="Projects must have a proper open-source license & educational materials must be available to the public under a free and open license."
        required={true}
        register={register}
        name="license"
        error={errors.license}
      />

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

      <SectionDivider title="Project Budget" />
      
      <FormInput
        label="Costs & Proposed Budget"
        description="Current or estimated costs of the project. Please submit a proposed budget (in USD) around how much funding you are requesting and how it will be used."
        required={true}
        type="textarea"
        register={register}
        name="proposed_budget"
        error={errors.proposed_budget}
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

      <SectionDivider title="Applicant Details" />
      
      <FormInput
        label="Your Name"
        description="Feel free to use your nym."
        required={true}
        register={register}
        name="your_name"
        placeholder="John Doe"
        error={errors.your_name}
      />
      
      <FormInput
        label="Email"
        required={true}
        type="email"
        register={register}
        name="email"
        placeholder="satoshin@gmx.com"
        error={errors.email}
      />
      
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

      <SectionDivider title="References & Prior Contributions" />
      
      <FormInput
        label="References"
        description="Please list any references from the Bitcoin community or open-source space that we could contact for more information on you or your project."
        required={true}
        type="textarea"
        register={register}
        name="references"
        error={errors.references}
      />
      
      <FormInput
        label="Prior Contributions"
        description="Please list any prior contributions to other open-source or Bitcoin-related projects."
        type="textarea"
        register={register}
        name="bios"
        error={errors.bios}
      />
      
      <FormInput
        label="Years of Developer Experience"
        register={register}
        name="years_experience"
        error={errors.years_experience}
      />

      <SectionDivider title="Anything Else We Should Know?" />
      
      <FormInput
        label="Feel free to share whatever else might be important."
        type="textarea"
        register={register}
        name="anything_else"
        error={errors.anything_else}
      />
      
      <div className="mt-6 mb-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-600 text-sm">
          Each organization has its own grant agreement and terms. By submitting this application,
          you agree to the terms and conditions of the selected organization.
        </p>
      </div>

      <div className="mt-8">
        <button
          type="submit"
          disabled={loading || !isFLOSS}
          className={`w-full py-3 px-6 text-lg rounded-md font-medium transition-colors ${
            isFLOSS
              ? loading 
                ? 'bg-blue-300 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
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
            `Submit Grant Application to ${selectedOrg && organizations[selectedOrg] ? organizations[selectedOrg].name : selectedOrg}`
          )}
        </button>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 p-4 rounded-md border-l-4 border-red-500 text-red-700">
          <div className="flex">
            <svg className="h-6 w-6 text-red-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold">Error:</p>
              <p>{error}</p>
              
              {debugInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200 overflow-auto max-h-60">
                  <p className="font-bold text-gray-700 mb-2">Debug Info:</p>
                  <pre className="text-xs text-gray-700">{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
} 