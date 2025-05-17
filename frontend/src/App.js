
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from 'uuid';
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Define the available field types
const FIELD_TYPES = [
  { id: "text", label: "Text Field" },
  { id: "textarea", label: "Text Area" },
  { id: "select", label: "Dropdown" },
  { id: "date", label: "Date" },
  { id: "checkbox", label: "Checkbox" },
  { id: "radio", label: "Radio Buttons" },
  { id: "hidden", label: "Hidden Field" },
];

// Helper to create a new field
const createField = (type, formFields = []) => {
  const fieldCount = formFields.filter(f => f.type === type).length + 1;
  const name = `${type}_${fieldCount}`;
  
  const baseField = {
    id: uuidv4(),
    type,
    label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field ${fieldCount}`,
    name,
    required: false,
    className: "form-control",
    access: false,
    subtype: type === "text" ? "text" : undefined,
    maxlength: type === "text" || type === "textarea" ? 192 : undefined,
    conditions: null
  };
  
  // Add type-specific properties
  if (type === "select" || type === "radio") {
    return {
      ...baseField,
      multiple: false,
      values: [
        { label: "Option 1", value: "option_1", selected: false },
        { label: "Option 2", value: "option_2", selected: false },
      ]
    };
  }
  
  return baseField;
};

// Field Configuration Panel
const FieldConfigPanel = ({ field, updateField, formFields, deleteField }) => {
  const { register, watch, setValue, handleSubmit } = useForm({
    defaultValues: field
  });
  
  const fieldType = watch('type');
  
  // Update field when form changes
  const onFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;
    setValue(name, value);
    
    const updatedField = { ...field, [name]: value };
    updateField(updatedField);
  };
  
  // Add option for select/radio fields
  const addOption = () => {
    const updatedValues = [...(field.values || []), { 
      label: `Option ${(field.values?.length || 0) + 1}`, 
      value: `option_${(field.values?.length || 0) + 1}`,
      selected: false 
    }];
    updateField({ ...field, values: updatedValues });
  };
  
  // Update a specific option
  const updateOption = (index, key, value) => {
    const updatedValues = [...field.values];
    updatedValues[index] = { 
      ...updatedValues[index], 
      [key]: value,
      // If updating the label, also update the value with a simplified version
      ...(key === 'label' ? { value: value.toLowerCase().replace(/\s+/g, '_') } : {})
    };
    updateField({ ...field, values: updatedValues });
  };
  
  // Delete an option
  const deleteOption = (index) => {
    const updatedValues = field.values.filter((_, i) => i !== index);
    updateField({ ...field, values: updatedValues });
  };
  
  // Add a condition
  const addCondition = () => {
    const newCondition = {
      field: formFields[0]?.name || '',
      operator: 'equal',
      value: '',
      condition: 'and'
    };
    
    const currentConditions = field.conditions || [];
    updateField({ 
      ...field, 
      conditions: [...currentConditions, newCondition] 
    });
  };
  
  // Update a condition
  const updateCondition = (index, key, value) => {
    const updatedConditions = [...(field.conditions || [])];
    updatedConditions[index] = { ...updatedConditions[index], [key]: value };
    updateField({ ...field, conditions: updatedConditions });
  };
  
  // Delete a condition
  const deleteCondition = (index) => {
    const updatedConditions = (field.conditions || []).filter((_, i) => i !== index);
    updateField({ ...field, conditions: updatedConditions.length ? updatedConditions : null });
  };
  
  return (
    <div className="property-panel">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Field Properties</h2>
        <button 
          onClick={() => deleteField(field.id)}
          className="btn btn-danger text-sm"
        >
          Delete Field
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Basic properties */}
        <div>
          <label className="form-label">Field Type</label>
          <select 
            className="form-select"
            {...register('type')}
            onChange={onFormChange}
          >
            {FIELD_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="form-label">Label</label>
          <input 
            type="text" 
            className="form-control"
            {...register('label')}
            onChange={onFormChange}
          />
        </div>
        
        <div>
          <label className="form-label">Name (used in API)</label>
          <input 
            type="text" 
            className="form-control"
            {...register('name')}
            onChange={onFormChange}
          />
        </div>
        
        <div className="flex items-center">
          <input 
            type="checkbox" a
            id="required-field"
            className="checkbox-control mr-2"
            {...register('required')}
            onChange={onFormChange}
          />
          <label htmlFor="required-field" className="text-sm font-medium text-gray-900">Required Field</label>
        </div>
        
        {/* Field-specific properties */}
        {(fieldType === 'text' || fieldType === 'textarea') && (
          <div>
            <label className="form-label">Max Length</label>
            <input 
              type="number" 
              className="form-control"
              {...register('maxlength')}
              onChange={onFormChange}
            />
          </div>
        )}
        
        {fieldType === 'text' && (
          <div>
            <label className="form-label">Sub Type</label>
            <select 
              className="form-select"
              {...register('subtype')}
              onChange={onFormChange}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="password">Password</option>
              <option value="tel">Telephone</option>
              <option value="url">URL</option>
            </select>
          </div>
        )}
        
        {/* Select/radio options */}
        {(fieldType === 'select' || fieldType === 'radio') && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="form-label mb-0">Options</label>
              <button 
                type="button" 
                onClick={addOption}
                className="btn btn-secondary text-xs"
              >
                Add Option
              </button>
            </div>
            
            {field.values?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input 
                  type="text" 
                  className="form-control"
                  value={option.label}
                  onChange={(e) => updateOption(index, 'label', e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => deleteOption(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </div>
            ))}
            
            {fieldType === 'select' && (
              <div className="flex items-center mt-2">
                <input 
                  type="checkbox" 
                  id="multiple-select"
                  className="checkbox-control mr-2"
                  {...register('multiple')}
                  onChange={onFormChange}
                />
                <label htmlFor="multiple-select" className="text-sm font-medium text-gray-900">Allow Multiple Selection</label>
              </div>
            )}
          </div>
        )}
        
        {/* Conditional logic */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="form-label mb-0">Conditions</label>
            <button 
              type="button" 
              onClick={addCondition}
              className="btn btn-secondary text-xs"
            >
              Add Condition
            </button>
          </div>
          
          {field.conditions?.map((condition, index) => (
            <div key={index} className="condition-rule">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Condition #{index + 1}</span>
                <button 
                  type="button" 
                  onClick={() => deleteCondition(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="form-label text-xs">If field</label>
                  <select 
                    className="form-select"
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                  >
                    {formFields.map(f => (
                      <option key={f.id} value={f.name}>{f.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="form-label text-xs">Operator</label>
                  <select 
                    className="form-select"
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                  >
                    <option value="equal">Equals</option>
                    <option value="not_equal">Not Equal</option>
                    <option value="contains">Contains</option>
                    <option value="not_contains">Does Not Contain</option>
                    <option value="starts">Starts With</option>
                    <option value="ends">Ends With</option>
                    <option value="greater">Greater Than</option>
                    <option value="less">Less Than</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label text-xs">Value</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  />
                </div>
                
                {index > 0 && (
                  <div>
                    <label className="form-label text-xs">Condition</label>
                    <select 
                      className="form-select"
                      value={condition.condition}
                      onChange={(e) => updateCondition(index, 'condition', e.target.value)}
                    >
                      <option value="and">AND</option>
                      <option value="or">OR</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Form Preview component
const FormPreview = ({ formFields }) => {
  const [evaluatedFields, setEvaluatedFields] = useState(formFields);
  const [formValues, setFormValues] = useState({});
  
  useEffect(() => {
    // For preview, we filter out hidden fields based on conditions
    const visibleFields = formFields.filter(field => {
      if (!field.conditions) return true;
      
      // Evaluate all conditions
      return field.conditions.every(condition => {
        const targetField = formFields.find(f => f.name === condition.field);
        if (!targetField) return true;
        
        const fieldValue = formValues[targetField.name] || '';
        const condValue = condition.value;
        
        switch (condition.operator) {
          case 'equal':
            return fieldValue === condValue;
          case 'not_equal':
            return fieldValue !== condValue;
          case 'contains':
            return fieldValue.includes(condValue);
          case 'not_contains':
            return !fieldValue.includes(condValue);
          case 'starts':
            return fieldValue.startsWith(condValue);
          case 'ends':
            return fieldValue.endsWith(condValue);
          case 'greater':
            return Number(fieldValue) > Number(condValue);
          case 'less':
            return Number(fieldValue) < Number(condValue);
          default:
            return true;
        }
      });
    });
    
    setEvaluatedFields(visibleFields);
  }, [formFields, formValues]);
  
  // Handle field change
  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Form Preview</h2>
      
      <div className="space-y-4">
        {evaluatedFields.map(field => (
          <div key={field.id} className="mb-4">
            {field.type !== 'hidden' && (
              <label className="form-label">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            
            {field.type === 'text' && (
              <input
                type={field.subtype || 'text'}
                name={field.name}
                className={field.className}
                required={field.required}
                maxLength={field.maxlength}
                onChange={handleFieldChange}
              />
            )}
            
            {field.type === 'textarea' && (
              <textarea
                name={field.name}
                className={field.className}
                required={field.required}
                maxLength={field.maxlength}
                onChange={handleFieldChange}
              />
            )}
            
            {field.type === 'select' && (
              <select
                name={field.name}
                className={field.className}
                required={field.required}
                multiple={field.multiple}
                onChange={handleFieldChange}
              >
                {Array.isArray(field.values) 
                  ? field.values.map((option, i) => (
                      <option 
                        key={i} 
                        value={option.value}
                        selected={option.selected}
                      >
                        {option.label}
                      </option>
                    ))
                  : Object.values(field.values || {}).map((option, i) => (
                      <option 
                        key={i} 
                        value={option.value}
                        selected={option.selected}
                      >
                        {option.label}
                      </option>
                    ))
                }
              </select>
            )}
            
            {field.type === 'date' && (
              <input
                type="date"
                name={field.name}
                className={field.className}
                required={field.required}
                onChange={handleFieldChange}
              />
            )}
            
            {field.type === 'checkbox' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name={field.name}
                  id={field.name}
                  className="checkbox-control mr-2"
                  required={field.required}
                  onChange={handleFieldChange}
                />
                <label htmlFor={field.name} className="text-sm">{field.label}</label>
              </div>
            )}
            
            {field.type === 'radio' && (
              <div className="space-y-2">
                {Array.isArray(field.values) 
                  ? field.values.map((option, i) => (
                      <div key={i} className="flex items-center">
                        <input
                          type="radio"
                          name={field.name}
                          id={`${field.name}_${i}`}
                          value={option.value}
                          className="mr-2"
                          required={field.required}
                          onChange={handleFieldChange}
                        />
                        <label htmlFor={`${field.name}_${i}`} className="text-sm">{option.label}</label>
                      </div>
                    ))
                  : Object.values(field.values || {}).map((option, i) => (
                      <div key={i} className="flex items-center">
                        <input
                          type="radio"
                          name={field.name}
                          id={`${field.name}_${i}`}
                          value={option.value}
                          className="mr-2"
                          required={field.required}
                          onChange={handleFieldChange}
                        />
                        <label htmlFor={`${field.name}_${i}`} className="text-sm">{option.label}</label>
                      </div>
                    ))
                }
              </div>
            )}
            
            {field.type === 'hidden' && (
              <input
                type="hidden"
                name={field.name}
                value=""
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// JSON Display component
const JsonDisplay = ({ json }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="container mx-auto px-4">
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Form JSON</h2>
          <button 
            className="btn btn-secondary text-sm"
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>
        <div className="overflow-auto">
          <pre className="json-preview text-sm">
            {JSON.stringify(json, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

// Form builder component
const FormBuilder = () => {
  const [formFields, setFormFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [formName, setFormName] = useState('New Form');
  const [activeTab, setActiveTab] = useState('builder');
  const [saveStatus, setSaveStatus] = useState('');
  
  // Get the selected field
  const selectedField = formFields.find(f => f.id === selectedFieldId);
  
  // Functions for manual field reordering
  const moveFieldUp = (index) => {
    if (index === 0) return; // Already at the top
    const newFields = [...formFields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    setFormFields(newFields);
  };
  
  const moveFieldDown = (index) => {
    if (index === formFields.length - 1) return; // Already at the bottom
    const newFields = [...formFields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    setFormFields(newFields);
  };
  
  // Update a field
  const updateField = (updatedField) => {
    const updatedFields = formFields.map(field => 
      field.id === updatedField.id ? updatedField : field
    );
    setFormFields(updatedFields);
  };
  
  // Delete a field
  const deleteField = (fieldId) => {
    setFormFields(formFields.filter(field => field.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };
  
  // Select a field
  const selectField = (fieldId) => {
    setSelectedFieldId(fieldId);
  };
  
  // Generate clean JSON for export (remove internal props like id)
  const generateCleanJson = () => {
    return formFields.map(field => {
      const { id, ...cleanField } = field;
      return cleanField;
    });
  };
  
  // Save form to API
  const saveForm = async () => {
    try {
      setSaveStatus('Saving...');
      
      // This would normally connect to the Laravel API
      // Using placeholder endpoint for now
      await axios.post(`${API}/forms`, {
        name: formName,
        fields: generateCleanJson()
      });
      
      setSaveStatus('Form saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveStatus('Error saving form!');
    }
  };
  
  // Load example form
  const loadExample = () => {
    try {
      // Parse the example JSON from the prompt
      const exampleJson = JSON.parse('[{"type":"select","required":true,"label":"Contact Type","className":"form-control form-select","name":"contact_type","access":false,"multiple":false,"values":{"0":{"label":"Candidate","value":"candidate","selected":false},"1":{"label":"Client","value":"client","selected":true},"4":{"label":"Supplier","value":"supplier","selected":false},"6":{"label":"Test Team","value":"Test Team"},"7":{"label":"Licensee or Franchisee","value":"Licensee or Franchisee"}},"conditions":null},{"type":"select","required":false,"label":"Emerging or Established?","className":"form-control","name":"emerging_or_established","access":false,"subtype":"text","conditions":[{"field":"contact_type","operator":"equal","value":"client","condition":"and"}],"values":[{"label":"Emerging","value":"Emerging"},{"label":"Established","value":"Established"},{"label":"NA","value":"NA"}],"maxlength":192,"default_display_field":true},{"type":"select","required":false,"label":"Doing Coaching","className":"form-control","name":"doing_coaching","access":false,"subtype":"text","conditions":[{"field":"contact_type","operator":"equal","value":"client","condition":"and"}],"values":[{"label":"No","value":"No"},{"label":"Yes","value":"Yes"}],"maxlength":192},{"type":"select","required":false,"label":"Title","className":"form-control","name":"title","access":false,"multiple":false,"values":[{"label":"Mr","value":"Mr","selected":true},{"label":"Miss","value":"Miss","selected":false},{"label":"Mrs","value":"Mrs","selected":false},{"label":"Other","value":"Other","selected":false}]},{"type":"text","required":true,"label":"First Name","className":"form-control","name":"first_name","access":false,"subtype":"text","maxlength":64},{"type":"text","required":true,"label":"Last Name","className":"form-control","name":"last_name","access":false,"subtype":"text","maxlength":64},{"type":"text","required":"","label":"Company","className":"form-control","name":"company","access":false,"subtype":"text","maxlength":191,"conditions":[{"field":"contact_type","operator":"equal","value":"client","condition":"and"}]},{"type":"text","required":false,"label":"Address","className":"form-control","name":"address","access":false,"subtype":"text","maxlength":191},{"type":"text","required":false,"label":"Address2","className":"form-control","name":"address2","access":false,"subtype":"text","maxlength":64},{"type":"text","required":false,"label":"City","className":"form-control","name":"city","access":false,"subtype":"text","maxlength":32},{"type":"select","required":false,"label":"State","className":"form-control","name":"state","access":false,"multiple":false,"values":[{"label":"(AU) New South Wales","value":"(AU) New South Wales","selected":true},{"label":"(AU) Victoria","value":"(AU) Victoria","selected":false},{"label":"(AU) Queensland","value":"(AU) Queensland","selected":false},{"label":"(AU) Australian Capital Territory","value":"(AU) Australian Capital Territory","selected":false},{"label":"(AU) South Australia","value":"(AU) South Australia","selected":false},{"label":"(AU) Northern Territory","value":"(AU) Northern Territory","selected":false},{"label":"(AU) Western Australia","value":"(AU) Western Australia","selected":false},{"label":"(AU) Tasmania","value":"(AU) Tasmania","selected":false},{"label":"Other","value":"Other","selected":false}]},{"type":"text","required":false,"label":"Post Code","className":"form-control","name":"post_code","access":false,"subtype":"text"},{"type":"select","required":false,"label":"Country","className":"form-control","name":"country","access":false,"multiple":false,"values":[{"label":"Australia","value":"Australia","selected":true},{"label":"New Zealand","value":"New Zealand","selected":true},{"label":"Other","value":"Other","selected":true},{"label":"India","value":"india"}],"conditions":null},{"type":"text","subtype":"email","required":true,"label":"Email","className":"form-control","name":"email","access":false,"maxlength":64},{"type":"text","required":false,"label":"SMS Number","className":"form-control","name":"sms_number","access":false,"subtype":"text","maxlength":32,"conditions":null},{"type":"text","required":false,"label":"Office Phone","className":"form-control","name":"office_phone","access":false,"subtype":"text"},{"type":"select","required":false,"label":"Preferred Contact Method","className":"form-control blank-first","name":"preferred_contact_method","access":false,"multiple":false,"values":[{"label":"","value":"","selected":false},{"label":"Email","value":"Email","selected":false},{"label":"Phone","value":"Phone"}],"conditions":[{"field":"contact_type","operator":"equal","value":"client","condition":"and","field_index":-1}]},{"type":"text","required":false,"label":"Website","className":"form-control","name":"website","access":false,"subtype":"text","maxlength":192,"conditions":null},{"type":"select","required":true,"label":"Lead Origin","className":"form-control sort-asc blank-first","name":"lead_origin","access":false,"multiple":false,"values":{"0":{"label":"","value":"","selected":false},"1":{"label":"Franchise Direct","value":"Franchise Direct","selected":false},"2":{"label":"Through Franchisor","value":"Through Franchisor","selected":false},"3":{"label":"Franchise Ready Contact","value":"Franchise Ready Contact","selected":false},"4":{"label":"Businessforsale.com","value":"Businessforsale.com","selected":false},"5":{"label":"AuBizBuySell","value":"AuBizBuySell","selected":false},"6":{"label":"Business for Sale","value":"Business for Sale","selected":false},"7":{"label":"Inside Franchise","value":"Inside Franchise","selected":false},"8":{"label":"Franchise Buyer","value":"Franchise Buyer","selected":false},"9":{"label":"Business and Franchise Sales","value":"Business and Franchise Sales","selected":false},"10":{"label":"Commercial Real Estate","value":"Commercial Real Estate","selected":false},"11":{"label":"Xchange","value":"Xchange","selected":false},"12":{"label":"Database","value":"Database","selected":false},"13":{"label":"AnyBusiness","value":"AnyBusiness","selected":false},"14":{"label":"Seek Business","value":"Seek Business","selected":false},"15":{"label":"Client","value":"Client","selected":false},"16":{"label":"Bsale","value":"Bsale","selected":false},"17":{"label":"Netvision","value":"Netvision","selected":false},"18":{"label":"Business2Sell","value":"Business2Sell","selected":false},"19":{"label":"Website Form","value":"Website Form","selected":false},"20":{"label":"Facebook","value":"Facebook","selected":false},"21":{"label":"Linkedin","value":"Linkedin","selected":false},"22":{"label":"Referral","value":"Referral","selected":false},"23":{"label":"Industry Event","value":"Industry Event","selected":false},"24":{"label":"Eden Exchange","value":"Eden Exchange","selected":false},"25":{"label":"Franchising Expo","value":"Franchising Expo","selected":false},"26":{"label":"Franchise Business","value":"Franchise Business","selected":false},"29":{"label":"Franchisor Website","value":"Franchisor Website"},"30":{"label":"Previous CRM","value":"Previous CRM"},"31":{"label":"EDM","value":"EDM"},"32":{"label":"Allbiz Lilegy","value":"Allbiz Lilegy"},"33":{"label":"Scorecard","value":"Scorecard"},"34":{"label":"Legalvision","value":"Legalvision"},"35":{"label":"LinkedIn Campaign ","value":"linkedin-campaign"},"36":{"label":"GFA","value":"GFA"},"37":{"label":"Unknown","value":"unknown"},"38":{"label":"International Expo","value":"international-expo"},"39":{"label":"Internal Referral","value":"internal-referral"}},"sort_option":"asc","conditions":null},{"type":"textarea","required":false,"label":"Note","className":"form-control","name":"note","access":false,"subtype":"text","maxlength":192,"conditions":[{"field":"lead_origin","operator":"equal","value":"Previous CRM"}]},{"type":"date","required":false,"label":"Contact Date","className":"form-control","name":"contact_date","access":false},{"type":"select","required":false,"label":"Reason for Contact","className":"form-control contact_type-client sort-asc blank-first","name":"reason_for_contact","access":false,"multiple":false,"values":[{"label":"","value":"","selected":false},{"label":"Coaching","value":"Coaching","selected":false},{"label":"Become a Franchisor","value":"Become a Franchisor","selected":false},{"label":"Become a Franchisee","value":"Become a Franchisee","selected":false},{"label":"Established Franchisor","value":"Established Franchisor","selected":false},{"label":"Other","value":"Other","selected":false},{"label":"Business Buyer","value":"Business Buyer"}],"sort_option":"asc","conditions":[{"field":"contact_type","operator":"equal","value":"client","condition":"and","field_index":-1}]},{"type":"text","required":false,"label":"Message","className":"form-control contact_type-client","name":"message","access":false,"subtype":"text","conditions":[{"field":"contact_type","operator":"equal","value":"client","condition":"and","field_index":-1}]},{"type":"text","required":false,"label":"Original Lead Owner","className":"form-control contact-type_candidate","name":"original_lead_owner","access":false,"subtype":"text"},{"type":"select","required":false,"label":"Recruitment Sales Stage","className":"form-control  contact_type-candidate","name":"recruitment_sales_stage","access":false,"multiple":false,"values":{"0":{"label":"New lead","value":"new-lead","selected":false},"2":{"label":"Info Sent","value":"info-sent","selected":false},"3":{"label":"Follow Up","value":"follow-up","selected":false},"4":{"label":"Discussed Opportunity","value":"discussed-opportunity","selected":false},"5":{"label":"Called and Left Message","value":"called-left-message","selected":false},"6":{"label":"Application Received","value":"application-received","selected":false},"7":{"label":"Internally Interviewed","value":"internally-interviewed","selected":false},"8":{"label":"Franchisor Interviewed","value":"franchisor-interviewed","selected":false},"19":{"label":"Franchisor Meeting","value":"franchisor-meeting"},"20":{"label":"LOI Issued","value":"loi-issued"},"21":{"label":"LOI signed\/Deposit Paid","value":"loi-signed\/deposit-paid"},"22":{"label":"Awaiting Site\/Territory","value":"awaiting-site\/territory"},"23":{"label":"Not Interested","value":"not-interested"},"24":{"label":"Not Suitable","value":"not-suitable"},"25":{"label":"Could Not Contact","value":"could-not-contact"},"26":{"label":"Revisit Lead","value":"revisit-lead"},"27":{"label":"Submitted Incorrectly","value":"submitted-incorrectly"},"28":{"label":"Sold","value":"sold"}},"conditions":[{"field":"contact_type","operator":"equal","value":"candidate","condition":"and","field_index":-1}]},{"type":"select","required":false,"label":"Client Sales Stage","className":"form-control  contact_type-client","name":"client_sales_stage","access":false,"multiple":false,"values":[{"label":"Whiteboard Session Booked","value":"whiteboard-session-booked","selected":false},{"label":"Proposal Sent","value":"proposal-sent","selected":false},{"label":"Follow up required","value":"follow-up-required","selected":false},{"label":"Signed Proposal Received","value":"signed-proposal-received","selected":false},{"label":"Deposit Paid","value":"deposit-paid","selected":false},{"label":"Not Proceeding","value":"not-proceeding","selected":false},{"label":"Active","value":"active","selected":false},{"label":"Inactive","value":"inactive","selected":false},{"label":"New Prospect","value":"new-prospect","selected":false},{"label":"Contacted ","value":"contacted"},{"label":"Could Not Contact ","value":"could-not-contact"},{"label":"Not Suitable","value":"not-suitable"}],"conditions":[{"field":"contact_type","operator":"equal","value":"client","condition":"and","field_index":-1}]},{"type":"select","required":false,"label":"Franchisee\/Licensee Sales Stage","className":"form-control","name":"franchiseelicensee_sales_stage","access":false,"subtype":"text","conditions":[{"field":"contact_type","operator":"equal","value":"Licensee orFranchisee","condition":"and"}],"values":[{"label":"New Lead","value":"New Lead"},{"label":"Called and Left Message","value":"Called and Left Message"},{"label":"Contacted ","value":"Contacted "},{"label":"Info Sent","value":"Info Sent"},{"label":"Follow Up","value":"Follow Up"},{"label":"Application Received ","value":"Application Received"},{"label":"Interviewed","value":"Interviewed"},{"label":"LOI Issued","value":"LOI Issued"},{"label":"LOI Signed\/Deposit Received ","value":"LOI Signed\/Deposit Received "},{"label":"Not Interested","value":"Not Interested"},{"label":"Not Suitable ","value":"Not Suitable "},{"label":"Revisit Lead","value":"Revisit Lead"},{"label":"Active","value":"Active"}],"maxlength":192},{"type":"select","required":false,"label":"Company Interest","className":"form-control sort-asc blank-first","name":"company_interest","access":false,"multiple":true,"values":{"0":{"label":"","value":"","selected":false},"2":{"label":"BCMC","value":"BCMC","selected":false},"3":{"label":"FRG","value":"FRG","selected":false},"4":{"label":"Fat Jaks","value":"Fat Jaks","selected":false},"10":{"label":"Skill Samurai","value":"Skill Samurai","selected":false},"16":{"label":"Piccolo Me","value":"Piccolo Me","selected":false},"26":{"label":"Ninja Kids ","value":"Ninja Kids","selected":false},"30":{"label":"Degani","value":"Degani"},"33":{"label":"Carvn It Up","value":"Carvn It Up"},"35":{"label":"Urban Clean","value":"Urban Clean"},"37":{"label":"Zeus Street Greek","value":"Zeus Street Greek"},"38":{"label":"Franchise Ready","value":"Franchise Ready"},"39":{"label":"Soccajoeys","value":"Soccajoeys"},"40":{"label":"RWR","value":"RWR"},"41":{"label":"Mannys Diner","value":"Mannys Diner"},"42":{"label":"Snap Print Solutions","value":"Snap Print Solutions"},"43":{"label":"SpudBAR","value":"SpudBAR"},"44":{"label":"Harrys Schnitzel Joint ","value":"Harrys Schnitzel Joint"},"45":{"label":"Rashays","value":"Rashays"},"46":{"label":"Yogurtland","value":"Yogurtland"},"47":{"label":"Le Pain Quotidien","value":"Le Pain Quotidien"},"48":{"label":"Cocoon SDA ","value":"Cocoon SDA"},"49":{"label":"Bungee Fitness","value":"Bungee Fitness"},"50":{"label":"Lunch in a Box","value":"lunch-in-a-box"},"51":{"label":"Boulangerie De France","value":"boulangerie-de-france"},"52":{"label":"Choice Sushi","value":"choice-sushi"},"53":{"label":"World Options","value":"world-options"},"54":{"label":"Milk Flower","value":"milk-flower"},"55":{"label":"Sol Bowl","value":"sol-bowl"},"56":{"label":"Various Food","value":"various-food"},"57":{"label":"Hashtag Burgers & Waffles","value":"hashtag-burgers&-waffles"},"59":{"label":"Punch Love","value":"punch-love"},"60":{"label":"Kebab Nation","value":"kebab-nation"},"61":{"label":"Delhi Rolls Junction","value":"delhi-rolls-junction"}},"sort_option":"asc","conditions":[{"field":"contact_type","operator":"equal","value":"candidate","condition":"and","field_index":-1},{"field":"contact_type","operator":"equal","value":"business_buyers","condition":"or","field_index":-1}]},{"type":"text","required":false,"label":"Linkedin URL","className":"form-control","name":"linkedin_url","access":false,"subtype":"text","conditions":null,"values":null,"maxlength":192},{"type":"hidden","required":false,"label":"EdenExchange Tracking ID","className":"form-control","name":"edenexchange_tracking_id","access":false,"subtype":"text","conditions":null,"values":null,"maxlength":192},{"type":"hidden","required":false,"label":"business_to_sell_advert_id","className":"form-control","name":"business_to_sell_advert_id","access":false,"subtype":"text","conditions":null,"values":null,"maxlength":192}]');
      
      // Add ID to each field
      const fieldsWithIds = exampleJson.map(field => ({
        ...field,
        id: uuidv4()
      }));
      
      setFormFields(fieldsWithIds);
      setFormName('Contact Information Form');
      setSaveStatus('Example form loaded');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error loading example:', error);
      setSaveStatus('Error loading example!');
    }
  };
  
  // Load form from JSON text
  const loadFromJson = () => {
    try {
      const jsonText = prompt('Paste your JSON form configuration:');
      if (!jsonText) return;
      
      const parsedJson = JSON.parse(jsonText);
      
      // Add ID to each field
      const fieldsWithIds = parsedJson.map(field => ({
        ...field,
        id: uuidv4()
      }));
      
      setFormFields(fieldsWithIds);
      setSaveStatus('Form loaded from JSON');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error loading from JSON:', error);
      setSaveStatus('Error loading JSON! Check format.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="text-2xl font-bold text-gray-900 bg-transparent border-0 focus:ring-0 focus:border-b-2 focus:border-blue-500"
            />
            {saveStatus && (
              <span className="ml-4 text-sm font-medium text-green-600">
                {saveStatus}
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadExample}
              className="btn btn-secondary"
            >
              Load Example
            </button>
            <button
              onClick={loadFromJson}
              className="btn btn-secondary"
            >
              Import JSON
            </button>
            <button
              onClick={saveForm}
              className="btn btn-primary"
            >
              Save Form
            </button>
          </div>
        </div>
        
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            <button
              className={`tab ${activeTab === 'builder' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('builder')}
            >
              Form Builder
            </button>
            <button
              className={`tab ${activeTab === 'preview' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
            <button
              className={`tab ${activeTab === 'json' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('json')}
            >
              JSON
            </button>
          </div>
        </div>
        
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Available Fields</h2>
                <p className="text-gray-500 text-sm mb-4">Click buttons below to add fields to your form</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.map((fieldType) => (
                    <button
                      key={fieldType.id}
                      className="btn btn-secondary text-sm py-2"
                      onClick={() => {
                        const newField = createField(fieldType.id, formFields);
                        setFormFields([...formFields, newField]);
                        setSelectedFieldId(newField.id);
                      }}
                    >
                      {fieldType.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Form Actions</h2>
                <button 
                  className="w-full btn btn-primary mb-2"
                  onClick={loadExample}
                >
                  Load Example Form
                </button>
                <button 
                  className="w-full btn btn-secondary"
                  onClick={loadFromJson}
                >
                  Import from JSON
                </button>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Form Layout</h2>
                
                <div className="form-area">
                  {formFields.length === 0 && (
                    <div className="text-center text-gray-500 py-10">
                      <p>Click on field buttons to add fields to your form</p>
                      <p className="text-sm mt-2 text-gray-400">Fields can be reordered using the up/down buttons</p>
                    </div>
                  )}
                  
                  {formFields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`field-item ${selectedFieldId === field.id ? 'selected-field' : ''}`}
                      onClick={() => selectField(field.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="mr-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                moveFieldUp(index);
                              }}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                              ↑
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                moveFieldDown(index);
                              }}
                              disabled={index === formFields.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                              ↓
                            </button>
                          </div>
                          <div>
                            <span className="font-medium">{field.label}</span>
                            <span className="text-xs text-gray-500 ml-2">({field.type})</span>
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {field.conditions && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              Conditional
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-1">
              {selectedField ? (
                <FieldConfigPanel 
                  field={selectedField} 
                  updateField={updateField}
                  formFields={formFields}
                  deleteField={deleteField}
                />
              ) : (
                <div className="property-panel">
                  <p className="text-gray-500">Select a field to configure its properties</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'preview' && (
          <FormPreview formFields={formFields} />
        )}
        
        {activeTab === 'json' && (
          <JsonDisplay json={generateCleanJson()} />
        )}
      </div>
    </div>
  );
};

// Main App component
function App() {
  return (
    <div className="App">
      <div className="navbar">
        <h1 className="text-xl font-bold">Form Builder</h1>
      </div>
      <FormBuilder />
    </div>
  );
}

export default App;
