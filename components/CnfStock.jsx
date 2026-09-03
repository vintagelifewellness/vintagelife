"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function CnfStock({ dscode }) {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // Add Stock States
    const [showAddForm, setShowAddForm] = useState(false);
    const [masterProducts, setMasterProducts] = useState([]);
    const [newProductIndex, setNewProductIndex] = useState("");
    const [newQuantity, setNewQuantity] = useState(1);

    const fetchStock = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await axios.get(`/api/c&f/get-demands/stockcheck/${dscode}`);
            if (response.data.success) {
                setStock(response.data.data?.productDetails || []);
            } else {
                setError(response.data.message || "Failed to fetch stock");
            }
        } catch (error) {
            setError(error.response?.data?.message || "Failed to fetch C&F stock");
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterProducts = async () => {
        try {
            // Replace with your actual products API route
            const response = await axios.get(`/api/Product/Product/fetch/1`);
            if (response.data.success) {
                setMasterProducts(response.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch master products", error);
        }
    };

    useEffect(() => {
        if (dscode) {
            fetchStock();
            fetchMasterProducts();
        }
    }, [dscode]);

    const handleQuantityChange = (index, value) => {
        const newStock = [...stock];
        newStock[index].quantity = value;
        setStock(newStock);
    };

    const updateQuantity = async (product, quantity) => {
        try {
            setActionLoading(true);
            const response = await axios.put(`/api/c&f/get-demands/stockcheck/${dscode}`, {
                action: "UPDATE_QUANTITY",
                product: product,
                quantity: Number(quantity)
            });
            if (response.data.success) setStock(response.data.data.productDetails);
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update quantity");
        } finally {
            setActionLoading(false);
        }
    };

    const removeProduct = async (product) => {
        if (!window.confirm(`Are you sure you want to remove ${product}?`)) return;
        try {
            setActionLoading(true);
            const response = await axios.put(`/api/c&f/get-demands/stockcheck/${dscode}`, {
                action: "REMOVE_PRODUCT",
                product: product
            });
            if (response.data.success) setStock(response.data.data.productDetails);
        } catch (error) {
            alert(error.response?.data?.message || "Failed to remove product");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (newProductIndex === "") return alert("Please select a product");

        const selectedProduct = masterProducts[newProductIndex];
        // Assuming your product model has fields like 'name', 'price', and 'sp'. Update these keys if they differ.
        const productName = selectedProduct.productname;

        try {
            setActionLoading(true);
            const response = await axios.put(`/api/c&f/get-demands/stockcheck/${dscode}`, {
                action: "ADD_PRODUCT",
                product: productName,
                quantity: Number(newQuantity),
                price: selectedProduct.dp || 0,
                sp: selectedProduct.sp || 0
            });

            if (response.data.success) {
                setStock(response.data.data.productDetails);
                setShowAddForm(false);
                setNewProductIndex("");
                setNewQuantity(1);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to add product");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">{error}</div>;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">My Stock</h2>
                    <p className="text-sm text-gray-500 mt-1">Current available C&F stock</p>
                </div>
                <div className="space-x-3">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
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

            {/* Add Stock Form */}
            {showAddForm && (
                <div className="bg-green-50 p-6 border-b border-green-100">
                    <h3 className="font-semibold text-green-800 mb-4">Add New Product to Stock</h3>
                    <form onSubmit={handleAddProduct} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm text-gray-600 mb-1">Select Product</label>
                            <select
                                required
                                value={newProductIndex}
                                onChange={(e) => setNewProductIndex(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="" disabled>-- Select a product --</option>
                                {masterProducts.map((p, index) => (
                                    <option key={p._id || index} value={index}>
                                        {p.productname}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full sm:w-32">
                            <label className="block text-sm text-gray-600 mb-1">Quantity</label>
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

            {/* Empty */}
            {stock.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No stock available</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 text-sm">
                                <th className="px-6 py-3 text-left">#</th>
                                <th className="px-6 py-3 text-left">Product</th>
                                <th className="px-6 py-3 text-center">Available Quantity</th>
                                <th className="px-6 py-3 text-right">Single Price</th>
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
                                        <td className="px-6 py-4 font-medium text-gray-800">{item.product}</td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                value={quantity}
                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                className={`w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${quantity > 0 ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"
                                                    }`}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            ₹{Number(item.price || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            ₹{Number(item.sp || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-2">
                                            <button
                                                onClick={() => updateQuantity(item.product, quantity)}
                                                disabled={actionLoading}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition disabled:opacity-50"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => removeProduct(item.product)}
                                                disabled={actionLoading}
                                                className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}