'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

export default function CandFPointsClosingPage() {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = async (page = 1) => {
    try {
      const res = await fetch(`/api/candf/get-candf-points-closing?page=${page}&limit=10&status=false`)
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
    fetchData(currentPage)
  }, [currentPage])

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/newclosing/cnf', { method: 'GET' })
      const result = await res.json()
      alert(result.message)
      fetchData(currentPage)
    } catch (error) {
      console.error('failed', error)
      alert('Failed to generate closing!')
    } finally {
      setLoading(false)
      setShowModal(false)
    }
  }

  // 🛠️ CORRECTED EXPORT LOGIC
  const handleExport = () => {
    const unpaid = data.filter(item => !item.status)
    if (unpaid.length === 0) return alert('No unpaid records to export.')

    const formatted = unpaid.map(item => ({
      'DSID': item.dsid,
      'Name': item.name || '—',
      'A/C No': item.acnumber || '—',
      'IFSC': item.ifscCode || '—',
      'Bank': item.bankName || '—',
      'Last Match Pts': item.lastmatchpoint || '0',
      'Used Pts': item.usepoint || '0',
      'Amount': item.amount || '0',
      'Charges': item.charges || '0',
      'Pay Amount': item.payamount || '0',
      'Date': item.date ? new Date(item.date).toLocaleDateString('en-IN') : '—'
    }))

    const worksheet = XLSX.utils.json_to_sheet(formatted)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Unpaid CandF Closings')
    XLSX.writeFile(workbook, 'unpaid_candf_points.xlsx')
  }

  const handleSuccess = async (id, utr) => {
    if (!utr) {
      return alert("Please enter UTR/Remarks before approving.");
    }

    try {
      const res = await fetch('/api/candf/update-candf-points-closing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updateData: {
            utr,
            status: true,
          },
        }),
      });

      const result = await res.json();
      alert(result.message || 'Marked as Success');
      fetchData(currentPage);
    } catch (error) {
      console.error('Success update failed:', error);
      alert('Failed to mark as success.');
    }
  };

  return (
    <div className="p-4 space-y-6">

      <div className="border-b pb-4 mt-2">
        <h1 className="text-2xl font-bold text-gray-800 uppercase">C&F Points Closing (Pending)</h1>
      </div>

      <div className="flex flex-wrap justify-between gap-4 mt-4">
        <div className='flex flex-col gap-2'>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow"
          >
            Run C&F Closing
          </button>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-yellow-500 text-white font-bold rounded hover:bg-yellow-600 shadow"
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-gray-300 shadow-md bg-white">
        {data.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-semibold">No pending records found</div>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 border">DSID</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">A/C No</th>
                <th className="p-3 border">IFSC</th>
                <th className="p-3 border">Bank</th>
                <th className="p-3 border text-center">Last Match Pts</th>
                <th className="p-3 border text-center text-blue-600">Used Pts</th>
                <th className="p-3 border font-bold text-gray-600">Amount</th>
                <th className="p-3 border font-bold text-red-500">Charges</th>
                <th className="p-3 border font-bold text-green-600">Pay Amount</th>
                <th className="p-3 border text-center">Date</th>
                <th className="p-3 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="p-3 border font-semibold">{item.dsid}</td>
                  <td className="p-3 border font-semibold">{item.name || '—'}</td>
                  <td className="p-3 border">{item.acnumber || '—'}</td>
                  <td className="p-3 border">{item.ifscCode || '—'}</td>
                  <td className="p-3 border">{item.bankName || '—'}</td>

                  <td className="p-3 border text-center">{item.lastmatchpoint || '0'}</td>
                  <td className="p-3 border text-center font-bold text-blue-600">{item.usepoint || '0'}</td>
                  <td className="p-3 border font-bold text-gray-600">₹{item.amount || '0'}</td>
                  <td className="p-3 border font-bold text-red-500">₹{item.charges || '0'}</td>
                  <td className="p-3 border font-bold text-green-600">₹{item.payamount || '0'}</td>

                  <td className="p-3 border text-center">
                    {item.date ? new Date(item.date).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    }) : '—'}
                  </td>
                  <td className="p-3 border space-y-2">
                    <div className='flex gap-2 justify-center'>
                      <input
                        type="text"
                        placeholder="UTR / Remarks"
                        value={item.successInput || ''}
                        onChange={(e) => {
                          const newData = [...data];
                          newData[index].successInput = e.target.value;
                          setData(newData);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-32 focus:outline-blue-500"
                      />
                    </div>
                    <div className='flex gap-2 justify-center'>
                      <button
                        onClick={() => handleSuccess(item._id, item.successInput)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs w-32 font-bold hover:bg-green-700"
                      >
                        Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.length > 0 && (
        <div className="flex justify-center items-center mt-4 gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 font-semibold"
          >
            Prev
          </button>
          <span className="text-sm font-semibold bg-white px-3 py-1 shadow rounded border">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 font-semibold"
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Are you sure?</h2>
            <p className="text-gray-600 mb-6 font-medium">This will generate C&F closing based on Used and Last Match points. Do you want to continue?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold"
              >Cancel</button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-5 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-bold"
              >{loading ? 'Processing...' : 'Yes, Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}