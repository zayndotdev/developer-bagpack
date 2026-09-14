/**
 * ==============================================================================
 * 📍 FILE: src/hooks/useForm.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Custom Hooks Layer -> Reusable Form State & Real-time Validation Hook
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/pages/auth/LoginPage.jsx`
 *   - `src/pages/auth/SignUpPage.jsx`
 *   - `src/pages/auth/ForgotPasswordPage.jsx`
 *   - `src/pages/auth/ResetPasswordPage.jsx`
 *   - `src/pages/settings/ChangePasswordPage.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Eliminates repetitive controlled input boilerplate, tracking field values,
 * touched blur states, and running dynamic validation functions.
 * ==============================================================================
 */

import { useState } from 'react';

export const useForm = (initialValues = {}, validate = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    // If validation function provided, clear error on change if valid
    if (validate) {
      const validationErrors = validate({ ...values, [name]: fieldValue });
      setErrors((prev) => ({
        ...prev,
        [name]: validationErrors[name],
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  };

  const setFieldValue = (name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setFieldError = (name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    setErrors,
    resetForm,
  };
};
