"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function CnfStock({ dscode }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [masterProducts, setMasterProducts] = useState([]);
  const [newProductIndex, setNewProductIndex] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);

  // OTP / lock
  const [unlocked, setUnlocked] = useState(false);
  const [editToken, setEditToken] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // ---- Fetch ----
  const fetchStock = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `/api/c&f/get-demands/stockcheck/${dscode}`
      );
      if (response.data.success) {
        setStock(response.data.data?.productDetails || []);
      } else {
        setError(response.data.message || "Failed to fetch stock");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch C&F stock");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterProducts = async () => {
    try {
      const response = await axios.get(`/api/Product/Product/fetch/1`);
      if (response.data.success) {
        setMasterProducts(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch master products", err);
    }
  };

  useEffect(() => {
    if (dscode) {
      fetchStock();
      fetchMasterProducts();
    }
  }, [dscode]);

  // ---- Auto-lock countdown ----
  useEffect(() => {
    if (!unlocked) {
      setSecondsLeft(0);
      return;
    }
    setSecondsLeft(5 * 60);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setUnlocked(false);
          setEditToken("");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [unlocked]);

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ---- Mutations (no auth header, no guard per your request) ----
  const handleQuantityChange = (index, value) => {
    if (!unlocked) return;
    const newStock = [...stock];
    newStock[index].quantity = value;
    setStock(newStock);
  };

  const updateQuantity = async (product, quantity) => {
    if (!unlocked) return;
    try {
      setActionLoading(true);
      const response = await axios.put(
        `/api/c&f/get-demands/stockcheck/${dscode}`,
        { action: "UPDATE_QUANTITY", product, quantity: Number(quantity) }
      );
      if (response.data.success) setStock(response.data.data.productDetails);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update quantity");
    } finally {
      setActionLoading(false);
    }
  };

  const removeProduct = async (product) => {
    if (!unlocked) return;
    if (!window.confirm(`Are you sure you want to remove ${product}?`)) return;
    try {
      setActionLoading(true);
      const response = await axios.put(
        `/api/c&f/get-demands/stockcheck/${dscode}`,
        { action: "REMOVE_PRODUCT", product }
      );
      if (response.data.success) setStock(response.data.data.productDetails);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove product");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!unlocked) return;
    if (newProductIndex === "") return alert("Please select a product");

    const selectedProduct = masterProducts[newProductIndex];
    const productName = selectedProduct.productname;

    try {
      setActionLoading(true);
      const response = await axios.put(
        `/api/c&f/get-demands/stockcheck/${dscode}`,
        {
          action: "ADD_PRODUCT",
          product: productName,
          quantity: Number(newQuantity),
          price: selectedProduct.dp || 0,
          sp: selectedProduct.sp || 0,
        }
      );
      if (response.data.success) {
        setStock(response.data.data.productDetails);
        setShowAddForm(false);
        setNewProductIndex("");
        setNewQuantity(1);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add product");
    } finally {
      setActionLoading(false);
    }
  };

  // ---- OTP handlers ----
  const openOtpModal = () => {
    setShowOtpModal(true);
    setOtp("");
    setOtpMessage("");
    setOtpSent(false);
  };

  const sendOtp = async () => {
    try {
      setOtpLoading(true);
      setOtpMessage("");
      const res = await axios.post("/api/c&f/send-otp");
      if (res.data.success) {
        setOtpSent(true);
        setOtpMessage(res.data.message || "OTP sent to admin email.");
      } else {
        setOtpMessage(res.data.message || "Failed to send OTP");
      }
    } catch (err) {
      setOtpMessage(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtpCode = async () => {
    try {
      setOtpLoading(true);
      setOtpMessage("");
      const res = await axios.post("/api/c&f/verify-otp", { otp });
      if (res.data.success) {
        setEditToken(res.data.token);
        setUnlocked(true);
        setShowOtpModal(false);
        setOtp("");
      } else {
        setOtpMessage(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpMessage(err.response?.data?.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const lockNow = () => {
    setUnlocked(false);
    setEditToken("");
  };

  // ---- Computed ----
  const overallTotal = stock.reduce(
    (total, item) =>
      total + Number(item.quantity || 0) * Number(item.price || 0),
    0
  );

  // ---- Loading / error ----
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">
        {error}
      </div>
    );
  }

  // ---- UI ----
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50 flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">My Stock</h2>
          <p className="text-sm text-gray-500 mt-1">
            Current available C&F stock{" "}
            {unlocked ? (
              <span className="text-green-600 font-medium">
                • Editing enabled ({fmtTime(secondsLeft)} left)
              </span>
            ) : (
              <span className="text-red-500 font-medium">
                • Locked (view only)
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {unlocked ? (
            <button
              onClick={lockNow}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
            >
              🔒 Lock Now
            </button>
          ) : (
            <button
              onClick={openOtpModal}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              🔓 Unlock to Edit
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={!unlocked}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {showAddForm ? "Cancel" : "+ Add Stock"}
          </button>

          <button
            onClick={fetchStock}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Add form (only when unlocked) */}
      {showAddForm && unlocked && (
        <div className="bg-green-50 p-6 border-b border-green-100">
          <h3 className="font-semibold text-green-800 mb-4">
            Add New Product to Stock
          </h3>
          <form
            onSubmit={handleAddProduct}
            className="flex flex-col sm:flex-row gap-4 items-end"
          >
            <div className="flex-1 w-full">
              <label className="block text-sm text-gray-600 mb-1">
                Select Product
              </label>
              <select
                required
                value={newProductIndex}
                onChange={(e) => setNewProductIndex(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="" disabled>
                  -- Select a product --
                </option>
                {masterProducts.map((p, index) => (
                  <option key={p._id || index} value={index}>
                    {p.productname}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-32">
              <label className="block text-sm text-gray-600 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? "Adding..." : "Add"}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      {stock.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No stock available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-center">Available Quantity</th>
                <th className="px-6 py-3 text-right">Single Price</th>
                <th className="px-6 py-3 text-right">Total Price</th>
                <th className="px-6 py-3 text-right">RP</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((item, index) => {
                const quantity = Number(item.quantity || 0);
                return (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {item.product}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={quantity}
                        disabled={!unlocked}
                        onChange={(e) =>
                          handleQuantityChange(index, e.target.value)
                        }
                        className={`w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
                          unlocked && quantity > 0
                            ? "border-green-300 text-green-700 bg-green-50"
                            : unlocked
                            ? "border-red-300 text-red-700 bg-red-50"
                            : ""
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      ₹{Number(item.price || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      ₹
                      {(quantity * Number(item.price || 0)).toLocaleString(
                        "en-IN"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      ₹{Number(item.sp || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => updateQuantity(item.product, quantity)}
                        disabled={!unlocked || actionLoading}
                        className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => removeProduct(item.product)}
                        disabled={!unlocked || actionLoading}
                        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-blue-50">
                <td
                  colSpan={4}
                  className="px-6 py-4 text-right font-bold text-gray-800"
                >
                  Overall Total Price:
                </td>
                <td className="px-6 py-4 text-right font-bold text-blue-700 text-lg">
                  ₹{overallTotal.toLocaleString("en-IN")}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-gray-800">
              Verify OTP
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {otpSent
                ? "Enter the 6-digit OTP sent to the admin email."
                : "Click below to receive an OTP on the registered admin email."}
            </p>

            {otpSent && (
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full px-3 py-2 border rounded-md text-center text-lg tracking-widest mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••"
                autoFocus
              />
            )}

            {otpMessage && (
              <p className="text-sm mb-3 text-blue-600">{otpMessage}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowOtpModal(false)}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={otpLoading}
              >
                Cancel
              </button>

              {!otpSent ? (
                <button
                  onClick={sendOtp}
                  disabled={otpLoading}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {otpLoading ? "Sending..." : "Send OTP"}
                </button>
              ) : (
                <button
                  onClick={verifyOtpCode}
                  disabled={otpLoading || otp.length !== 6}
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {otpLoading ? "Verifying..." : "Verify"}
                </button>
              )}
            </div>

            {otpSent && (
              <button
                onClick={sendOtp}
                disabled={otpLoading}
                className="mt-3 text-xs text-blue-600 hover:underline w-full text-center disabled:opacity-50"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}