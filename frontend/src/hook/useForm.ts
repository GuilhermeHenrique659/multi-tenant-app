import { useState } from "react";

export const useForm = <T extends Record<string, string>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);

  const set = (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }));
  };

  const reset = (newValues?: T) => {
    setValues(newValues ?? initialValues);
  };

  return { values, set, reset, setValues };
};
