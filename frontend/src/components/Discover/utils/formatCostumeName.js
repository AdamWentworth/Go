// utils/formatCostumeName.js

export const formatCostumeName = (name) => {
    return name
      .replace(/_/g, ' ')  // Replace underscores with spaces
      .split(' ')           // Split by spaces to handle multiple words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))  // Capitalize each word
      .join(' ');           // Rejoin the words with spaces
  };
  