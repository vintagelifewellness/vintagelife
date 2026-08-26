'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useSession } from "next-auth/react"

// Helper function to prevent Timezone bug
const formatLocalYYYYMMDD = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CFMySuccessReport({ dsid }) {
  const { data: session, status } = useSession()

  const [data, setData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    const currentDsid = dsid || session?.user?.dscode;

    if (!currentDsid) {
      setError("C&F ID is missing. Please ensure the user is logged in or ID is passed.");
      setLoading(false);
      return;
    }

    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          status: 'true',
          dscode: currentDsid
        });

        if (fromDate) params.append('from', fromDate);
        if (toDate) params.append('to', toDate);

        const res = await fetch(`/api/candf/get-candf-points-closing?${params}`);
        const result = await res.json();

        if (result.success) {
          setData(result.data);
          setTotalPages(result.totalPages);
          setCurrentPage(result.currentPage);
        } else {
          setError(result.message || "Data fetch failed.");
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
        setError("Server Error! Unable to fetch data at this time.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();

  }, [currentPage, fromDate, toDate, dsid, session?.user?.dscode, status]);

  // 🛠️ CORRECTED EXPORT DATA: Directly using DB fields
  const handleExport = () => {
    const recordsToExport = selectedIds.length > 0
      ? data.filter(item => selectedIds.includes(item._id))
      : data

    if (recordsToExport.length === 0) return alert('No records to export.')

    const formatted = recordsToExport.map(item => ({
      'DSID': item.dsid,
      'Name': item.name || '—',
      'Last Match Point': item.lastmatchpoint || '0',
      'Use Point': item.usepoint || '0',
      'Amount': item.amount || '0',
      'Charges': item.charges || '0',
      'Pay Amount': item.payamount || '0',
      'Date': item.date ? new Date(item.date).toLocaleDateString() : '—',
      'UTR': item.utr || '—'
    }))

    const worksheet = XLSX.utils.json_to_sheet(formatted)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'My Success Report')
    XLSX.writeFile(workbook, 'My_Success_Report.xlsx')
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.map(item => item._id))
    } else {
      setSelectedIds([])
    }
  }

  const handleCheckboxChange = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block p-4 bg-red-100 text-red-700 font-bold rounded-lg border border-red-300 shadow">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className='text-2xl font-bold text-green-700 uppercase underline'>My Success Report</h1>

      <div className="flex flex-wrap gap-4 justify-between items-end">
        <div className="flex gap-4">
          <DatePicker
            selected={fromDate ? new Date(fromDate) : null}
            onChange={(date) => {
              setFromDate(formatLocalYYYYMMDD(date));
              setCurrentPage(1);
            }}
            placeholderText="From Date"
            className="px-3 py-2 border rounded"
            dateFormat="yyyy-MM-dd"
            isClearable
          />

          <DatePicker
            selected={toDate ? new Date(toDate) : null}
            onChange={(date) => {
              setToDate(formatLocalYYYYMMDD(date));
              setCurrentPage(1);
            }}
            placeholderText="To Date"
            className="px-3 py-2 border rounded"
            dateFormat="yyyy-MM-dd"
            isClearable
          />
        </div>

        <button
          onClick={handleExport}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold transition"
        >
          Export to Excel
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-gray-300 shadow-md bg-white">
        {loading ? (
          <div className="text-center py-10 text-blue-500 font-bold animate-pulse">Loading data...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-semibold">No success records available yet.</div>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead className="bg-green-50 text-gray-700">
              {/* 🛠️ CORRECTED TABLE HEADERS */}
              <tr>
                <th className="p-3 text-center border">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-3 border">DSID</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border text-center">Last Match Pts</th>
                <th className="p-3 border text-center text-blue-600">Use Pts</th>
                <th className="p-3 border font-bold text-gray-600">Amount</th>
                <th className="p-3 border font-bold text-red-500">Charges</th>
                <th className="p-3 border font-bold text-green-600">Pay Amount</th>
                <th className="p-3 border text-center">Date</th>
                <th className="p-3 border">UTR</th>
              </tr>
            </thead>
            <tbody>
              {/* 🛠️ CORRECTED TABLE DATA FROM DB SCHEMA */}
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-3 border text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item._id)}
                      onChange={() => handleCheckboxChange(item._id)}
                    />
                  </td>
                  <td className="p-3 border font-semibold">{item.dsid}</td>
                  <td className="p-3 border">{item.name || '—'}</td>
                  <td className="p-3 border text-center">{item.lastmatchpoint || '0'}</td>
                  <td className="p-3 border text-center font-bold text-blue-600">{item.usepoint || '0'}</td>

                  <td className="p-3 border font-bold text-gray-600">₹{item.amount || '0'}</td>
                  <td className="p-3 border font-bold text-red-500">₹{item.charges || '0'}</td>
                  <td className="p-3 border font-bold text-green-600">₹{item.payamount || '0'}</td>

                  <td className="p-3 border text-center">
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="p-3 border text-blue-600 font-mono">{item.utr || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && data.length > 0 && (
        <div className="flex justify-center items-center mt-4 gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 font-semibold hover:bg-gray-300"
          >Prev</button>
          <span className="text-sm font-bold bg-white px-3 py-1 rounded shadow">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 font-semibold hover:bg-gray-300"
          >Next</button>
        </div>
      )}
    </div>
  )
}