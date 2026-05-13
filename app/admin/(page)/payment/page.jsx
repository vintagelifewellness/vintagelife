'use client'

import React, { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import axios from 'axios'
import { useSession } from 'next-auth/react'

export default function Page() {
    const { data: session } = useSession()
    const [data, setData] = useState([])
    const [userds, setUserds] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedIds, setSelectedIds] = useState([])
    const [loading, setLoading] = useState(false)

    // Filter & Summary States
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [summary, setSummary] = useState({
        totalAmount: 0,
        totalPayAmount: 0,
        totalTds: 0,
        totalServiceCharge: 0
    })

    useEffect(() => {
        const fetchUserData = async () => {
            if (!session?.user?.email) return
            try {
                const res = await axios.get(`/api/user/find-admin-byemail/${session.user.email}`)
                setUserds(res.data?.dscode || '')
            } catch (err) {
                console.error('Failed to fetch user data:', err)
            }
        }
        fetchUserData()
    }, [session?.user?.email])

    // Notice we accept start/end dates as parameters so the "Clear" button can work instantly 
    // without waiting for React state to cycle.
    const fetchData = useCallback(async (page = 1, start = startDate, end = endDate) => {
        if (!userds) return
        setLoading(true)
        try {
            let url = `/api/withdrawalreport/eachuserseccess/${userds}?page=${page}&limit=20`
            
            if (start && end) {
                url += `&startDate=${start}&endDate=${end}`
            }

            const res = await fetch(url)
            const result = await res.json()
            
            if (result.success) {
                setData(result.data)
                setTotalPages(result.totalPages || 1)
                setCurrentPage(result.currentPage || 1)
                if (result.summary) {
                    setSummary(result.summary)
                }
            }
        } catch (err) {
            console.error('Failed to fetch data', err)
        } finally {
            setLoading(false)
        }
    }, [userds, startDate, endDate])

    // Load data initially or when page changes
    useEffect(() => {
        if (userds) {
            fetchData(currentPage, startDate, endDate)
        }
    }, [currentPage, userds])

    const handleFilter = () => {
        setCurrentPage(1)
        fetchData(1, startDate, endDate)
    }

    const handleClearFilter = () => {
        setStartDate('')
        setEndDate('')
        setCurrentPage(1)
        fetchData(1, '', '') // Fetch immediately with empty dates
    }

    const handleExport = () => {
        const records = selectedIds.length > 0
            ? data.filter(item => selectedIds.includes(item.dsid))
            : data

        if (records.length === 0) return alert('No records to export.')

        const formatted = records.map(item => ({
            DSID: item.dsid,
            Name: item.name,
            'A/C No': item.acnumber,
            IFSC: item.ifscCode,
            Bank: item.bankName,
            Amount: item.amount,
            'TDS': ((item.charges * 2) / 5).toFixed(2),
            'Service Charge': ((item.charges * 3) / 5).toFixed(2),
            'Pay Amount': item.payamount,
            ApproveDate: item.statusapprovedate ? new Date(item.statusapprovedate).toLocaleDateString('en-IN') : '',
        }))

        const worksheet = XLSX.utils.json_to_sheet(formatted)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Withdrawals')
        XLSX.writeFile(workbook, 'WithdrawalReport.xlsx')
    }

    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? data.map(item => item.dsid) : [])
    }

    const toggleCheckbox = (dsid) => {
        setSelectedIds(prev =>
            prev.includes(dsid) ? prev.filter(id => id !== dsid) : [...prev, dsid]
        )
    }

    return (
        <div className="p-4 space-y-6">
            <h1 className="font-semibold text-xl underline text-gray-800">Success Withdrawal</h1>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                    <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                    <p className="text-xl font-bold text-blue-900">₹{summary.totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                    <p className="text-sm text-red-600 font-medium">Total TDS</p>
                    <p className="text-xl font-bold text-red-900">₹{summary.totalTds.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 shadow-sm">
                    <p className="text-sm text-yellow-600 font-medium">Total Service Charge</p>
                    <p className="text-xl font-bold text-yellow-900">₹{summary.totalServiceCharge.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100 shadow-sm">
                    <p className="text-sm text-green-600 font-medium">Total Pay Amount</p>
                    <p className="text-xl font-bold text-green-900">₹{summary.totalPayAmount.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Filter & Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg border shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1 font-medium">From Approved Date</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                            className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1 font-medium">To Approved Date</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                            className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                        />
                    </div>
                    <div className="flex gap-2 self-end mb-0.5">
                        <button 
                            onClick={handleFilter} 
                            className="px-5 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
                        >
                            Filter
                        </button>
                        <button 
                            onClick={handleClearFilter} 
                            className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded hover:bg-gray-300 transition"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                <div className="self-end mb-0.5">
                    <button
                        onClick={handleExport}
                        className="px-6 py-2 bg-yellow-500 text-white font-medium rounded hover:bg-yellow-600 transition"
                    >
                        Export to Excel
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-auto rounded-xl border border-gray-300 shadow-md">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading data...</div>
                ) : data.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No data found</div>
                ) : (
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-3 text-center border">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === data.length && data.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4"
                                    />
                                </th>
                                <th className="p-3 border">DSID</th>
                                <th className="p-3 border">Name</th>
                                <th className="p-3 border">A/C No</th>
                                <th className="p-3 border">IFSC</th>
                                <th className="p-3 border">Bank</th>
                                <th className="p-3 border">Amount</th>
                                <th className="p-3 border">TDS (2%)</th>
                                <th className="p-3 border">Service Charge (3%)</th>
                                <th className="p-3 border">Pay Amount</th>
                                <th className="p-3 border">Approve Date</th>
                                <th className="p-3 border text-center">UTR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="p-3 border text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.dsid)}
                                            onChange={() => toggleCheckbox(item.dsid)}
                                            className="w-4 h-4"
                                        />
                                    </td>
                                    <td className="p-3 border">{item.dsid}</td>
                                    <td className="p-3 border">{item.name}</td>
                                    <td className="p-3 border">{item.acnumber || '-'}</td>
                                    <td className="p-3 border">{item.ifscCode || '-'}</td>
                                    <td className="p-3 border">{item.bankName || '-'}</td>
                                    <td className="p-3 border">{parseFloat(item.amount).toLocaleString('en-IN')}</td>
                                    <td className="p-3 border text-red-600 font-medium">
                                        ₹{((parseFloat(item.charges) * 2) / 5).toLocaleString("en-IN")}
                                    </td>
                                    <td className="p-3 border text-yellow-600 font-medium">
                                        ₹{((parseFloat(item.charges) * 3) / 5).toLocaleString("en-IN")}
                                    </td>
                                    <td className="p-3 border text-green-600 font-medium">
                                        {parseFloat(item.payamount).toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-3 border">
                                        {item.statusapprovedate
                                            ? new Date(item.statusapprovedate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })
                                            : '—'}
                                    </td>
                                    <td className="p-3 border text-center">{item.utr || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-4 gap-4">
                <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                    Prev
                </button>
                <span className="text-sm font-semibold text-gray-700">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    )
}