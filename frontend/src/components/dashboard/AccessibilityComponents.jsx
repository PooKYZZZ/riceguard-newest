import React, { useState, useEffect, useRef } from 'react';

// SkipLink Component for keyboard navigation
export const SkipLink = ({ targetId, children }) => (
  <a 
    href={`#${targetId}`} 
    className="skip-link"
    onClick={(e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }}
  >
    {children}
  </a>
);

// FocusTrap Component for modal dialogs
export const FocusTrap = ({ children, isActive = true }) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement;

    // Get all focusable elements within the container
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element
    firstElement.focus();

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleTabKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      
      // Restore focus to the previously focused element
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return (
    <div ref={containerRef} className="focus-trap-container">
      {children}
    </div>
  );
};

// LiveRegion Component for screen reader announcements
export const LiveRegion = ({ politeness = 'polite', children, className }) => {
  return (
    <div 
      className={cn('sr-only', className)}
      aria-live={politeness}
      aria-atomic="true"
    >
      {children}
    </div>
  );
};

// Progress Announcement Component
export const ProgressAnnouncement = ({ 
  currentStep, 
  totalSteps, 
  stepDescription 
}) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);
  
  return (
    <LiveRegion politeness="assertive">
      Step {currentStep} of {totalSteps}: {stepDescription}. {percentage}% complete.
    </LiveRegion>
  );
};

// AccessibleButton Component with proper ARIA support
export const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-rice-primary-600 text-white hover:bg-rice-primary-700 focus:ring-rice-primary-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-rice-primary-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {children}
    </button>
  );
};

// AccessibleForm Component with proper fieldset and legend
export const AccessibleForm = ({
  children,
  onSubmit,
  ariaLabel,
  className,
  ...props
}) => {
  return (
    <form
      onSubmit={onSubmit}
      aria-label={ariaLabel}
      className={cn('space-y-6', className)}
      noValidate
      {...props}
    >
      {children}
    </form>
  );
};

// FormField Component with proper labeling and error handling
export const FormField = ({
  label,
  id,
  error,
  required = false,
  hint,
  children,
  className
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      
      {children && React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': cn(
          errorId,
          hintId
        ),
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required
      })}
      
      {hint && (
        <div id={hintId} className="text-sm text-gray-500">
          {hint}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId}
          className="text-sm text-red-600 font-medium"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};

// AccessibleCheckbox Component
export const AccessibleCheckbox = ({
  label,
  id,
  checked,
  onChange,
  disabled = false,
  required = false,
  error,
  className,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${checkboxId}-error` : undefined;

  return (
    <div className={cn('flex items-start space-x-3', className)}>
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-describedby={errorId}
          aria-invalid={error ? 'true' : 'false'}
          className="h-4 w-4 text-rice-primary-600 focus:ring-rice-primary-500 border-gray-300 rounded disabled:opacity-50"
          {...props}
        />
      </div>
      
      <div className="flex-1">
        <label 
          htmlFor={checkboxId}
          className={cn(
            'text-sm font-medium text-gray-700 cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        
        {error && (
          <div 
            id={errorId}
            className="mt-1 text-sm text-red-600 font-medium"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

// AccessibleSelect Component
export const AccessibleSelect = ({
  label,
  id,
  options,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  className,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <FormField
      label={label}
      id={selectId}
      error={error}
      required={required}
      className={className}
    >
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-describedby={errorId}
        aria-invalid={error ? 'true' : 'false'}
        className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rice-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 min-h-[44px]"
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

// KeyboardMenu Component for accessible dropdown navigation
export const KeyboardMenu = ({
  items,
  buttonLabel,
  className,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          items[focusedIndex].onClick();
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
    }
  };

  return (
    <div 
      ref={menuRef}
      className={cn('relative inline-block text-left', className)}
      onKeyDown={handleKeyDown}
    >
      <AccessibleButton
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        variant="secondary"
        className="flex items-center space-x-2"
      >
        {buttonLabel}
        <svg 
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </AccessibleButton>

      {isOpen && (
        <div 
          className="absolute right-0 z-10 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 focus:outline-none"
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              ref={index === focusedIndex ? (el) => el?.focus() : undefined}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
                setFocusedIndex(-1);
              }}
              className={cn(
                'w-full text-left px-4 py-3 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50',
                index === focusedIndex && 'bg-gray-50'
              )}
              role="menuitem"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Utility function for combining class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export default {
  SkipLink,
  FocusTrap,
  LiveRegion,
  ProgressAnnouncement,
  AccessibleButton,
  AccessibleForm,
  FormField,
  AccessibleCheckbox,
  AccessibleSelect,
  KeyboardMenu
};