"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { Search, X, ChevronLeft, ChevronRight, Eye, Code, Calendar } from 'lucide-react';


export default function Page() {
    // State for data, loading, and errors
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

 
   
    // Effect to fetch data when page or applied filters change
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);


            try {
                const response = await axios.get("/api/todaygreen",);
                // The backend already sorts, but client-side sort is fine as a fallback
                const sortedData = (response.data.todayGreenUsers);
                console.log(sortedData,"pl")
                setData(sortedData);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to load user data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);



    // Helper to render the main content area
    const renderContent = () => {
        if (loading) return <TableSkeletonLoader />;
        if (error) return <ErrorMessage message={error} />;
        if (data.length === 0) return <NoResultsMessage />;
        return <UserTable users={data} />;
    };

    return (
        <div className="">
            <div className=" mx-auto">
                <header className="mb-2 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">Today Green Id</h1>

                </header>


                <div className="bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                    {renderContent()}
                </div>

            </div>
        </div>
    );
}



const UserTable = React.memo(({ users }) => (
    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
            <tr>
                <th scope="col" className="px-6 py-4">User</th>
                <th scope="col" className="px-6 py-4">Spo Code</th>
                <th scope="col" className="px-6 py-4 hidden sm:table-cell">Group</th>
                <th scope="col" className="px-6 py-4 hidden sm:table-cell">Mobile</th>
                <th scope="col" className="px-6 py-4 hidden md:table-cell">Level</th>
                <th scope="col" className="px-6 py-4 hidden lg:table-cell">Active Sp</th>
                <th scope="col" className="px-6 py-4 hidden lg:table-cell">Joining Date</th>
                <th scope="col" className="px-6 py-4 hidden lg:table-cell">Activation Date</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Password</th>
                <th scope="col" className="px-6 py-4 text-right">Dashboard</th>
                <th scope="col" className="px-6 py-4 text-right">Action</th>
            </tr>
        </thead>
        <tbody>
            {users.map((user) => (
                <tr key={user.dscode} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold">{user.name}</div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs truncate">{user.dscode}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">{user.pdscode}</td>
                    <td className="px-6 py-4 hidden sm:table-cell">{user.group}</td>
                    <td className="px-6 py-4 hidden sm:table-cell">{user.mobileNo}</td>
                    <td className="px-6 py-4 hidden md:table-cell">{user.level || 'N/A'}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">{user.activesp}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                        {new Date(user.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                        {new Date(user.activedate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}
                    </td>

                    <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.usertype === "1"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}>
                            {user.usertype === "1" ? "Active" : "Inactive"}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <span>{user.plainpassword}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <Link
                            href={`/superadmin/Report/allreport/${user.dscode}?email=${encodeURIComponent(user.email)}`}
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                            <Eye size={14} />
                            <span>View</span>
                        </Link>
                    </td>

                    <td className="px-6 py-4 text-right">
                        <Link href={`/superadmin/Userprofile/user/${user.email}`} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                            <Eye size={14} />
                            <span>View</span>
                        </Link>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
));

const TableSkeletonLoader = () => (
    <div className="w-full p-4">
        <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-full mb-4"></div>
            {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md w-full mb-2.5"></div>
            ))}
        </div>
    </div>
);

const ErrorMessage = React.memo(({ message }) => (
    <div className="text-center py-16">
        <X className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-medium text-red-600 dark:text-red-400">Oops! Something went wrong.</h3>
        <p className="mt-1 text-md text-gray-500 dark:text-gray-400">{message}</p>
    </div>
));

const NoResultsMessage = React.memo(() => (
    <div className="text-center py-16">
        <Search className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-800 dark:text-white">No Users Found</h3>
        <p className="mt-1 text-md text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
    </div>
));
