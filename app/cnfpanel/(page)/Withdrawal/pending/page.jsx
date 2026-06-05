'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

export default function CandFPendingPage() {
  const [data, setData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [dsidFilter, setDsidFilter] = useState('')

  // 🛠️ Fetching Unpaid Data (status: false)
  const fetchData = async (page = 1, dscode = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: 'false', // 👈 Sirf Pending wale mangne ke liye
      });

      if (dscode) params.append('dscode', dscode);

      const res = await fetch(`/api/candf/get-candf-points-closing?${params}`);
      const result = await res.json()
      if (result.success) {
        setData(result.data)
        setTotalPages(result.totalPages)
        setCurrentPage(result.currentPage)
      }
    } catch (error) {
      console.error('Failed to fetch data', error)
    }
  }

  useEffect(() => {
    fetchData(currentPage, dsidFilter)
  }, [currentPage, dsidFilter])

  const handleExport = () => {
    const recordsToExport = selectedIds.length > 0
      ? data.filter(item => selectedIds.includes(item.dsid))
      : data

    if (recordsToExport.length === 0) return alert('No records to export.')

    const formatted = recordsToExport.map(item => ({
      DSID: item.dsid,
      Name: item.name,
      'A/C No': item.acnumber,
      IFSC: item.ifscCode,
      Bank: item.bankName,
      'Last Month Points': item.lastmatchpoint,
      'Used Points': item.usepoint,
      'Pay Amount': item.payamount,
      Date: item.date
    }))

    const worksheet = XLSX.utils.json_to_sheet(formatted)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Closings')
    XLSX.writeFile(workbook, 'Pending_CandF.xlsx')
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.map(item => item.dsid))
    } else {
      setSelectedIds([])
    }
  }

  const handleCheckboxChange = (dsid) => {
    setSelectedIds(prev =>
      prev.includes(dsid)
        ? prev.filter(id => id !== dsid)
        : [...prev, dsid]
    )
  }

  // 🚀 Success Handler (Same logic as main closing page)
  const handleSuccess = async (id, utr) => {
    try {
      const res = await fetch('/api/candf/update-candf-points-closing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updateData: {
            utr,
            status: true,
            statusapprovedate: new Date(),
          },
        }),
      });

      const result = await res.json();
      alert(result.message || 'Marked as Success');
      fetchData(currentPage, dsidFilter);
    } catch (error) {
      console.error('Success update failed:', error);
      alert('Failed to mark as success.');
    }
  };

  // 🚀 Invalid Handler
  const handleInvalid = async (id, reason) => {
    if (!reason || reason.trim() === '') return alert('Invalid reason is required');

    try {
      const res = await fetch('/api/candf/update-candf-points-closing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updateData: {
            invalidresn: reason,
            invalidstatus: true,
          },
        }),
      });

      const result = await res.json();
      alert(result.message || 'Marked as Invalid');
      fetchData(currentPage, dsidFilter);
    } catch (error) {
      console.error('Invalid update failed:', error);
      alert('Failed to mark as invalid.');
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className='text-2xl font-bold text-orange-600 underline uppercase'>Pending C&F Withdrawal</h1>
      
      <div className="flex flex-wrap justify-between gap-4">
        <input
          type="text"
          placeholder="Filter by DSID"
          className="px-3 py-2 border rounded w-full sm:w-auto"
          value={dsidFilter}
          onChange={(e) => {
            setCurrentPage(1)
            setDsidFilter(e.target.value)
          }}
        />

        <button
          onClick={handleExport}
          className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-bold"
        >
          Export to Excel
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-gray-300 shadow-md">
        {data.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No pending records found</div>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
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
                <th className="p-3 border text-center">Last Month Pts</th>
                <th className="p-3 border text-center text-blue-600">Used Pts</th>
                <th className="p-3 border font-bold text-green-700">Pay Amount</th>
                <th className="p-3 border">Date</th>
                <th className="p-3 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 border-b">
                  <td className="p-3 border text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.dsid)}
                      onChange={() => handleCheckboxChange(item.dsid)}
                    />
                  </td>
                  <td className="p-3 border">{item.dsid}</td>
                  <td className="p-3 border font-medium">{item.name}</td>
                  <td className="p-3 border text-center">{item.lastmatchpoint || 0}</td>
                  <td className="p-3 border text-center text-blue-600 font-semibold">{item.usepoint || 0}</td>
                  <td className="p-3 border font-bold text-green-700">₹{item.payamount}</td>
                  <td className="p-3 border">{item.date}</td>
                  <td className="p-3 border">
                    <div className='flex flex-col gap-2'>
                        <div className='flex gap-2'>
                            <input
                                type="text"
                                placeholder="UTR"
                                value={item.successInput || ''}
                                onChange={(e) => {
                                    const newData = [...data];
                                    newData[index].successInput = e.target.value;
                                    setData(newData);
                                }}
                                className="border rounded px-2 py-1 text-sm w-32"
                            />
                            <button
                                onClick={() => handleSuccess(item._id, item.successInput)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold"
                            >Success</button>
                        </div>
                        <div className='flex gap-2'>
                            <input
                                type="text"
                                placeholder="Reason"
                                value={item.invalidInput || ''}
                                onChange={(e) => {
                                    const newData = [...data];
                                    newData[index].invalidInput = e.target.value;
                                    setData(newData);
                                }}
                                className="border rounded px-2 py-1 text-sm w-32"
                            />
                            <button
                                onClick={() => handleInvalid(item._id, item.invalidInput)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold"
                            >Invalid</button>
                        </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-center items-center mt-4 gap-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >Prev</button>
        <span className="text-sm font-semibold">Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >Next</button>
      </div>
    </div>
  )
}