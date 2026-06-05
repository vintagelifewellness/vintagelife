"use client";
import React, { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { LockKeyhole, Eye, EyeOff } from 'lucide-react';

// Reusable Password Input Component
const PasswordInput = ({ name, value, onChange, placeholder, show, toggleShow, isSubmitting }) => (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
        <LockKeyhole className="h-5 w-5 text-gray-400" />
      </span>
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition duration-300 ease-in-out text-gray-900 dark:text-gray-100"
        required
        disabled={isSubmitting}
      />
      <button
        type="button"
        onClick={toggleShow}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
);

export default function CFChangePasswordPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (formData.oldPassword === formData.newPassword) {
      toast.error("New password cannot be the same as the old password");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Updating C&F password...");

    try {
   
      const response = await axios.patch("/api/candf/changepassword", {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      toast.success(response.data.message || "C&F Password updated successfully!", { id: toastId });
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update C&F password.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black font-sans p-4">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl">
        <div className="text-center">
          
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Change Password</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Secure your C&F agent account with a new password.
            </p>
        </div>

        <form onSubmit={handlePasswordUpdate} className="mt-8 space-y-6">
          <div className="space-y-4">
             <PasswordInput
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                placeholder="Current Password"
                show={showOldPassword}
                toggleShow={() => setShowOldPassword(!showOldPassword)}
                isSubmitting={isSubmitting}
            />
             <PasswordInput
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="New Password"
                show={showNewPassword}
                toggleShow={() => setShowNewPassword(!showNewPassword)}
                isSubmitting={isSubmitting}
            />
            <PasswordInput
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm New Password"
                show={showConfirmPassword}
                toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                isSubmitting={isSubmitting}
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition duration-300 ease-in-out"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update C&F Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}