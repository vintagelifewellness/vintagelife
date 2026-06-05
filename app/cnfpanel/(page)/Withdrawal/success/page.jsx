'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import axios from 'axios'
import { useSession } from 'next-auth/react' 

export default function CandFSuccessReport() {
  const { data: session } = useSession() 
  const [userds, setUserds] = useState('') 
  const [data, setData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.email) return
      try {
 
        const res = await axios.get(`/api/c&f/withdrawal/get-id-by-email/${session.user.email}`)
        setUserds(res.data?.dscode || '')
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }
    fetchUserData()
  }, [session?.user?.email])

  const fetchData = async (page = 1) => {
    if (!userds) return 

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: 'true', 
        dscode: userds 
      });

      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const res = await fetch(`/api/c&f/get-candf-points-closing?${params}`);
      const result = await res.json();
      
      if (result.success) {
        // DOUBLE SECURITY
        const myPersonalData = result.data.filter(
          (item) => String(item.dsid) === String(userds)
        );

        setData(myPersonalData);
        setTotalPages(result.totalPages || 1);
        setCurrentPage(result.currentPage || 1);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fromDate, toDate, userds]); 


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
      'Paid Amount': item.payamount,
      'Approve Date': item.statusapprovedate ? new Date(item.statusapprovedate).toLocaleDateString() : '—',
      UTR: item.utr
    }))

    const worksheet = XLSX.utils.json_to_sheet(formatted)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'My Success Report')
    XLSX.writeFile(workbook, `My_Points_Report_${userds}.xlsx`) 
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

  return (
    <div className="p-4 space-y-6">
      <h1 className='text-2xl font-bold text-green-700 uppercase underline'>My Success Points</h1>

      <div className="flex flex-wrap gap-4 justify-between items-end">
        <div className="flex gap-4">
            <DatePicker
            selected={fromDate ? new Date(fromDate) : null}
            onChange={(date) => {
                setFromDate(date ? date.toISOString().split('T')[0] : '')
                setCurrentPage(1)
            }}
            placeholderText="From Date"
            className="px-3 py-2 border rounded"
            dateFormat="yyyy-MM-dd"
            isClearable
            />

            <DatePicker
            selected={toDate ? new Date(toDate) : null}
            onChange={(date) => {
                setToDate(date ? date.toISOString().split('T')[0] : '')
                setCurrentPage(1)
            }}
            placeholderText="To Date"
            className="px-3 py-2 border rounded"
            dateFormat="yyyy-MM-dd"
            isClearable
            />
        </div>

        <button
          onClick={handleExport}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
        >
          Export to Excel
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-gray-300 shadow-md">
        {data.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-medium">No success records found</div>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead className="bg-green-50 text-gray-700">
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
                <th className="p-3 border">A/C No</th>
                <th className="p-3 border text-center">Last Month Pts</th>
                <th className="p-3 border text-center text-blue-600">Used Pts</th>
                <th className="p-3 border font-bold text-green-700">Paid Amount</th>
                <th className="p-3 border text-center">Approve Date</th>
                <th className="p-3 border">UTR / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-3 border text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.dsid)}
                      onChange={() => handleCheckboxChange(item.dsid)}
                    />
                  </td>
                  <td className="p-3 border">{item.dsid}</td>
                  <td className="p-3 border font-semibold">{item.name}</td>
                  <td className="p-3 border">{item.acnumber || '-'}</td>
                  <td className="p-3 border text-center">{item.lastmatchpoint || 0}</td>
                  <td className="p-3 border text-center font-bold text-blue-600">{item.usepoint || 0}</td>
                  <td className="p-3 border font-bold text-green-700">₹{item.payamount}</td>
                  <td className="p-3 border text-center">
                    {item.statusapprovedate
                      ? new Date(item.statusapprovedate).toLocaleDateString('en-IN', {
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