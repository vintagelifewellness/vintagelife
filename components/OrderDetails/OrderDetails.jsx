"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toWords } from 'number-to-words';
import { useReactToPrint } from "react-to-print";


export default function OrderDetails({ data }) {
  const contentRef = useRef(null);
  const reactToPrintFn = useReactToPrint({ contentRef });
  const [success, setSuccess] = useState(null);

  const [orderStatus, setOrderStatus] = useState(data.status);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(data.deliver);
  const [newDeliveryDate, setNewDeliveryDate] = useState(
    data.deliverdate ? new Date(data.deliverdate) : null
  );
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Handlers for API calls (no changes needed here) ---
  const o = data._id;
  const handleStatusUpdate = async (newStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/order/update/${o}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data._id, status: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        setOrderStatus(newStatus);

        alert(`Order ${newStatus ? 'approved' : 'unapproved'} successfully!`);
        window.location.reload();
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdatecancle = async (newStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/order/update/${o}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data._id, status: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        setOrderStatus(newStatus);
        await fetch("/api/PaymentHistory/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dsid: data.dscode,
            amount: "0",
            sp: -Math.abs(data.totalsp),
            group: data.salegroup,
            orderno: data.orderNo,
            type: "order",
          }),
        });
        alert(`Order cancelled successfully!`);
        window.location.reload();
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeliveryUpdate = async (newStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/order/deliveryupdate/${data._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliver: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        setDeliveryStatus(newStatus);
        alert(`Order marked as ${newStatus ? 'Delivered' : 'Not Delivered'} successfully!`);
      } else {
        throw new Error(result.message || 'Failed to update delivery status');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('Failed to update delivery status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeliveryDateUpdate = async () => {
    if (!newDeliveryDate) {
      return alert('Please select a valid date.');
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/order/update/${data._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverdate: new Date(newDeliveryDate) }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Delivery date updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update delivery date');
      }
    } catch (error) {
      console.error('Error updating delivery date:', error);
      alert('Failed to update delivery date. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  // --- End of API handlers ---

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get("/api/Product/Product/fetch/s");
        setProducts(response.data.data || []);
      } catch (error) {
        setError(error.response?.data?.message || "Failed to fetch products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getProductDetails = (productName) => {
    return products.find((p) => p.productname === productName);
  };

  const extractMainValue = (value) => {
    if (!value) return 0;
    const main = value.toString().split("(")[0];
    return Number(main) || 0;
  };

  // --- Corrected Calculation Logic ---
  const totals = {
    totalDP: 0,
    totalSP: 0,
    totalQty: 0,
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0,
    totalTaxable: 0,
  };

  data.productDetails.forEach((product) => {
    const matched = getProductDetails(product.product);
    if (!matched) return;

    const quantity = Number(product.quantity) || 0;
    const dp = Number(matched.dp) || 0;
    const sp = Number(matched.sp) || 0;

    const cgst = extractMainValue(matched.cgst);
    const sgst = extractMainValue(matched.sgst);
    const igst = extractMainValue(matched.igst);

    const gstPercent =
      data.outofraj === "YES" ? igst : cgst + sgst;

    const totalAmount = dp * quantity;

    // taxable value (same as table)
    const taxableValue = (totalAmount / (100 + gstPercent)) * 100;

    totals.totalQty += quantity;
    totals.totalDP += totalAmount; // DP * qty (TAX INCLUDED)
    totals.totalSP += sp * quantity;

    totals.totalTaxable += taxableValue;

    // calculate tax same as table
    if (data.outofraj === "NO") {
      totals.totalCGST += (taxableValue * cgst) / 100;
      totals.totalSGST += (taxableValue * sgst) / 100;
    } else {
      totals.totalIGST += (taxableValue * igst) / 100;
    }
  });

  // total tax
  const totalTaxAmount =
    totals.totalCGST + totals.totalSGST + totals.totalIGST;

  // correct net amount
  const shippingCharge = Number(data.shippingcharge) || 0;

  // same as table footer total
  const netAmount = totals.totalDP + shippingCharge;
  const amountBeforeTax = totals.totalTaxable;

  const netAmountInWords = toWords(Math.round(netAmount));

  const handleDelete = async () => {
    if (!data._id) return;

    const confirmDelete = confirm("Are you sure you want to delete this Order?");
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await axios.delete(`/api/order/delete/${data._id}`);
      setSuccess("Order deleted successfully.");
      location.reload();
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete user.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <button
        onClick={() => reactToPrintFn()}
        className="mt-4 ml-4 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 print:hidden"
      >
        Print Invoice
      </button>

      <div
        ref={contentRef}
        className="mx-auto my-6 p-4 border border-black rounded bg-white text-[11px] leading-tight max-w-[800px]"
      >

        {/* ---------- HEADER ---------- */}
        <div className="text-center mb-2">
          <h1 className="font-extrabold text-lg">VINTAGE LIFE WELLNESS PVT. LTD.</h1>
          <p>2K2 Keshopura, Kamla Nehru Nagar, Jaipur, Rajasthan - 302006</p>
          <p className="font-semibold mt-1">GSTIN: 08AALCV2376C1Z7</p>
        </div>

        {/* ---------- INVOICE INFO ---------- */}
        <div className="border border-black p-2 rounded mb-1">
          <h2 className="font-bold text-center border-b border-black pb-1 mb-2">TAX INVOICE</h2>
          <div className="grid grid-cols-2">
            <div className="p-1 border text-[10px]"><strong>Invoice No:</strong> {data.orderNo}</div>
            <div className="p-1 border text-[10px]"><strong>Transport:</strong> Courier</div>
            <div className="p-1 border text-[10px]"><strong>Date:</strong> {new Date(data.date).toLocaleDateString('en-GB')}</div>
            <div className="p-1 border text-[10px]"><strong>Reverse Charge:</strong> NO</div>
            <div className="p-1 border text-[10px]"><strong>State of Supply:</strong> {data.remarks}</div>
          </div>
        </div>

        {/* ---------- BILL / SHIP ---------- */}
        <div className="grid grid-cols-2 border border-black mb-2 rounded overflow-hidden">
          <div>
            <div className="bg-gray-200 text-center font-bold p-1 border-b border-black">Bill To</div>
            <div className="p-1 border text-[10px]"><strong>Name:</strong> {data.dsname}</div>
            <div className="p-1 border text-[10px]"><strong>DSID:</strong> {data.dscode}</div>
            <div className="p-1 border text-[10px]"><strong>Address:</strong> {data.address}</div>
            <div className="p-1 border text-[10px]"><strong>Mobile:</strong> {data.mobileno}</div>
          </div>

          <div>
            <div className="bg-gray-200 text-center font-bold p-1 border-b border-black">Ship To</div>
            <div className="p-1 border text-[10px]"><strong>Name:</strong> {data.dsname}</div>
            <div className="p-1 border text-[10px]"><strong>Address:</strong> {data.shippingAddress}</div>
            <div className="p-1 border text-[10px]"><strong>Pincode:</strong> {data.shippinpPincode}</div>
            <div className="p-1 border text-[10px]"><strong>Mobile:</strong> {data.shippingmobile}</div>
          </div>
        </div>

        {/* ---------- PRODUCT TABLE ---------- */}
        <table className="w-full border border-black border-collapse text-[10px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-1">#</th>
              <th className="border p-1">Product</th>
              <th className="border p-1">HSN</th>
              <th className="border p-1">Qty</th>
              <th className="border p-1">DP</th>
              <th className="border p-1">MRP</th>
              <th className="border p-1">Amount</th>
              <th className="border p-1">Taxable</th>
              <th className="border p-1">CGST</th>
              <th className="border p-1">SGST</th>
              <th className="border p-1">IGST</th>
              <th className="border p-1">Text Rate</th>
              <th className="border p-1">Total RP</th>
              <th className="border p-1">Total</th>
            </tr>
          </thead>

          <tbody>
            {data.productDetails.map((product, i) => {
              const matched = getProductDetails(product.product);
              if (!matched)
                return (
                  <tr key={i}>
                    <td colSpan="10" className="text-center border p-1">No Info</td>
                  </tr>
                );

              const qty = Number(product.quantity);
              const amount = qty * Number(matched.dp);
              const igst = extractMainValue(matched.igst);
              const taxable = (amount / (100 + igst)) * 100;

              return (
                <tr key={i}>
                  <td className="border p-1 text-center">{i + 1}</td>
                  <td className="border p-1">{product.product}</td>
                  <td className="border p-1">{matched.hsn}</td>
                  <td className="border p-1 text-center">{qty}</td>
                  <td className="border p-1">{matched.dp}</td>
                  <td className="border p-1">{matched.mrp}</td>
                  <td className="border p-1">{amount.toFixed(2)}</td>
                  <td className="border p-1">{taxable.toFixed(2)}</td>
                  <td className="border p-1">{data.outofraj === "NO" ? ((taxable * matched.cgst) / 100).toFixed(2) : "-"}</td>
                  <td className="border p-1">{data.outofraj === "NO" ? ((taxable * matched.sgst) / 100).toFixed(2) : "-"}</td>
                  <td className="border p-1">{data.outofraj === "YES" ? ((taxable * matched.igst) / 100).toFixed(2) : "-"}</td>
                  <td className="border p-1">{matched.igst}%</td>
                  <td className="border p-1">{(matched.sp * qty).toFixed(2)}</td>
                  <td className="border p-1">{amount.toFixed(2)}</td>
                </tr>
              );
            })}

            <tr className="font-bold bg-gray-100">
              <td colSpan="3" className="border p-1 text-center">Total</td>
              <td className="border p-1">{totals.totalQty}</td>
              <td className="border p-1"></td>
              <td className="border p-1">{totals.totalDP.toFixed(2)}</td>
              <td className="border p-1"></td>
              <td className="border p-1">{amountBeforeTax.toFixed(2)}</td>
              <td className="border p-1">{totals.totalCGST.toFixed(2)}</td>
              <td className="border p-1">{totals.totalSGST.toFixed(2)}</td>
              <td className="border p-1">{totals.totalIGST.toFixed(2)}</td>
              <td className="border p-1"></td>
              <td className="border p-1"></td>

              <td className="border p-1">{totals.totalDP.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* ---------- TOTALS ---------- */}
        <div className="border border-black mt-2 p-2">
          <div className="grid grid-cols-2">
            <div className="p-1">
              <p className="font-semibold mb-1 underline">Amount in Words</p>
              <p className="capitalize font-bold text-[12px]">
                {netAmountInWords} only
              </p>
            </div>

            <div className="p-1 text-[10px]">
              <div className="flex justify-between"><span>Total Before Tax:</span> <span>₹ {amountBeforeTax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Add CGST:</span> <span>₹ {totals.totalCGST.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Add SGST:</span> <span>₹ {totals.totalSGST.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Add IGST:</span> <span>₹ {totals.totalIGST.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold"><span>Total After Tax:</span> <span>₹ {totals.totalDP.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping:</span> <span>₹ {shippingCharge.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-[12px]"><span>Net Amount:</span> <span>₹ {netAmount.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        {/* ---------- FOOTER ---------- */}
        <div className="text-center mt-4">
          <p className="text-[10px] font-semibold">Certified that the above information is true and correct</p>
          <p className="mt-3 font-bold">VINTAGE LIFE WELLNESS PVT. LTD.</p>
          <p className="mt-5 font-semibold text-[12px]">Authorized Signatory</p>
        </div>

      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handleStatusUpdate(true)}
          disabled={orderStatus || isLoading}
          className={`flex-1 py-2 px-4 rounded text-white font-semibold transition duration-200 ${orderStatus || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isLoading && !orderStatus ? 'Approving...' : 'Approve'}
        </button>
        {orderStatus && (
          <>
            <button
              onClick={() => handleDeliveryUpdate(true)}
              disabled={deliveryStatus || isLoading}
              className={`flex-1 py-2 px-4 rounded text-white font-semibold transition duration-200 ${deliveryStatus || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isLoading && !deliveryStatus ? 'Updating...' : 'Mark as Delivered'}
            </button>
            {!deliveryStatus && (
              <button
                onClick={() => handleStatusUpdatecancle(false)}
                className="flex-1 py-2 px-4 rounded text-white font-semibold transition duration-200 bg-red-600 hover:bg-red-700"
              >
                Cancel Order
              </button>
            )}
          </>
        )}
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-sm px-4 py-2 rounded text-white transition duration-200 disabled:opacity-50"
      >
        Delete Order
      </button>
    </>
  );

}