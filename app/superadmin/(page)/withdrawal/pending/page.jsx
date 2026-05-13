'use client'

import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

export default function Page() {
  const [data, setData] = useState([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Selection
  const [selectedIds, setSelectedIds] = useState([])

  // Filters (input state)
  const [dsidInput, setDsidInput] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [dateInput, setDateInput] = useState('')

  // Applied filters
  const [appliedDsid, setAppliedDsid] = useState('')
  const [appliedAmount, setAppliedAmount] = useState('')
  const [appliedDate, setAppliedDate] = useState('')

  // Loading
  const [loading, setLoading] = useState(false)

  // ======================================================
  // FETCH DATA
  // ======================================================

  const fetchData = async (
    page = 1,
    dscode = '',
    minAmount = '',
    date = ''
  ) => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      })

      if (dscode) params.append('dscode', dscode)
      if (minAmount) params.append('minAmount', minAmount)
      if (date) params.append('date', date)

      const res = await fetch(
        `/api/withdrawalreport/pending?${params.toString()}`
      )

      const result = await res.json()

      if (result.success) {
        setData(result.data)
        setTotalPages(result.totalPages)
        setCurrentPage(result.currentPage)
      }
    } catch (error) {
      console.error('Fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // ======================================================
  // USE EFFECT
  // ======================================================

  useEffect(() => {
    fetchData(
      currentPage,
      appliedDsid,
      appliedAmount,
      appliedDate
    )
  }, [currentPage, appliedDsid, appliedAmount, appliedDate])

  // ======================================================
  // APPLY FILTERS
  // ======================================================

  const handleApplyFilters = () => {
    setCurrentPage(1)

    setAppliedDsid(dsidInput)
    setAppliedAmount(amountInput)
    setAppliedDate(dateInput)
  }

  // ======================================================
  // CLEAR FILTERS
  // ======================================================

  const handleClearFilters = () => {
    setDsidInput('')
    setAmountInput('')
    setDateInput('')

    setAppliedDsid('')
    setAppliedAmount('')
    setAppliedDate('')

    setCurrentPage(1)
  }

  // ======================================================
  // SELECT ALL
  // ======================================================

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.map((item) => item._id))
    } else {
      setSelectedIds([])
    }
  }

  // ======================================================
  // SINGLE SELECT
  // ======================================================

  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    )
  }

  // ======================================================
  // EXPORT
  // ======================================================

  const handleExport = () => {
    const recordsToExport =
      selectedIds.length > 0
        ? data.filter((item) => selectedIds.includes(item._id))
        : data

    if (recordsToExport.length === 0) {
      return alert('No records found')
    }

    const formatted = recordsToExport.map((item) => ({
      DSID: item.dsid,
      Name: item.name,
      'A/C No': item.acnumber,
      IFSC: item.ifscCode,
      Bank: item.bankName,
      Amount: item.amount,
      TDS: ((item.charges * 2) / 5).toFixed(2),
      'Service Charge': ((item.charges * 3) / 5).toFixed(2),
      'Pay Amount': item.payamount,
      Date: item.date,
    }))

    const worksheet = XLSX.utils.json_to_sheet(formatted)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Pending Withdrawals'
    )

    XLSX.writeFile(workbook, 'PendingWithdrawals.xlsx')
  }

  // ======================================================
  // SUCCESS
  // ======================================================

  const handleSuccess = async (id, utr) => {
    try {
      const res = await fetch('/api/closing/updatepair', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          updateData: {
            utr,
            status: true,
            statusapprovedate: new Date(),
          },
        }),
      })

      const result = await res.json()

      alert(result.message || 'Success')

      fetchData(
        currentPage,
        appliedDsid,
        appliedAmount,
        appliedDate
      )
    } catch (error) {
      console.error(error)
      alert('Failed')
    }
  }

  // ======================================================
  // INVALID
  // ======================================================

  const handleInvalid = async (id, reason) => {
    if (!reason?.trim()) {
      return alert('Invalid reason required')
    }

    try {
      const res = await fetch('/api/closing/updatepair', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          updateData: {
            invalidresn: reason,
            invalidstatus: true,
          },
        }),
      })

      const result = await res.json()

      alert(result.message || 'Invalid Updated')

      fetchData(
        currentPage,
        appliedDsid,
        appliedAmount,
        appliedDate
      )
    } catch (error) {
      console.error(error)
      alert('Failed')
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold underline">
        Pending Withdrawals
      </h1>

      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Filter by DSID"
          value={dsidInput}
          onChange={(e) => setDsidInput(e.target.value)}
          className="border rounded px-3 py-2"
        />

        <input
          type="number"
          placeholder="Min Pay Amount"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          className="border rounded px-3 py-2"
        />

        <input
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          className="border rounded px-3 py-2"
        />

        <button
          onClick={handleApplyFilters}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Apply Filters
        </button>

        <button
          onClick={handleClearFilters}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Clear
        </button>

        <button
          onClick={handleExport}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>
      </div>

      {/* ====================================================== */}
      {/* TABLE */}
      {/* ====================================================== */}

      <div className="overflow-auto border rounded-xl shadow">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No Data Found
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === data.length &&
                      data.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>

                <th className="border p-3">DSID</th>
                <th className="border p-3">Name</th>
                <th className="border p-3">A/C No</th>
                <th className="border p-3">IFSC</th>
                <th className="border p-3">Bank</th>
                <th className="border p-3">Amount</th>
                <th className="border p-3">TDS</th>
                <th className="border p-3">Service Charge</th>
                <th className="border p-3">Pay Amount</th>
                <th className="border p-3">Date</th>
                <th className="border p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item, index) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50"
                >
                  <td className="border p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item._id)}
                      onChange={() =>
                        handleCheckboxChange(item._id)
                      }
                    />
                  </td>

                  <td className="border p-3">{item.dsid}</td>
                  <td className="border p-3">{item.name}</td>
                  <td className="border p-3">
                    {item.acnumber || '-'}
                  </td>
                  <td className="border p-3">
                    {item.ifscCode || '-'}
                  </td>
                  <td className="border p-3">
                    {item.bankName || '-'}
                  </td>
                  <td className="border p-3">
                    ₹{item.amount}
                  </td>

                  <td className="border p-3">
                    ₹
                    {((item.charges * 2) / 5).toFixed(2)}
                  </td>

                  <td className="border p-3">
                    ₹
                    {((item.charges * 3) / 5).toFixed(2)}
                  </td>

                  <td className="border p-3">
                    ₹{item.payamount}
                  </td>

                  <td className="border p-3">
                    {item.date}
                  </td>

                  <td className="border p-3">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="UTR"
                          value={item.successInput || ''}
                          onChange={(e) => {
                            const updated = [...data]
                            updated[index].successInput =
                              e.target.value
                            setData(updated)
                          }}
                          className="border px-2 py-1 rounded text-xs"
                        />

                        <input
                          type="text"
                          placeholder="Invalid Reason"
                          value={item.invalidInput || ''}
                          onChange={(e) => {
                            const updated = [...data]
                            updated[index].invalidInput =
                              e.target.value
                            setData(updated)
                          }}
                          className="border px-2 py-1 rounded text-xs"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleSuccess(
                              item._id,
                              item.successInput
                            )
                          }
                          className="bg-green-500 text-white px-3 py-1 rounded text-xs"
                        >
                          Success
                        </button>

                        <button
                          onClick={() =>
                            handleInvalid(
                              item._id,
                              item.invalidInput
                            )
                          }
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs"
                        >
                          Invalid
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ====================================================== */}
      {/* PAGINATION */}
      {/* ====================================================== */}

      <div className="flex justify-center items-center gap-4">
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.max(prev - 1, 1))
          }
          disabled={currentPage === 1}
          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(prev + 1, totalPages)
            )
          }
          disabled={currentPage === totalPages}
          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}