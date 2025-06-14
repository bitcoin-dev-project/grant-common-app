import { UseFormRegister } from 'react-hook-form'
import { FieldDefinition } from '../config/fieldDefinitions'
import organizations from '../config/organizations'
import Image from 'next/image'

interface FormInputProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  required?: boolean;
  description?: string;
  type?: 'text' | 'textarea' | 'email' | 'select' | 'checkbox' | 'file' | 'date';
  placeholder?: string;
  options?: { value: string; label: string }[];
  error?: any;
  disabled?: boolean;
  fieldDefinition?: FieldDefinition;
  selectedOrgs?: string[];
}

export default function FormInput({
  label,
  name,
  register,
  required = false,
  description,
  type = 'text',
  placeholder,
  options,
  error,
  disabled = false,
  fieldDefinition,
  selectedOrgs = []
}: FormInputProps) {
  // If fieldDefinition is provided, use its properties
  const finalLabel = fieldDefinition?.label || label;
  const finalRequired = fieldDefinition?.required ?? required;
  const finalDescription = fieldDefinition?.description || description;
  const finalType = fieldDefinition?.type || type;
  const finalPlaceholder = fieldDefinition?.placeholder || placeholder;
  const finalOptions = fieldDefinition?.options || options;
  
  // Check if this field is specific to certain organizations
  const isOrgSpecific = fieldDefinition?.organizations && fieldDefinition.organizations.length > 0;
  
  // Get the organizations this field is specific to (that are also selected)
  const fieldOrgs = isOrgSpecific && selectedOrgs.length > 0
    ? fieldDefinition!.organizations!.filter(orgId => selectedOrgs.includes(orgId))
    : [];
  
  return (
    <div className="mb-6">
      <label className="block text-gray-700 text-sm font-medium mb-1">
        <div className="flex items-center">
          <span>{finalLabel}</span>
          {finalRequired && <span className="text-red-500 ml-1">*</span>}
          
          {/* Show organization icons for org-specific fields */}
          {isOrgSpecific && fieldOrgs.length > 0 && selectedOrgs.length > 1 && (
            <div className="flex ml-2 space-x-1">
              {fieldOrgs.map(orgId => {
                const org = organizations[orgId];
                return org?.logo ? (
                  <div 
                    key={orgId}
                    className="h-5 w-5 relative rounded-full overflow-hidden border border-gray-200"
                    title={`Required for ${org.name}`}
                  >
                    <Image
                      src={org.logo}
                      alt={`${org.name} logo`}
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      </label>
      
      {finalDescription && (
        <p className="text-sm text-gray-500 mb-2">{finalDescription}</p>
      )}
      
      {finalType === 'textarea' ? (
        <textarea
          {...register(name, { required: finalRequired })}
          placeholder={finalPlaceholder}
          disabled={disabled}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          rows={5}
        />
      ) : finalType === 'select' ? (
        <select
          {...register(name, { required: finalRequired })}
          disabled={disabled}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">(Choose One)</option>
          {finalOptions?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : finalType === 'checkbox' ? (
        <div className="mt-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              {...register(name)}
              disabled={disabled}
              className={`rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
                disabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <span className="ml-2 text-gray-700">Yes</span>
          </label>
        </div>
      ) : finalType === 'date' ? (
        <input
          type="date"
          {...register(name, { required: finalRequired })}
          disabled={disabled}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      ) : finalType === 'file' ? (
        <input
          type="file"
          {...register(name, { required: finalRequired })}
          disabled={disabled}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      ) : (
        <input
          type={finalType}
          {...register(name, { 
            required: finalRequired,
            pattern: finalType === 'email' ? /^\S+@\S+\.\S+$/ : undefined
          })}
          placeholder={finalPlaceholder}
          disabled={disabled}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
  )
} 