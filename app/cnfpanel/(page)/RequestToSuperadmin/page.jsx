"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

export default function RequestToSuperadminPage() {
    const { data: session, status } = useSession();
    const [points, setPoints] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Modal dikhane ke liye nayi state
    const [showModal, setShowModal] = useState(false);

    const [dbProducts, setDbProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const [selectedProduct, setSelectedProduct] = useState("");
    const [quantity, setQuantity] = useState("");
    const [requestedItemsList, setRequestedItemsList] = useState([]);

    // API se products dynamically lana
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get("/api/Product/Product/fetch/s");
                if (response.data.success) {
                    setDbProducts(response.data.data);
                }
            } catch (error) {
                console.error("API Error:", error);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    // 100% Dynamic Add Function
    const handleAddItem = () => {
        if (!selectedProduct || !quantity || quantity <= 0) {
            alert("Bhai, pehle product select karo aur quantity dalo!");
            return;
        }

        const productObj = dbProducts.find((p) => p._id === selectedProduct);
        if (!productObj) return;

        // Dynamic data uthana API se (dp = Price, sp = RP)
        const price = Number(productObj.dp) || 0;
        const rp = Number(productObj.sp) || 0;
        const mrp = Number(productObj.mrp) || 0;

        const existingIndex = requestedItemsList.findIndex((item) => item.productId === selectedProduct);

        if (existingIndex >= 0) {
            // List me hai toh quantity add kar do
            const updatedList = [...requestedItemsList];
            updatedList[existingIndex].quantity += parseInt(quantity);
            setRequestedItemsList(updatedList);
        } else {
            // Naya item dynamically add karo
            setRequestedItemsList([
                ...requestedItemsList,
                {
                    productId: selectedProduct,
                    productName: productObj.productname,
                    mrp: mrp,
                    price: price,
                    rp: rp,
                    quantity: parseInt(quantity)
                }
            ]);
        }

        setSelectedProduct("");
        setQuantity("");
    };

    // Table me Quantity dynamically + / - karne ka function
    const handleQuantityChange = (index, newQuantity) => {
        const val = parseInt(newQuantity);
        if (val < 1 || isNaN(val)) return;

        const updatedList = [...requestedItemsList];
        updatedList[index].quantity = val;
        setRequestedItemsList(updatedList);
    };

    const handleRemoveItem = (index) => {
        const updatedList = requestedItemsList.filter((_, i) => i !== index);
        setRequestedItemsList(updatedList);
    };

    // Button click hone par sirf ye function chalega jo popup kholega
    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic check: agar list khali hai aur points bhi nahi hain
        if (requestedItemsList.length === 0 && (!points || points <= 0)) {
            setMessage({ type: "error", text: "Please add at least one product or points!" });
            return;
        }

        setShowModal(true); // Popup open karo
    };

    // Asli API call jab wo popup me "Yes" dabayega
    const confirmSubmit = async () => {
        setShowModal(false); // Popup band karo
        setLoading(true);

        try {
            const payload = {
                dscode: session?.user?.dscode || "",
                cfName: session?.user?.name || "",
                cfType: session?.user?.Cnftype || "",
                requestedPoints: points || 0,
                totalPrice: grandTotalPrice,
                totalRp: grandTotalRP,
                requestedItems: requestedItemsList,
                requestDate: new Date().toISOString(),
                status: "Pending"
            };

            const response = await axios.post(`/api/c&f/cnf-request`, payload);
            setMessage({ type: "success", text: "Demand Successfully Submitted!" });

            // Success ke baad clear kar do
            setRequestedItemsList([]);
            setPoints("");
        } catch (error) {
            setMessage({ type: "error", text: "Error submitting demand." });
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") {
        return <div className="min-h-screen flex items-center justify-center font-bold">Loading Data...</div>;
    }

    // Grand Totals Dynamic Calculation
    const grandTotalPrice = requestedItemsList.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const grandTotalRP = requestedItemsList.reduce((acc, item) => acc + (item.rp * item.quantity), 0);

    // Selected product ki detail dikhane ke liye
    const activeProduct = dbProducts.find((p) => p._id === selectedProduct);

    return (
        <div className="max-w-6xl mx-auto lg:p-6 p-4 mt-8 bg-white dark:bg-gray-800 shadow-xl rounded-xl text-gray-700 dark:text-gray-100 relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center border-b pb-4">
                Send Stock Demand to Superadmin
            </h2>

            {message.text && (
                <div className={`p-4 mb-6 rounded-lg text-center font-bold ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Dynamic C&F Details from Session */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 bg-gray-50 p-5 rounded-lg border">
                <div>
                    <label className="block text-sm font-semibold mb-2">C&F DsCode</label>
                    <input type="text" value={session?.user?.dscode || ""} disabled className="border rounded-lg p-2.5 w-full bg-gray-200 cursor-not-allowed font-medium text-gray-800" />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2">C&F Name</label>
                    <input type="text" value={session?.user?.name || ""} disabled className="border rounded-lg p-2.5 w-full bg-gray-200 cursor-not-allowed font-medium text-gray-800" />
                </div>
            </div>


            <div className="mb-6 border p-5 rounded-lg bg-gray-50">
                <h3 className="text-lg font-bold mb-4">Select & Add Products</h3>

                <div className="flex flex-col md:flex-row gap-4 ">
                    <div className=" ">
                        <label className="block text-sm font-semibold mb-2">Select Product</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="border rounded-lg p-3   outline-none text-gray-800"
                        >
                            <option value="">-- Select a Product --</option>
                            {loadingProducts ? (
                                <option disabled>Loading...</option>
                            ) : (
                                dbProducts.map((prod) => (
                                    <option key={prod._id} value={prod._id}>
                                        {prod.productname}
                                    </option>
                                ))
                            )}
                        </select>
                         
                    </div>

                    <div className=" ">
                        <label className="block text-sm font-semibold mb-2">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="border rounded-lg p-3 w-full outline-none text-gray-800"
                            placeholder="Qty"
                            min="1"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="bg-blue-600   hover:bg-blue-700 text-white font-bold py-1 px-2 rounded-lg shadow-md"
                    >
                        Add to List
                    </button>
                </div>

                {requestedItemsList.length > 0 && (
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full border-collapse border rounded-lg">
                            <thead>
                                <tr className="bg-gray-200 text-left text-gray-800">
                                    <th className="p-3 border">Product Name</th>
                                    <th className="p-3 border text-center">Price</th>
                                    <th className="p-3 border text-center">RP</th>
                                    <th className="p-3 border text-center">Quantity</th>
                                    <th className="p-3 border text-center text-blue-700">Total Price</th>
                                    <th className="p-3 border text-center text-green-700">Total RP</th>
                                    <th className="p-3 border text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requestedItemsList.map((item, index) => {
                                    // ⚡ Ye calculation ekdam LIVE hai
                                    const totalItemPrice = item.price * item.quantity;
                                    const totalItemRP = item.rp * item.quantity;

                                    return (
                                        <tr key={index} className="bg-white text-gray-800">
                                            <td className="p-3 border font-medium">{item.productName}</td>
                                            <td className="p-3 border text-center">₹{item.price}</td>
                                            <td className="p-3 border text-center">{item.rp}</td>

                                            <td className="p-3 border text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                                        className="bg-red-500 text-white w-8 h-8 rounded font-bold"
                                                    >-</button>
                                                    <span className="w-10 text-center font-bold">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                                        className="bg-green-500 text-white w-8 h-8 rounded font-bold"
                                                    >+</button>
                                                </div>
                                            </td>

                                            <td className="p-3 border text-center font-bold text-blue-600">₹{totalItemPrice}</td>
                                            <td className="p-3 border text-center font-bold text-green-600">{totalItemRP}</td>
                                            <td className="p-3 border text-center">
                                                <button
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="text-red-500 hover:underline font-semibold"
                                                >Remove</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="flex justify-end mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-right">
                                <h4 className="text-xl font-bold text-gray-800">
                                    Grand Total Price: <span className="text-blue-600">₹{grandTotalPrice}</span>
                                </h4>
                                <h4 className="text-xl font-bold text-gray-800 mt-2">
                                    Grand Total RP: <span className="text-green-600">{grandTotalRP}</span>
                                </h4>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full text-white px-4 py-3.5 rounded-lg text-lg font-bold shadow-md ${loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
            >
                {loading ? "Processing..." : "Submit Final Demand"}
            </button>

            {/* CONFIRMATION MODAL (POPUP) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-sm w-full mx-4 transform transition-all text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Submit</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                            Are you sure you want to submit this demand for {requestedItemsList.length} items?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors w-full"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSubmit}
                                className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors w-full shadow-sm"
                            >
                                Yes, Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}