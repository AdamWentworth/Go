import { useState } from 'react';

const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  // Function to validate inputs
  const validate = (values) => {
    let tempErrors = {};
    if ('username' in values)
      tempErrors.username = values.username ? "" : "Username is required.";

    if ('email' in values)
      tempErrors.email = (/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(values.email)) ? "" : "Email is not valid.";

    if ('password' in values)
      tempErrors.password = values.password.length > 7 ? "" : "Password must be at least 8 characters long.";

    setErrors({
      ...tempErrors
    });

    // Return true if no errors
    return Object.values(tempErrors).every(x => x === "");
  };

  // Handles field value changes
  const handleChange = e => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value
    });
  };

  // Handles form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    if (validate(values)) {
      onSubmit(values);
    }
  };

  return {
    values,
    errors,
    handleChange,
    handleSubmit
  };
};

export default useForm;
